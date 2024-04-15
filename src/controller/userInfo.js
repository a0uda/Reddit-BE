import { User } from "../db/models/User.js";
import { getAboutFormat, getFriendsFormat } from "../utils/userInfo.js";
import { verifyAuthToken } from "./userAuth.js";
import {
  getCommentsHelper,
  getPostsHelper,
  getCommunitiesHelper,
  getModeratedCommunitiesHelper,
  getUserPostsHelper,
  getUserCommentsHelper,
} from "../services/users.js";
import { generateResponse } from "../utils/generalUtils.js";

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
  console.log(user);
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

export async function getUserPosts(request, postType) {
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
    const posts = await getUserPostsHelper(user, postType);
    return {
      success: true,
      status: 200,
      posts,
      msg: "Posts retrieved successfully.",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getPosts(request) {
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
    const posts = await getPostsHelper(user);
    return {
      success: true,
      status: 200,
      posts,
      msg: "Posts retrieved successfully.",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getUserComments(request) {
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

    const comments = await getUserCommentsHelper(user);
    return {
      success: true,
      status: 200,
      comments,
      msg: "  Comments retrieved successfully.",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getComments(request) {
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
    const comments = await getCommentsHelper(user);
    return {
      success: true,
      status: 200,
      comments,
      msg: "Comments retrieved successfully.",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}

export async function getOverview(request) {
  try {
    const { username } = request.params;
    if (!username) {
      return generateResponse(false, 400, "Missing Username in params");
    }
    const user = await User.findOne({ username });
    if (!user) {
      return generateResponse(false, 404, "No user found with username");
    }
    const posts = await getUserPostsHelper(user);
    const comments = await getUserCommentsHelper(user);

    return {
      success: true,
      message: "Comments and posts retrieved successfully",
      overview: { posts: posts, comments: comments },
    };
  } catch (error) {
    console.error("Error:", error);
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

    return {
      success: true,
      message: "About retrieved successfully",
      about: about,
    };
  } catch (error) {
    console.error("Error:", error);
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
        moderated_communities: moderatedCommunities,
      };
    } else {
      const communities = await getCommunitiesHelper(user);
      return {
        success: true,
        status: 200,
        msg: "Your communities are retrieved successfully",
        communities: communities,
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };
  }
}
