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
  pageSize,
  joinedCommunities,
  mutedCommunities
) {
  // Extract blocked user IDs from blockedUsers array
  const followedUsersPostsNumber = Math.trunc(pageSize / 2);
  const userPosts = await Post.find({
    user_id: { $in: followedUsers, $nin: blockedUsers },
    _id: { $nin: hidden_posts },
  })
    .sort(sortCriteria)
    .skip(offset)
    .limit(followedUsersPostsNumber)
    .exec();

  let posts = [...userPosts];

  const communityPosts = await Post.find({
    post_in_community_flag: true,
    community_id: { $in: joinedCommunities, $nin: mutedCommunities },
  })
    .sort(sortCriteria)
    .skip(offset)
    .limit(pageSize - posts.length)
    .exec();
  console.log("hereee");
  console.log(communityPosts);
  posts.push(...communityPosts);

  if (posts.length < pageSize) {
    const remainingPosts = pageSize - posts.length;

    const randomPosts = await Post.aggregate([
      {
        $lookup: {
          from: "CommunityGeneralSettings",
          localField: "community_id",
          foreignField: "_id",
          as: "communitySettings",
        },
      },
      {
        $match: {
          user_id: { $nin: followedUsers, $nin: blockedUsers },
          _id: { $nin: hidden_posts },
          community_id: { $nin: joinedCommunities },
          "communitySettings.type": { $nin: ["Restricted", "Private"] },
        },
      },
      { $sample: { size: remainingPosts } },
      { $sort: sortCriteria },
    ]);
    console.log("here222");
    console.log(randomPosts);
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
      let joined_communities = currentUser.communities.map(
        (community) => community.id
      );
      let muted_communities =
        currentUser.safety_and_privacy_settings.muted_communities.map(
          (community) => community.id
        );
      // Check if the user follows anyone
      if (followedUsers.length > 0) {
        // Fetch posts from followed users
        posts = await paginateFollowingPosts(
          followedUsers,
          hidden_posts,
          blocked_users,
          offset,
          sortCriteria,
          pageSize,
          joined_communities,
          muted_communities
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
