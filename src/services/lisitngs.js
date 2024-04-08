import { Post } from "../db/models/Post.js";
import { getSortCriteria } from "../utils/lisitng.js";

export async function paginateFollowingPosts(followedUsers) {
  const userPosts = await Post.find({ user_id: { $in: followedUsers } })
    .sort(sortCriteria)
    .skip(offset)
    .limit(pageSize)
    .exec();

  posts = [...userPosts];
  if (posts.length < pageSize) {
    const remainingPosts = pageSize - posts.length;

    // Fetch random posts excluding the ones already fetched
    const randomPosts = await Post.aggregate([
      { $match: { user_id: { $nin: followedUsers } } }, // Exclude followed users' posts
      { $sample: { size: remainingPosts } }, // Randomly select remaining posts
      { $sort: sortCriteria }, // Sort the random posts based on the same criteria
    ]);

    posts.push(...randomPosts);
  }
  return posts;
}

export async function getPostsHelper(currentUser, offset, pageSize, sortBy) {
  try {
    let sortCriteria = getSortCriteria(sortBy);

    // Apply sorting based on the sortBy parameter
    let posts = [];

    if (currentUser) {
      let followedUsers = currentUser.following_ids; // Assuming following_ids contains user IDs of followed users

      // Check if the user follows anyone
      if (followedUsers.length > 0) {
        // Fetch posts from followed users
        posts = paginateFollowingPosts(followedUsers);
      } else {
        // If user doesn't follow anyone, fetch random posts
        posts = await Post.aggregate([
          { $sample: { size: pageSize } }, // Randomly select posts
          { $sort: sortCriteria }, // Sort the random posts based on the same criteria
        ]);
      }
    }
    // If no authenticated user or user doesn't follow anyone, fetch random posts
    if (posts.length === 0) {
      posts = await Post.aggregate([
        { $sample: { size: pageSize } }, // Randomly select posts
        { $sort: sortCriteria }, // Sort the random posts based on the same criteria
      ]);
    }
    return {
      posts,
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}
