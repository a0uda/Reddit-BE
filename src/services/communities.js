import mongoose from "mongoose";

import { Community } from "../db/models/Community.js";
import { CommunityContentControls } from "../db/models/communityContentControls.js";
import { CommunityPostsAndComments } from "../db/models/communityPostsAndComments.js";
import { CommunityGeneralSettings } from "../db/models/communityGeneralSettings.js";
import { DiscussionItemMinimal } from "../db/models/communityDiscussionItemMinimal.js";

import { User } from "../db/models/User.js"; //delete this line
import { Rule } from "../db/models/Rule.js";
import { TempComment } from "../db/models/temp-files/TempComment.js";
import { Post } from "../db/models/temp-files/Post.js";

import {
  isUserAlreadyApproved,
  communityNameExists,
  getRuleByTitle,
  getUsersByIds,
  getRuleById,
  deleteRule,
  getApprovedUserView,
} from "../utils/communities.js";
/* where are these attributes ?1
 "community_name": "community_44",
  "description": "description_1",
  "content_visibility": "public",
  "mature_content": true
*/
const addNewCommunity = async (requestBody) => {
  const { name, type, nsfw_flag, category } = requestBody;

  const communityGeneralSettings = new CommunityGeneralSettings();
  const communityContentControls = new CommunityContentControls();
  const communityPostsAndComments = new CommunityPostsAndComments();

  const community = new Community({
    name,
    type,
    nsfw_flag,
    category,
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

    return { community_name: savedCommunity.name };
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

    if (discussion_item_type === 'post') {
      community.posts.push(discussionItemMinimal._id);
    } else if (discussion_item_type === 'comment') {
      community.comments.push(discussionItemMinimal._id);
    }

    await community.save();

    return { item: discussionItemMinimal };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getDiscussionItemsByCommunityCategory = async (category, discussion_item_type) => {
  try {
    const items = await Community.aggregate([
      {
        $match: { category: category },
      },
      {
        $lookup: {
          from: "discussionitemminimals",
          localField: discussion_item_type === 'post' ? 'posts' : 'comments',
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
        $match: { discussion_item_type: { $in: ['post', 'comment'] } },
      },
    ]);

    return { items };
  } catch (error) {

    return { err: { status: 500, message: error.message } };
  }
};

const getDiscussionItemsByRandomCategory = async (discussion_item_type) => {
  try {

    const categories = mongoose.model("Community").schema.path("category").enumValues;

    const category = categories[Math.floor(Math.random() * categories.length)];

    const items = await Community.aggregate([
      {
        $match: { category: category },
      },
      {
        $lookup: {
          from: "discussionitemminimals",
          localField: discussion_item_type === 'post' ? 'posts' : 'comments',
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
        $match: { discussion_item_type: { $in: ['post', 'comment'] } },
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

//////////////////////////////////////////////////////////////////////// Mod Queue /////////////////////////////////////////////////////////////////////////
const getRemovedDiscussionItems = async (community_name, time_filter, posts_or_comments) => {
  try {
    // Determine the sort order based on the time_filter
    const sortOrder = time_filter === 'Newest First' ? -1 : 1;

    // Determine the discussion item type based on posts_or_comments
    let itemType;
    if (posts_or_comments.toLowerCase() === 'posts and comments') {
      itemType = ['post', 'comment'];
    } else {
      itemType = posts_or_comments.toLowerCase();
    }

    // Initialize the query object
    let query = {
      marked_as_spam_by_a_moderator: true,
      discussion_item_type: { $in: itemType }
    };

    // If a specific community is specified, add it to the query
    if (community_name !== 'All Subreddits' && community_name != null) {
      const community = await Community.findOne({ name: community_name });
      query.written_in_community = community._id;
    }

    // Fetch the removed discussion items
    const removedDiscussionItems = await DiscussionItemMinimal.find(query).sort({ created_at: sortOrder });

    return removedDiscussionItems;
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getEditedDiscussionItems = async (community_name, time_filter, posts_or_comments) => {
  try {
    // Determine the sort order based on the time_filter
    const sortOrder = time_filter === 'Newest First' ? -1 : 1;

    // Determine the discussion item type based on posts_or_comments
    let itemType;
    if (posts_or_comments.toLowerCase() === 'posts and comments') {
      itemType = ['post', 'comment'];
    } else {
      itemType = posts_or_comments.toLowerCase();
    }

    // Initialize the query object
    let query = {
      edited_flag: true,
      discussion_item_type: { $in: itemType }
    };

    // If a specific community is specified, add it to the query
    if (community_name !== 'All Subreddits' && community_name != null) {
      const community = await Community.findOne({ name: community_name });
      query.written_in_community = community._id;
    }

    // Fetch the edited discussion items
    const editedDiscussionItems = await DiscussionItemMinimal.find(query).sort({ created_at: sortOrder });

    return editedDiscussionItems;
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getUnmoderatedDiscussionItems = async (community_name, time_filter) => {
  try {
    // Determine the sort order based on the time_filter
    const sortOrder = time_filter === 'Newest First' ? -1 : 1;

    // Initialize the query object
    let query = {
      unmoderated_flag: true,
    };

    // If a specific community is specified, add it to the query
    if (community_name !== 'All Subreddits' && community_name != null) {
      const community = await Community.findOne({ name: community_name });
      query.written_in_community = community._id;
    }

    // Fetch the unmoderated discussion items
    const unmoderatedDiscussionItems = await DiscussionItemMinimal.find(query).sort({ created_at: sortOrder });

    return unmoderatedDiscussionItems;
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
//new
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

  getRemovedDiscussionItems,
  getEditedDiscussionItems,
  getUnmoderatedDiscussionItems,

  getDetailsWidget,
  editDetailsWidget,

  getComments,
  addComment,
};