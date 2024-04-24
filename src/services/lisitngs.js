import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { getSortCriteria } from "../utils/lisitng.js";
import mongoose from "mongoose";
export async function paginateFollowingPosts(
  followedUsers,
  hidden_posts,
  blockedUsers,
  offset,
  sortCriteria,
  pageSize
) {
  // Extract blocked user IDs from blockedUsers array

  const userPosts = await Post.find({
    user_id: { $in: followedUsers, $nin: blockedUsers },
    _id: { $nin: hidden_posts },
  })
    .sort(sortCriteria)
    .skip(offset)
    .limit(pageSize)
    .exec();

  let posts = [...userPosts];
  if (posts.length < pageSize) {
    const remainingPosts = pageSize - posts.length;

    // Fetch random posts excluding the ones already fetched, hidden posts, and blocked users' posts
    const randomPosts = await Post.aggregate([
      {
        $match: {
          user_id: { $nin: followedUsers, $nin: blockedUsers },
          _id: { $nin: hidden_posts },
        },
      },
      { $sample: { size: remainingPosts } },
      { $sort: sortCriteria },
    ]);

    posts.push(...randomPosts);
  }
  return posts;
}

export async function paginateUserPosts(
  userId,
  hidden_posts,
  offset,
  sortCriteria,
  pageSize
) {
  const userPosts = await Post.find({
    user_id: userId,
    _id: { $nin: hidden_posts },
  })
    .sort(sortCriteria)
    .skip(offset)
    .limit(pageSize)
    .exec();

  return userPosts;
}

export async function paginatePosts(
  user,
  postsType,
  hidden_posts,
  offset,
  sortCriteria,
  pageSize
) {
  const userPosts = await Post.find({
    _id: { $nin: hidden_posts, $in: user[postsType] },
  })
    .sort(sortCriteria)
    .skip(offset)
    .limit(pageSize)
    .exec();

  return userPosts;
}

export async function paginateComments(
  user,
  commentsType,
  offset,
  sortCriteria,
  pageSize
) {
  const userComments = await Comment.find({
    _id: { $in: user[commentsType] },
  })
    .sort(sortCriteria)
    .skip(offset)
    .limit(pageSize)
    .exec();

  return userComments;
}

export async function paginateUserComments(
  userId,
  reported_comments,
  offset,
  sortCriteria,
  pageSize
) {
  const userComments = await Comment.find({
    user_id: userId,
    _id: { $nin: reported_comments },
  })
    .sort(sortCriteria)
    .skip(offset)
    .limit(pageSize)
    .exec();

  return userComments;
}

export async function getPostsHelper(currentUser, offset, pageSize, sortBy) {
  try {
    let sortCriteria = getSortCriteria(sortBy);

    // Apply sorting based on the sortBy parameter
    let posts = [];
    if (currentUser) {
      let followedUsers = currentUser.following_ids; // Assuming following_ids contains user IDs of followed users

      let hidden_posts = currentUser.hidden_and_reported_posts_ids;
      let blocked_users =
        currentUser.safety_and_privacy_settings.blocked_users.map(
          (user) => user.id
        );
      // Check if the user follows anyone
      if (followedUsers.length > 0) {
        // Fetch posts from followed users
        posts = paginateFollowingPosts(
          followedUsers,
          hidden_posts,
          blocked_users,
          offset,
          sortCriteria,
          pageSize
        );
      } else {
        // If user doesn't follow anyone, fetch posts where users is not blocked or posts are not hidden
        posts = await Post.aggregate([
          {
            $match: {
              user_id: { $nin: blocked_users },
              _id: { $nin: hidden_posts },
            },
          },
          { $sample: { size: pageSize } }, // Randomly select posts
          { $sort: sortCriteria }, // Sort the random posts based on the same criteria
        ]);
        console.log("HII", posts[0] instanceof mongoose.Document);
      }
    }
    // If no authenticated user or user doesn't follow anyone, fetch random posts
    if (posts.length === 0) {
      posts = await Post.aggregate([
        { $sample: { size: pageSize } }, // Randomly select posts
        { $sort: sortCriteria }, // Sort the random posts based on the same criteria
      ]);
    }
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
}
