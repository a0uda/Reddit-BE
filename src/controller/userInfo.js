import { User } from "../db/models/User.js";
import mongoose from "mongoose";
import { getAboutFormat, getFriendsFormat } from "../utils/userInfo.js";
import { verifyAuthToken } from "./userAuth.js";
import {
  getCommentsHelper,
  getPostsHelper,
  getCommunitiesHelper,
  getModeratedCommunitiesHelper,
  getUserPostsHelper,
  getUserCommentsHelper,
  getMutedCommunitiesHelper,
  getBlockedUserHelper,
  getActiveCommunitiesHelper,
} from "../services/users.js";
import { generateResponse } from "../utils/generalUtils.js";
import { checkVotesMiddleware } from "../services/posts.js";
import { checkCommentVotesMiddleware } from "../services/comments.js";
import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { Community } from "../db/models/Community.js";
export async function getFollowers(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return generateResponse(success, status, err);
  }
  const followerDetails = await Promise.all(
    user.followers_ids.map(async (followerId) => {
      const follower = await User.findById(followerId);
      if (follower) return getFriendsFormat(follower);
    })
  ).then((details) => details.filter((detail) => detail != null));

  // if (followerDetails.length === 0) {
  //   return generateResponse(false, 400, "User has no followers");
  // }
  return {
    success: true,
    message: "User followers retrieved successfully",
    users: followerDetails,
  };
}

export async function getFollowing(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return generateResponse(success, status, err);
  }
  const followingDetails = await Promise.all(
    user.following_ids.map(async (followingId) => {
      const following = await User.findById(followingId);
      if (following) return getFriendsFormat(following);
    })
  ).then((details) => details.filter((detail) => detail != null));
  // if (followingDetails.length === 0) {
  //   return generateResponse(false, 400, "User follows no one");
  // }

  return {
    success: true,
    message: "User following retrieved successfully",
    users: followingDetails,
  };
}

export async function getFollowersCount(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return generateResponse(success, status, err);
  }
  const followersUsers = user.followers_ids;
  return {
    success: true,
    message: "User followers count retrieved successfully",
    count: followersUsers.length,
  };
}

export async function getFollowingCount(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return generateResponse(success, status, err);
  }
  const followingUsers = user.following_ids;

  return {
    success: true,
    message: "User following count retrieved successfully",
    count: followingUsers.length,
  };
}

export async function getUserPosts(
  request,
  pageNumber = 1,
  pageSize = 10,
  sortBy
) {
  try {
    const { username } = request.params;
    const user = await User.findOne({ username });
    if (!user) {
      return {
        success: false,
        err: "No user found with username",
        status: 404,
        msg: "User not found",
      };
    }
    const { user: loggedInUser } = await verifyAuthToken(request);
    const posts = await getUserPostsHelper(
      loggedInUser,
      user,
      pageNumber,
      pageSize,
      sortBy
    );

    return {
      success: true,
      status: 200,
      content: posts,
      msg: "Posts retrieved successfully.",
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getPosts(
  request,
  postsType,
  pageNumber = 1,
  pageSize = 10,
  sortBy
) {
  let user = null;
  try {
    const {
      success,
      err,
      status,
      user: authenticatedUser,
      msg,
    } = await verifyAuthToken(request);
    if (!authenticatedUser) {
      return { success, err, status, user: authenticatedUser, msg };
    }
    user = authenticatedUser;

    const posts = await getPostsHelper(
      user,
      postsType,
      pageNumber,
      pageSize,
      sortBy
    );

    return {
      success: true,
      status: 200,
      content: posts,
      message: "Posts retrieved successfully.",
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getUserComments(
  request,
  pageNumber = 1,
  pageSize = 10,
  sortBy
) {
  try {
    const { username } = request.params;
    const user = await User.findOne({ username });
    if (!user) {
      return {
        success: false,
        err: "No user found with username",
        status: 404,
        msg: "User not found",
      };
    }
    const { user: loggedInUser } = await verifyAuthToken(request);
    const comments = await getUserCommentsHelper(
      loggedInUser,
      user,
      pageNumber,
      pageSize,
      sortBy
    );

    return {
      success: true,
      status: 200,
      content: comments,
      message: "  Comments retrieved successfully.",
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getComments(
  request,
  commentsType,
  pageNumber = 1,
  pageSize = 10,
  sortBy
) {
  let user = null;
  try {
    const {
      success,
      err,
      status,
      user: authenticatedUser,
      msg,
    } = await verifyAuthToken(request);
    if (!authenticatedUser) {
      return { success, err, status, user: authenticatedUser, msg };
    }
    user = authenticatedUser;
    console.log("SAVED", user.saved_comments_ids);
    const comments = await getCommentsHelper(
      user,
      commentsType,
      pageNumber,
      pageSize,
      sortBy
    );
    return {
      success: true,
      status: 200,
      content: comments,
      msg: "Comments retrieved successfully.",
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getAllSavedComments(request) {
  let user = null;
  try {
    const {
      success,
      err,
      status,
      user: authenticatedUser,
      msg,
    } = await verifyAuthToken(request);
    if (!authenticatedUser) {
      return { success, err, status, user: authenticatedUser, msg };
    }
    user = authenticatedUser;
    var comments = await Comment.find({
      _id: { $in: user.saved_comments_ids },
    })
      .populate("replies_comments_ids")
      .exec();

    // comments = comments.filter((comment) => comment != null);

    comments = comments.map((comment) => {
      return { ...comment.toObject(), is_post: false };
    });
    
    comments = await checkCommentVotesMiddleware(user, comments);
    
    await Promise.all(
      comments.map(async (comment) => {
        comment.replies_comments_ids = await checkCommentVotesMiddleware(
          user,
          comment.replies_comments_ids
        );
      })
    );

    return {
      success: true,
      status: 200,
      content: comments,
      msg: "Saved Comments retrieved successfully.",
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getAllSavedPosts(request) {
  let user = null;
  try {
    const {
      success,
      err,
      status,
      user: authenticatedUser,
      msg,
    } = await verifyAuthToken(request);
    if (!authenticatedUser) {
      return { success, err, status, user: authenticatedUser, msg };
    }
    user = authenticatedUser;
    var posts = await Post.find({
      _id: { $in: user["saved_posts_ids"] },
    }).exec();

    posts = posts.filter((post) => post != null);

    posts = posts.map((post) => {
      return { ...post.toObject(), is_post: true };
    });

    posts = await checkVotesMiddleware(user, posts);
    return {
      success: true,
      status: 200,
      content: posts,
      msg: "Saved Posts retrieved successfully.",
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving comments.",
    };
  }
}

export async function getOverview(request, pageNumber, pageSize, sortBy) {
  try {
    const { username } = request.params;
    if (!username) {
      return generateResponse(false, 400, "Missing Username in params");
    }
    const user = await User.findOne({ username });
    if (!user) {
      return generateResponse(false, 404, "No user found with username");
    }
    const { user: loggedInUser } = await verifyAuthToken(request);
    var posts = await getUserPostsHelper(
      loggedInUser,
      user,
      pageNumber,
      pageSize,
      sortBy
    );
    var comments = await getUserCommentsHelper(
      loggedInUser,
      user,
      pageNumber,
      pageSize,
      sortBy
    );
    //add is post flag
    posts = posts.map((post) => {
      if (post instanceof mongoose.Document)
        return { ...post.toObject(), is_post: true };
      else return { ...post, is_post: true };
    });
    console.log(posts);
    comments = comments.map((comment) => {
      if (comment instanceof mongoose.Document)
        return { ...comment.toObject(), is_post: false };
      else return { ...comment, is_post: false };
    });

    return {
      success: true,
      message: "Comments and posts retrieved successfully",
      content: { posts, comments },
    };
  } catch (error) {
    //console.error("Error:", error);
    return generateResponse(false, 500, "Internal Server Error");
  }
}

export async function getAbout(request) {
  try {
    const { username } = request.params;
    if (!username) {
      return generateResponse(false, 400, "Missing Username in params");
    }
    const user = await User.findOne({ username });
    if (!user) {
      return generateResponse(false, 404, "No user found with username");
    }
    const about = await getAboutFormat(user);
    const moderatedCommunities = await getModeratedCommunitiesHelper(user);
    return {
      success: true,
      message: "About retrieved successfully",
      about: { ...about, moderatedCommunities },
    };
  } catch (error) {
    //console.error("Error:", error);
    return generateResponse(false, 500, "Internal Server Error");
  }
}

export async function getCommunities(request, communityType) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    if (!user) {
      return { success, err, status, user, msg };
    }
    if (communityType == "moderated") {
      const moderatedCommunities = await getModeratedCommunitiesHelper(user);
      return {
        success: true,
        status: 200,
        msg: "Your moderated communities are retrieved successfully",
        content: moderatedCommunities,
      };
    } else {
      const communities = await getCommunitiesHelper(user);
      return {
        success: true,
        status: 200,
        msg: "Your communities are retrieved successfully",
        content: communities,
      };
    }
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getBlockedUsers(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // console.log(success, err, status, user, msg);
    if (!user) {
      return { success, err, status, user, msg };
    }
    const blocked_users = await getBlockedUserHelper(user);
    // console.log(blocked_users);
    return {
      success: true,
      message: "Your blocked users list is retrieved successfully",
      status: 200,
      content: blocked_users,
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getMutedCommunities(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // console.log(success, err, status, user, msg);
    if (!user) {
      return { success, err, status, user, msg };
    }
    const muted_communities = await getMutedCommunitiesHelper(user);
    return {
      success: true,
      message: "Your muted communities list is retrieved successfully",
      status: 200,
      content: muted_communities,
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getActiveCommunities(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // console.log(success, err, status, user, msg);
    if (!user) {
      return { success, err, status, user, msg };
    }
    const communityIds = user.communities.map((community) => community.id);
    // console.log(communityIds);
    // Combine the conditions for finding posts and comments in communities
    const postsAndCommentsQuery = {
      $or: [
        {
          post_in_community_flag: true,
          community_id: { $in: communityIds },
          user_id: user._id,
        },
        {
          comment_in_community_flag: true,
          community_id: { $in: communityIds },
          user_id: user._id,
        },
      ],
    };

    // Execute the combined query to fetch both posts and comments
    const [posts, comments] = await Promise.all([
      Post.find(postsAndCommentsQuery).exec(),
      Comment.find(postsAndCommentsQuery).exec(),
    ]);

    // Extract unique community IDs from posts and comments
    const activeCommunityIds = [
      ...new Set([
        ...posts.map((post) => post.community_id),
        ...comments.map((comment) => comment.community_id),
      ]),
    ];

    // Fetch active communities using the unique community IDs
    const activeCommunities = await Community.find({
      _id: { $in: activeCommunityIds },
    }).exec();

    const active_communities = await getActiveCommunitiesHelper(
      activeCommunities
    );
    // console.log(active_communities);
    return {
      success: true,
      message: "Your active communities list is retrieved successfully",
      status: 200,
      content: active_communities,
    };
  } catch (error) {
    //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}
