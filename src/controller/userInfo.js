import { User } from "../db/models/User.js";
import { getFriendsFormat } from "../utils/userInfo.js";
import { verifyAuthToken } from "./userAuth.js";
import {
  getCommentsHelper,
  getPostsHelper,
  getCommunitiesHelper,
  getModeratedCommunitiesHelper,
} from "../services/users.js";

export async function getFollowers(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return { success, err, status, user, msg };
  }
  const followerDetails = await Promise.all(
    user.followers_ids.map(async (followerId) => {
      const follower = await User.findById(followerId);
      if (follower) return getFriendsFormat(follower);
    })
  ).then((details) => details.filter((detail) => detail != null));

  if (followerDetails.length == 0) {
    return { success: false, status: 400, err: "User has no followers" };
  }
  return {
    success: true,
    users: followerDetails,
  };
}

export async function getFollowing(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }
  const followingDetails = await Promise.all(
    user.following_ids.map(async (followingId) => {
      const following = await User.findById(followingId);
      return getFriendsFormat(following);
    })
  );
  if (followingDetails.length == 0) {
    return { success: false, status: 400, err: "User follows no one" };
  }

  return {
    success: true,
    users: followingDetails,
  };
}

export async function getFollowersCount(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  // console.log(success, err, status, user, msg);
  if (!user) {
    return { success, err, status, user, msg };
  }
  const followersUsers = user.followers_ids;
  return {
    success: true,
    count: followersUsers.length,
  };
}

export async function getFollowingCount(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }
  const followingUsers = user.following_ids;

  return {
    success: true,
    count: followingUsers.length,
  };
}

export async function getPosts(request, postType) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    if (!user) {
      return { success, err, status, user, msg };
    }

    const posts = await getPostsHelper(user, postType);

    return {
      success: true,
      status: 200,
      posts: posts,
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

export async function getComments(request, commentType) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }

  const comments = await getCommentsHelper(user, commentType);

  return {
    success: true,
    msg: "Your comments are retrieved successfully",
    comments: comments,
  };
}

export async function getOverview(request, postType, commentType) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }

  const posts = await getPostsHelper(user, postType);
  const comments = await getCommentsHelper(user, commentType);

  return {
    success: true,
    msg: "Your comments are retrieved successfully",
    overview: { Posts: posts, Comments: comments },
  };
}

export async function getCommunities(request, communityType) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }
  // to be continued...
}
