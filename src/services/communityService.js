import mongoose from "mongoose";

import { Community } from "../db/models/Community.js";
import { CommunityContentControls } from "../db/models/communityContentControls.js";
import { CommunityPostsAndComments } from "../db/models/communityPostsAndComments.js";
import { CommunityGeneralSettings } from "../db/models/communityGeneralSettings.js";
import { DiscussionItemMinimal } from "../db/models/communityDiscussionItemMinimal.js";

import { verifyAuthToken } from "../controller/userAuth.js";
//import { CommunityAppearance } from "../db/models/communityAppearance.js";

import { User } from "../db/models/User.js"; //delete this line
import { Rule } from "../db/models/Rule.js";
import { TempComment } from "../db/models/temp-files/TempComment.js";

import {
  isUserAlreadyApproved,
  communityNameExists,
  getRuleByTitle,
  getUsersByIds,
  getRuleById,
  deleteRule,
  getApprovedUserView,
} from "../utils/communities.js";

const addNewCommunity = async (requestBody, creator) => {
  const { name, type, nsfw_flag, category } = requestBody;

  const communityGeneralSettings = new CommunityGeneralSettings();
  const communityContentControls = new CommunityContentControls();
  const communityPostsAndComments = new CommunityPostsAndComments();

  communityGeneralSettings.title = name;
  communityGeneralSettings.type = type;
  communityGeneralSettings.nsfw_flag = nsfw_flag;

  const community = new Community({
    name,
    category,
    owner: creator._id,
    moderators: [
      {
        username: creator.username,
      },
    ],
    joined_users: [
      {
        username: creator.username,
      },
    ],
    general_settings: communityGeneralSettings._id,
    content_controls: communityContentControls._id,
    posts_and_comments: communityPostsAndComments._id,
  });

  try {
    const duplicate_community = await Community.findOne({ name: name });

    if (duplicate_community) {
      return {
        err: { status: 400, message: "Community name is already taken." },
      };
    }

    await communityGeneralSettings.save();
    await communityContentControls.save();
    await communityPostsAndComments.save();

    const savedCommunity = await community.save();

    //add community id to user moderated communities
    creator.moderated_communities.push({
      id: savedCommunity._id,
      favorite_flag: false,
    });
    await creator.save();

    return { community: savedCommunity };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Discussion Item //////////////////////////////////////////////////////////////
const addDiscussionItemToCommunity = async (community_name, requestBody) => {
  const { title, description, discussion_item_type } = requestBody;
  try {
    const community = await Community.findOne({ name: community_name });

    const discussionItemMinimal = new DiscussionItemMinimal({
      title,
      description,
      discussion_item_type: discussion_item_type,
      written_in_community: community._id,
      marked_as_spam_by_a_moderator: false,
    });

    await discussionItemMinimal.save();

    if (discussion_item_type === "post") {
      community.posts.push(discussionItemMinimal._id);
    } else if (discussion_item_type === "comment") {
      community.comments.push(discussionItemMinimal._id);
    }

    await community.save();

    return { item: discussionItemMinimal };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getDiscussionItemsByCommunityCategory = async (
  category,
  discussion_item_type
) => {
  try {
    const items = await Community.aggregate([
      {
        $match: { category: category },
      },
      {
        $lookup: {
          from: "discussionitemminimals",
          localField: discussion_item_type === "post" ? "posts" : "comments",
          foreignField: "_id",
          as: "mergedItems",
        },
      },
      {
        $unwind: "$mergedItems",
      },
      {
        $replaceRoot: { newRoot: "$mergedItems" },
      },
      {
        $match: { discussion_item_type: { $in: ["post", "comment"] } },
      },
    ]);

    return { items };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getDiscussionItemsByRandomCategory = async (discussion_item_type) => {
  try {
    const categories = mongoose
      .model("Community")
      .schema.path("category").enumValues;

    const category = categories[Math.floor(Math.random() * categories.length)];

    const items = await Community.aggregate([
      {
        $match: { category: category },
      },
      {
        $lookup: {
          from: "discussionitemminimals",
          localField: discussion_item_type === "post" ? "posts" : "comments",
          foreignField: "_id",
          as: "mergedItems",
        },
      },
      {
        $unwind: "$mergedItems",
      },
      {
        $replaceRoot: { newRoot: "$mergedItems" },
      },
      {
        $match: { discussion_item_type: { $in: ["post", "comment"] } },
      },
    ]);

    return { items };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//////////////////////////////////////////////////////////////////////// Statistics //////////////////////////////////////////////////////////////
const getCommunityMembersCount = async (community_name) => {
  try {
    const community = await Community.findOne({ name: community_name });

    return { members_count: community.members_count };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Comments Retrieval //////////////////////////////////////////////////////////////
//to be extended -> I needed this to test moderation
//should we store ids of posts owners or the username itself?
const addComment = async (requestBody) => {
  const { description } = requestBody;
  try {
    const comment = new TempComment({
      description,
    });
    await comment.save();
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//to be extended -> I needed this to test moderation
const getComments = async () => {
  try {
    const comments = await TempComment.find();
    return { comments: comments };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Details Widget //////////////////////////////////////////////////////////////
/**
 *
 * @param {String} community_name
 * @returns {Object}
 * {
 * widget: {
 * members_nickname: String,
 * currently_viewing_nickname: String,
 * description: String
 * }
 * }
 * or
 * {
 * err: {
 * status: 500,
 * message: String
 * }
 * }
 *
 * @example
 * input: "community_name"
 * output: {
 * widget: {
 * members_nickname: "members_nickname",
 * currently_viewing_nickname: "currently_viewing_nickname",
 * description: "description"
 * }
 * }
 */
const getDetailsWidget = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      console.log("inside the if ");
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }
    return {
      widget: {
        members_nickname: community.members_nickname,
        currently_viewing_nickname: community.currently_viewing_nickname,
        description: community.description,
      },
    };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
/**
 *
 * @param {object} requestBody
 * @property {String} community_name
 * @property {String} members_nickname
 * @property {String} currently_viewing_nickname
 * @property {String} description
 *
 * @returns
 * {
 * success: true
 * }
 * or
 * {
 * err: {
 * status: 500,
 * message: String
 * }
 * }
 * @example
 * input: {
 * community_name: "community_name",
 * members_nickname: "members_nickname",
 * currently_viewing_nickname: "currently_viewing_nickname",
 * description: "description"
 * }
 * output: {
 * success: true
 * }
 */
const editDetailsWidget = async (requestBody) => {
  const {
    community_name,
    members_nickname,
    currently_viewing_nickname,
    description,
  } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }
    if (community) {
      community.members_nickname =
        members_nickname || community.members_nickname;
      community.currently_viewing_nickname =
        currently_viewing_nickname || community.currently_viewing_nickname;
      community.description = description || community.description;
      await community.save();
    }
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
const getMembersCount = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 400, message: "community name does not exist " },
      };
    }
    console.log(community.members_count);
    return { members_count: community.members_count };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
//get community function added
const getCommunity = async (request) => {
  try {
    //use verifyAuth to check if the user is authenticated
    const community_name = request.params.community_name;
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      //return error in auth token
      return { err: { status: status, message: msg } };
    }
    //check if user username exist in the community.approved_users.username 
    const joined_flag = await Community.findOne({ name: community_name, approved_users: { $elemMatch: { username: user.username } } });
    const community = await Community.findOne({ name: community_name });
    if (!community) {
      return { err: { status: 400, message: "community does not exist " } };
    }
    const general_settings_id = community.general_settings;
    const general_settings = await CommunityGeneralSettings.findById(general_settings_id);

    const returned_community = {
      community: {
        description: general_settings.description,
        type: general_settings.type, //enum: ["Public", "Private", "Restricted"],
        nsfw_flag: general_settings.nsfw_flag,
        members_count: community.members_count,
        profile_picture: community.profile_picture,
        banner_picture: community.banner_picture,
        created_at: community.created_at,
        welcome_message: general_settings.welcome_message.message || "", // sometimes this is empty string
        joined_flag: joined_flag ? true : false,
        title: general_settings.title,
      }

    }

    return returned_community
  }
  catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}

const approveDiscussionItem = async (requestBody) => {
  const { isPost, id } = requestBody;
  try {
    if (isPost) {
      const post = await TempPost.findById(id);
      if (!post) {
        return { err: { status: 500, message: "post does not exist " } };
      }
      post.approved = true;
      await post.save();
    } else {
      const comment = await TempComment.findById(id);
      if (!comment) {
        return { err: { status: 500, message: "comment does not exist " } };
      }
      comment.approved = true;
      await comment.save();
    }
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

export {
  addNewCommunity,
  addDiscussionItemToCommunity,
  getDiscussionItemsByCommunityCategory,
  getDiscussionItemsByRandomCategory,
  getCommunityMembersCount,
  getDetailsWidget,
  editDetailsWidget,
  getMembersCount,
  getComments,
  addComment,
  getCommunity
};
