import { User } from "../db/models/User.js";
import { getFriendsFormat } from "../utils/userInfo.js";
import { verifyAuthToken } from "./userAuth.js";
import { Comment } from "../db/models/Comment.js";

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

export async function getComments(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }

  const comments = await Comment.find({
    _id: { $in: user.comments_ids },
  }).exec();

  const filteredComments = comments.filter((comment) => comment != null);

  return {
    success: true,
    msg: "Your comments are retrieved successfully",
    comments: filteredComments,
  };
}
