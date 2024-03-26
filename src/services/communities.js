//import { Post } from "../db/models/Post.js";
import { Community } from "../db/models/Community.js";
import { CommunityContentControls } from "../db/models/communityContentControls.js";
import { CommunityPostsAndComments } from "../db/models/communityPostsAndComments.js";
import { CommunityGeneralSettings } from "../db/models/communityGeneralSettings.js";

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
    console.log(savedCommunity);

    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Get Settings //////////////////////////////////////////////////////////////
const getCommunityGenerlSettings = async (community_name) => {
  try {
    const community = await Community.findOne({ name: community_name })
      .populate("general_settings")
      .exec();

    return { general_settings: community.general_settings };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getCommunityContentControls = async (community_name) => {
  try {
    let community = await Community.findOne({ name: community_name })
      .populate("content_controls")
      .exec();

    return { content_controls: community.content_controls };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getCommunityPostsCommentsSettings = async (community_name) => {
  try {
    let community = await Community.findOne({ name: community_name })
      .populate("posts_and_comments")
      .exec();

    return { posts_and_comments: community.posts_and_comments };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Change Settings //////////////////////////////////////////////////////////////
const changeCommunityGeneralSettings = async (
  community_name,
  general_settings
) => {
  try {
    const community = await Community.findOne({ name: community_name });

    const communityGeneralSettings = await CommunityGeneralSettings.findById(
      community.general_settings
    );

    Object.assign(communityGeneralSettings, general_settings);

    await communityGeneralSettings.save();

    return { updated_general_settings: communityGeneralSettings };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const changeCommunityContentControls = async (
  community_name,
  content_controls
) => {
  try {
    const community = await Community.findOne({ name: community_name });

    const communityContentControls = await CommunityContentControls.findById(
      community.content_controls
    );

    Object.assign(communityContentControls, content_controls);

    await communityContentControls.save();

    return { updated_content_controls: communityContentControls };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const changeCommunityPostsCommentsSettings = async (
  community_name,
  posts_and_comments
) => {
  try {
    const community = await Community.findOne({ name: community_name });

    const communityPostsAndComments = await CommunityPostsAndComments.findById(
      community.posts_and_comments
    );

    Object.assign(communityPostsAndComments, posts_and_comments);

    await communityPostsAndComments.save();

    return { updated_posts_and_comments: communityPostsAndComments };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Posts Retrieval //////////////////////////////////////////////////////////////

const addPostToCommunity = async (community_name, requestBody) => {
  const { title, description } = requestBody;
  try {
    const community = await Community.findOne({ name: community_name });
    const post = new Post({
      title,
      description,

    });

    await post.save();

    community.posts.push(post._id);

    await community.save();

    return { post: post };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getPostsByCommunityCategory = async (category) => {
  try {
    const posts = await Community.aggregate([
      {
        $match: { category: category },
      },
      {
        $lookup: {
          from: "posts",
          localField: "posts",
          foreignField: "_id",
          as: "mergedPosts",
        },
      },
      {
        $unwind: "$mergedPosts",
      },
      {
        $replaceRoot: { newRoot: "$mergedPosts" },
      },
    ]);

    return { posts: posts };
  } catch (error) {
    console.error(error);
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
//////////////////////////////////////////////////////////////////////// Statistics //////////////////////////////////////////////////////////////
const getCommunityMembersCount = async (community_name) => {
  try {
    const community = await Community.findOne({ name: community_name });

    console.log(community.members_count);

    return { members_count: community.members_count };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Community Rules //////////////////////////////////////////////////////////////
const addNewRuleToCommunity = async (requestBody) => {
  let {
    community_name,
    rule_title,
    applies_to,
    report_reason,
    full_description,
  } = requestBody;

  try {
    const community = await communityNameExists(community_name);
    console.log(community);

    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }
    const rule_order = community.rules_ids.length + 1;
    report_reason = report_reason || rule_title;
    full_description = full_description || "";

    const new_rule = new Rule({
      rule_title,
      rule_order,
      applies_to,
      report_reason,
      full_description,
    });
    if (!community.rules_ids) {
      community.rules_ids = [];
    }
    console.log("*******************")
    console.log(community.rules_ids)
    community.rules_ids.push(new_rule._id);
    await new_rule.save();
    await community.save();
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const editCommunityRule = async (requestBody) => {
  try {
    let {
      community_name,
      rule_id,
      rule_title,
      rule_order,
      applies_to,
      report_reason,
      full_description,
    } = requestBody;
    const rule = await getRuleById(rule_id);

    if (!rule) {
      return { err: "No rule found with this id, enter a valid id." };
    }

    if (rule_title) {
      const new_title = await getRuleByTitle(community_name, rule_title);
      if (new_title && new_title._id.toString() !== rule._id.toString()) {
        return {
          err: "The updated title already exists, enter a different title.",
        };
      }
    }
    rule.rule_title = rule_title || rule.rule_title;
    rule.applies_to = applies_to || rule.applies_to;
    rule.report_reason = report_reason || rule.report_reason;
    rule.full_description = full_description || rule.full_description;
    rule.rule_order = rule_order || rule.rule_order;
    await rule.save();
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
const deleteCommunityRule = async (requestBody) => {
  let { community_name, rule_id } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }

    community.rules_ids = community.rules_ids.filter(
      (rule) => rule !== rule_id
    );

    await community.save();
    await deleteRule(rule_id);
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getCommunityRules = async (community_name) => {
  const community = await communityNameExists(community_name);
  if (!community) {
    return { err: { status: 500, message: "community name does not exist " } };
  }
  const ids = community.rules_ids;
  const rules = [];
  for (const id of ids) {
    const rule = await getRuleById(id);
    if (rule) {
      rules.push(rule);
    }
  }
  console.log(rules);
  console.log(community);
  return { rules: rules };
};

//////////////////////////////////////////////////////////////////////// Approve Users //////////////////////////////////////////////////////////////
// TODO: Validation - User already approved.
const approveUser = async (requestBody) => {
  try {
    const { username, community_name } = requestBody;
    console.log(username, community_name);

    const user = await User.findOne({ username: username });
    if (!user) {
      return { err: { status: 400, message: "Username not found." } };
    }

    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 400, message: "Community not found." } };
    }
    console.log(community);
    // Check if user ID already exists in the approved_users array of the community
    const isAlreadyApproved = isUserAlreadyApproved(community, user._id);
    if (isAlreadyApproved) {
      return {
        err: {
          status: 400,
          message: "User is already approved in this community.",
        },
      };
    }

    community.approved_users.push({ id: user._id, approved_at: new Date() });
    await community.save();
    console.log(community.approved_users);
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
////////////////////////////////////////////////Mute Unmute Users///////////////////////////////////////////
const muteUser = async (requestBody) => {
  try {
    const { username, community_name, action } = requestBody;
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 400, message: "Community not found." } };
    }
    const user = await User.findOne({ username: username });
    if (!user) {
      return { err: { status: 400, message: "Username not found." } };
    }

    if (action == "mute") {
      if (!community.muted_users) {
        community.muted_users = [];
      }
      community.muted_users.push(user._id);
      await community.save();

    }
    else if (action == "unmute") {
      console.log("before filter")
      console.log(community.muted_users);
      //delete from muted users id where username is equal to the username in the request body
      community.muted_users = community.muted_users.filter((id) => id.toString() !== user._id.toString());
      await community.save();
      console.log("after filter")
      console.log(community.muted_users);
    }
    return { success: true };
  }
  catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
// TODO: I cant find this feature in reddit , i dont know what is the exact attributes we need to return here
const getMutedUsers = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 400, message: "Community not found." } };
    }
    console.log(community)
    const muted_users_ids = community.muted_users;
    const muted_users = await getUsersByIds(muted_users_ids);
    console.log(muted_users);
    return { users: muted_users };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}

//////////////////////////////////////////////Ban Users///////////////////////////////////////////
const banUser = async (requestBody) => {
  try {
    const { username, community_name, action } = requestBody;
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 400, message: "Community not found." } };
    }
    const user = await User.findOne({ username: username });
    if (!user) {
      return { err: { status: 400, message: "Username not found." } };
    }
    if (action == "ban") {
      if (!community.banned_users) {
        community.banned_users = [];
      }
      community.banned_users.push(user._id);
      await community.save();
    }
    else if (action == "unban") {
      console.log(user._id.toString())
      console.log(community.banned_users[0]._id.toString())
      community.banned_users = community.banned_users.filter((id) => id.toString() !== user._id.toString());
      await community.save();
    }
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}
const getBannedUsers = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return { err: { status: 400, message: "Community not found." } };
    }
    const banned_users_ids = community.banned_users;
    const banned_users = await getUsersByIds(banned_users_ids);
    return { users: banned_users };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
}



//Profile picture is not showing
const getApprovedUsers = async (community_name) => {
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }

    // Fetch user views for each approved user
    const users = await Promise.all(
      community.approved_users.map(async (userObj) => {
        const userView = await getApprovedUserView({
          id: userObj.id,
          approved_at: userObj.approved_at,
        });
        return userView;
      })
    );

    console.log(users);

    return { users }; // Return the users array
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const getAllUsers = async () => {
  try {
    const users = await User.find({});
    return { users: users };
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

    return {
      widget: { members_nickname, currently_viewing_nickname, description },
    };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Profile Picture //////////////////////////////////////////////////////////////
const addCommunityProfilePicture = async (requestBody) => {
  const { community_name, profile_picture } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }
    community.profile_picture = profile_picture;
    const savedCommunity = await community.save();

    console.log(savedCommunity);
    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

const deleteCommunityProfilePicture = async (requestBody) => {
  const { community_name } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }
    community.profile_picture = "none";
    const savedCommunity = await community.save();

    console.log(savedCommunity);
    return { sucess: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};

//////////////////////////////////////////////////////////////////////// Profile Picture //////////////////////////////////////////////////////////////
const addCommunityBannerPicture = async (requestBody) => {
  const { community_name, banner_picture } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }

    community.banner_picture = banner_picture;
    const savedCommunity = await community.save();
    console.log(savedCommunity);
    console.log(savedCommunity.banner_picture);

    return { success: true };
  } catch (error) {
    return { err: { status: 500, message: error.message } };
  }
};
const deleteCommunityBannerPicture = async (requestBody) => {
  const { community_name } = requestBody;
  try {
    const community = await communityNameExists(community_name);
    if (!community) {
      return {
        err: { status: 500, message: "community name does not exist " },
      };
    }

    community.banner_picture = "none";
    const savedCommunity = await community.save();

    console.log(savedCommunity);
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
  getCommunityGenerlSettings,
  getCommunityContentControls,
  getCommunityPostsCommentsSettings,
  changeCommunityGeneralSettings,
  changeCommunityContentControls,
  changeCommunityPostsCommentsSettings,
  addPostToCommunity,
  getPostsByCommunityCategory,
  getCommunityMembersCount,
  addNewRuleToCommunity,
  editCommunityRule,
  deleteCommunityRule,
  getCommunityRules,
  approveUser,
  getApprovedUsers,
  getAllUsers,
  getDetailsWidget,
  editDetailsWidget,
  addCommunityProfilePicture,
  deleteCommunityProfilePicture,
  addCommunityBannerPicture,
  deleteCommunityBannerPicture,
  getComments,
  addComment,
  getMutedUsers,
  muteUser,
  banUser,
  getBannedUsers
};
