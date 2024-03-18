import { User } from "../db/models/User.js";
import { Post } from "../db/models/Post.js";
import { getFriendsFormat } from "../utils/userInfo.js";
import { verifyAuthToken } from "./userAuth.js";

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

export async function getPosts(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    if (!user) {
      return { success, err, status, user, msg };
    }

    const userPostIds = user.posts_ids;

    const posts = await Post.find({ _id: { $in: userPostIds } }).exec();
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
