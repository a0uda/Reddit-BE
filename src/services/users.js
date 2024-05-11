/**
 * @module users/services
 */

import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { getSortCriteria } from "../utils/lisitng.js";
import {
  paginateUserPosts,
  paginateUserComments,
  paginatePosts,
  paginateComments,
} from "./lisitngs.js";
import { checkVotesMiddleware } from "./posts.js";
import { checkCommentVotesMiddleware } from "./comments.js";
import { getCommunityGeneralSettings } from "../services/communitySettingsService.js";

/**
 * Helper function to manage user follow/unfollow actions.
 *
 * @param {Object} user1 - The user initiating the follow/unfollow action.
 * @param {Object} user2 - The user being followed/unfollowed.
 * @param {Boolean} [follow=true] - Indicates whether the action is a follow (true) or unfollow (false).
 * 
 * @returns {Promise<void>} Returns a promise that resolves once the follow/unfollow action is completed successfully.
 * @throws {Error} Throws an error if there's an issue with the database operations or input parameters.
 * 
 * @example
 * // Example usage of followUserHelper function
 * try {
 *   await followUserHelper(userA, userB); // userA follows userB
 *   await followUserHelper(userC, userD, false); // userC unfollows userD
 * } catch (error) {
 *   console.error("Error:", error.message);
 * }
 */
export async function followUserHelper(user1, user2, follow = true) {
  try {
    if (follow) {
      if (!user2.followers_ids.includes(user1._id)) {
        user2.followers_ids.push(user1._id);
        await user2.save();
      }

      if (!user1.following_ids.includes(user2._id)) {
        user1.following_ids.push(user2._id);
        await user1.save();
      }

      console.log(`User ${user1.username} follows user ${user2.username}.`);
    } else {
      const indexUserOne = user2.followers_ids.indexOf(user1._id);
      if (indexUserOne !== -1) {
        user2.followers_ids.splice(indexUserOne, 1);
        await user2.save();
      }

      const indexUserTwo = user1.following_ids.indexOf(user2._id);
      if (indexUserTwo !== -1) {
        user1.following_ids.splice(indexUserTwo, 1);
        await user1.save();
      }

      console.log(`User ${user1.username} unfollows user ${user2.username}.`);
    }
  } catch (error) {
    //console.error("Error:", error);
  }
}

/**
 * Helper function to fetch and process posts for a user based on provided parameters.
 *
 * @param {Object} user - The user object for whom posts are being fetched.
 * @param {String} postsType - The type of posts to fetch (e.g., "all", "liked", "hidden_and_reported").
 * @param {Number} pageNumber - The page number of posts to retrieve.
 * @param {Number} pageSize - The number of posts per page.
 * @param {String} sortBy - The field to sort the posts by (e.g., "createdAt", "likesCount").
 * 
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of post objects.
 * @throws {Error} Throws an error if there's an issue fetching or processing posts.
 * 
 * @example
 * // Example usage of getPostsHelper function
 * try {
 *   const posts = await getPostsHelper(currentUser, "all", 1, 10, "-createdAt");
 *   console.log(posts);
 * } catch (error) {
 *   console.error("Error fetching posts:", error.message);
 * }
 */
//Posts saved in user arrays
export async function getPostsHelper(
  user,
  postsType,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let hidden_posts = user.hidden_and_reported_posts_ids;
    if (postsType == "hidden_and_reported_posts_ids") hidden_posts = [];

    let posts = await paginatePosts(
      user,
      postsType,
      hidden_posts,
      offset,
      sortCriteria,
      pageSize
    );
    if (user) posts = await checkVotesMiddleware(user, posts);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    // throw error;
  }
}

/**
 * Helper function to fetch and process posts of a specific user based on provided parameters.
 *
 * @param {Object} loggedInUser - The logged-in user object (optional).
 * @param {Object} user - The user whose posts are being fetched.
 * @param {Number} pageNumber - The page number of posts to retrieve.
 * @param {Number} pageSize - The number of posts per page.
 * @param {String} sortBy - The field to sort the posts by (e.g., "createdAt", "likesCount").
 * 
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of post objects.
 * @throws {Error} Throws an error if there's an issue fetching or processing posts.
 * 
 * @example
 * // Example usage of getUserPostsHelper function
 * try {
 *   const posts = await getUserPostsHelper(currentUser, targetUser, 1, 10, "-createdAt");
 *   console.log(posts);
 * } catch (error) {
 *   console.error("Error fetching user posts:", error.message);
 * }
 */
//Posts written by certain user
export async function getUserPostsHelper(
  loggedInUser,
  user,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let posts = [];
    if (loggedInUser) {
      let hidden_posts = loggedInUser.hidden_and_reported_posts_ids;

      posts = await paginateUserPosts(
        user._id,
        hidden_posts,
        offset,
        sortCriteria,
        pageSize
      );

      posts = await checkVotesMiddleware(loggedInUser, posts);

      const postIds = posts.map((post) => post._id);

      await Post.updateMany(
        { _id: { $in: postIds } },
        {
          $inc: {
            views_count: 1,
            "user_details.total_views": 1,
          },
        }
      );
      if (loggedInUser._id.toString() != user._id.toString()) {
        const postIdsSet = new Set(posts.map((post) => post._id));
        loggedInUser.history_posts_ids.push(
          ...[...postIdsSet].filter(
            (postId) => !loggedInUser.history_posts_ids.includes(postId)
          )
        );
        console.log(loggedInUser.history_posts_ids.length);
        await loggedInUser.save();
      }
    } else {
      posts = await paginateUserPosts(
        user._id,
        [],
        offset,
        sortCriteria,
        pageSize
      );
    }
    // console.log(posts);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    // throw error;
  }
}


/**
 * Helper function to fetch and process comments for a user based on provided parameters.
 *
 * @param {Object} user - The user object for whom comments are being fetched.
 * @param {String} commentsType - The type of comments to fetch (e.g., "all", "liked", "replies").
 * @param {Number} pageNumber - The page number of comments to retrieve.
 * @param {Number} pageSize - The number of comments per page.
 * @param {String} sortBy - The field to sort the comments by (e.g., "createdAt", "likesCount").
 * 
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of comment objects.
 * @throws {Error} Throws an error if there's an issue fetching or processing comments.
 * 
 * @example
 * // Example usage of getCommentsHelper function
 * try {
 *   const comments = await getCommentsHelper(currentUser, "all", 1, 10, "-createdAt");
 *   console.log(comments);
 * } catch (error) {
 *   console.error("Error fetching comments:", error.message);
 * }
 */
export async function getCommentsHelper(
  user,
  commentsType,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    console.log(commentsType);
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let comments = await paginateComments(
      user,
      commentsType,
      offset,
      sortCriteria,
      pageSize
    );
    comments = await checkCommentVotesMiddleware(user, comments);

    await Promise.all(
      comments.map(async (comment) => {
        comment.replies_comments_ids = await checkCommentVotesMiddleware(
          user,
          comment.replies_comments_ids
        );
      })
    );
    return comments;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
}

/**
 * Helper function to fetch and process comments of a specific user based on provided parameters.
 *
 * @param {Object} loggedInUser - The logged-in user object (optional).
 * @param {Object} user - The user whose comments are being fetched.
 * @param {Number} pageNumber - The page number of comments to retrieve.
 * @param {Number} pageSize - The number of comments per page.
 * @param {String} sortBy - The field to sort the comments by (e.g., "createdAt", "likesCount").
 * 
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of comment objects.
 * @throws {Error} Throws an error if there's an issue fetching or processing comments.
 * 
 * @example
 * // Example usage of getUserCommentsHelper function
 * try {
 *   const comments = await getUserCommentsHelper(currentUser, targetUser, 1, 10, "-createdAt");
 *   console.log(comments);
 * } catch (error) {
 *   console.error("Error fetching user comments:", error.message);
 * }
 */
export async function getUserCommentsHelper(
  loggedInUser,
  user,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let comments = [];
    if (loggedInUser) {
      let hidden_comments = loggedInUser.reported_comments_ids;

      comments = await paginateUserComments(
        user._id,
        hidden_comments,
        offset,
        sortCriteria,
        pageSize
      );

      comments = await checkCommentVotesMiddleware(loggedInUser, comments);

      await Promise.all(
        comments.map(async (comment) => {
          comment.replies_comments_ids = await checkCommentVotesMiddleware(
            loggedInUser,
            comment.replies_comments_ids
          );
        })
      );
    } else {
      comments = await paginateUserComments(
        user._id,
        [],
        offset,
        sortCriteria,
        pageSize
      );
    }
    // console.log(comments);
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    // throw error;
  }
}

/**
 * Helper function to retrieve communities associated with a user.
 *
 * @param {Object} user - The user object for whom communities are being retrieved.
 * 
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of community objects.
 * @throws {Error} Throws an error if there's an issue retrieving communities.
 * 
 * @example
 * // Example usage of getCommunitiesHelper function
 * try {
 *   const communities = await getCommunitiesHelper(currentUser);
 *   console.log(communities);
 * } catch (error) {
 *   console.error("Error retrieving communities:", error.message);
 * }
 */
export async function getCommunitiesHelper(user) {
  const communities = await Promise.all(
    user.communities.map(async (userCommunity) => {
      console.log(userCommunity.id)
      const community = await Community.findById(userCommunity.id);
      if (community) {
        const { name, profile_picture, members_count } = community;
        return {
          id: userCommunity.id.toString(),
          name,
          profile_picture,
          favorite_flag: userCommunity.favorite_flag,
          disable_updates: userCommunity.disable_updates,
          members_count,
        };
      }
    })
  );
  const filteredCommunities = communities.filter(
    (community) => community != null
  );
  return filteredCommunities;
}

/**
 * Helper function to retrieve moderated communities of a user and check if logged-in user has joined these communities.
 *
 * @param {Object} user - The user object whose moderated communities are being retrieved.
 * @param {Object} loggedInUser - The logged-in user object.
 * 
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of moderated community objects.
 * @throws {Error} Throws an error if there's an issue retrieving moderated communities.
 * 
 * @example
 * // Example usage of getModeratedCommunitiesHelper function
 * try {
 *   const moderatedCommunities = await getModeratedCommunitiesHelper(currentUser, loggedInUser);
 *   console.log(moderatedCommunities);
 * } catch (error) {
 *   console.error("Error retrieving moderated communities:", error.message);
 * }
 */
export async function getModeratedCommunitiesHelper(user, loggedInUser) {
  const moderatedCommunities = await Promise.all(
    user.moderated_communities.map(async (userCommunity) => {
      const community = await Community.findById(userCommunity.id);
      if (community) {
        const { name, profile_picture, members_count } = community;
        const joinedCommunity = loggedInUser.communities.find(
          (joinedCommunityObj) =>
            joinedCommunityObj.id.toString() == community._id.toString()
        );
        const joined = !joinedCommunity ? false : true;
        return {
          id: userCommunity.id.toString(),
          name,
          profile_picture,
          favorite_flag: userCommunity.favorite_flag,
          members_count,
          joined,
        };
      }
    })
  );
  const filteredCommunities = moderatedCommunities.filter(
    (community) => community != null
  );
  return filteredCommunities;
}

/**
 * Helper function to retrieve information about users blocked by a given user.
 *
 * @param {Object} user - The user object for whom blocked users are being retrieved.
 * 
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of blocked user objects.
 * @throws {Error} Throws an error if there's an issue retrieving blocked users.
 * 
 * @example
 * // Example usage of getBlockedUserHelper function
 * try {
 *   const blockedUsers = await getBlockedUserHelper(currentUser);
 *   console.log(blockedUsers);
 * } catch (error) {
 *   console.error("Error retrieving blocked users:", error.message);
 * }
 */
export async function getBlockedUserHelper(user) {
  const blockedUsers = await Promise.all(
    user.safety_and_privacy_settings.blocked_users.map(async (block) => {
      const blockedUser = await User.findById(block.id);
      if (blockedUser) {
        const { username, profile_picture } = blockedUser;
        return {
          id: block.id.toString(),
          username,
          profile_picture,
          blocked_date: block.blocked_date,
        };
      }
    })
  );
  const filteredBlockedUsers = blockedUsers.filter((user) => user != null);
  return filteredBlockedUsers;
}

/**
 * Helper function to retrieve information about muted communities by a given user.
 *
 * @param {Object} user - The user object for whom muted communities are being retrieved.
 * 
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of muted community objects.
 *   Each community object contains the following properties:
 *   - {String} id: The unique identifier of the community.
 *   - {String} name: The name or title of the community.
 *   - {String} profile_picture: The URL to the community's profile picture.
 *   - {Date} muted_date: The date when the community was muted by the user.
 * 
 * @throws {Error} Throws an error if there's an issue retrieving muted communities.
 * 
 * @example
 * // Example usage of getMutedCommunitiesHelper function
 * try {
 *   const mutedCommunities = await getMutedCommunitiesHelper(currentUser);
 *   console.log(mutedCommunities);
 * } catch (error) {
 *   console.error("Error retrieving muted communities:", error.message);
 * }
 */
export async function getMutedCommunitiesHelper(user) {
  const mutedCommunities = await Promise.all(
    user.safety_and_privacy_settings.muted_communities.map(async (muted) => {
      const mutedCommunity = await Community.findById(muted.id);
      if (mutedCommunity) {
        const { name, profile_picture } = mutedCommunity;
        return {
          id: muted.id.toString(),
          name,
          profile_picture,
          muted_date: muted.muted_date,
        };
      }
    })
  );
  const filteredMutedCommunities = mutedCommunities.filter(
    (community) => community != null
  );
  return filteredMutedCommunities;
}

/**
 * Helper function to retrieve information about active communities based on provided community objects.
 *
 * @param {Array<Object>} communities - An array of community objects.
 * 
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of active community objects.
 *   Each community object contains the following properties:
 *   - {String} id: The unique identifier of the community.
 *   - {String} name: The name or title of the community.
 *   - {String} description: The description of the community.
 *   - {String} title: The title or headline of the community.
 *   - {String} profile_picture: The URL to the community's profile picture.
 *   - {String} banner_picture: The URL to the community's banner picture.
 *   - {Number} members_count: The total count of members in the community.
 * 
 * @example
 * // Example usage of getActiveCommunitiesHelper function
 * try {
 *   const communities = [
 *     { id: '1', name: 'community1', profile_picture: 'url1', members_count: 100 },
 *     { id: '2', name: 'community2', profile_picture: 'url2', members_count: 200 }
 *   ];
 *   const activeCommunities = await getActiveCommunitiesHelper(communities);
 *   console.log(activeCommunities);
 * } catch (error) {
 *   console.error("Error retrieving active communities:", error.message);
 * }
 */
export async function getActiveCommunitiesHelper(communities) {
  const activeCommunities = await Promise.all(
    communities.map(async (community) => {
      const { err, general_settings } = await getCommunityGeneralSettings(
        community.name
      );
      if (!err) {
        return {
          id: community.id.toString(),
          name: community.name,
          description: general_settings.description,
          title: general_settings.title,
          profile_picture: community.profile_picture,
          banner_picture: community.banner_picture,
          members_count: community.members_count,
        };
      }
    })
  );
  return activeCommunities.filter((community) => community);
}
