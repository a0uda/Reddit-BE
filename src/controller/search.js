/**
 * @module search/controller
 */
import { User } from "../db/models/User.js";
import { generateResponse } from "../utils/generalUtils.js";
import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { Community } from "../db/models/Community.js";
import { verifyAuthToken } from "./userAuth.js";
import {
  getCommentSortCriteria,
  getSortCriteria,
  getTimeSortCriteria,
} from "../utils/lisitng.js";

/**
 * Searches for users based on a query string, filtering by username, display name, and about section.
 *
 * @param {Object} request - The HTTP request object containing the query string.
 * @param {number} pageNumber - The page number for pagination (default is 1).
 * @param {number} pageSize - The number of users to return per page (default is 10).
 * @returns {Object} An object containing the search results.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code.
 *   - users {Array} - An array of users matching the search criteria.
 *   - message {string} - A descriptive message of the operation outcome.
 */
export async function searchUsers(request, pageNumber = 1, pageSize = 10) {
  try {
    let user = null;
    let blockedUsers = null;
    // Check if request has Authorization header
    if (request.headers.authorization) {
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
      blockedUsers = user.safety_and_privacy_settings.blocked_users.map(
        (user) => user.id
      );
    }
    const offset = (pageNumber - 1) * pageSize;

    const searchQuery = request.query.query;
    if (!searchQuery)
      return generateResponse(false, 400, "Query string is required");
    console.log(searchQuery);

    const users = await User.find({
      _id: { $nin: blockedUsers },
      $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { display_name: { $regex: searchQuery, $options: "i" } },
        { about: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .skip(offset)
      .limit(pageSize)
      .exec();

    return {
      success: true,
      status: 200,
      users,
      message: "Searched successfully.",
    };
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}

/**
 * Searches for posts based on a query string and specified search criteria.
 *
 * @param {Object} request - The HTTP request object containing the query string and search parameters.
 * @param {number} pageNumber - The page number for pagination (default is 1).
 * @param {number} pageSize - The number of posts to return per page (default is 10).
 * @param {string} sortBy - The field to sort the posts by (default is "relevance").
 * @param {string} sortTime - The time range to filter the posts by (default is "allTime").
 * @returns {Object} An object containing the search results.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code.
 *   - posts {Array} - An array of posts matching the search criteria.
 *   - message {string} - A descriptive message of the operation outcome.
 */
export async function searchPosts(
  request,
  pageNumber = 1,
  pageSize = 10,
  sortBy = "relevance",
  sortTime = "allTime"
) {
  try {
    let user = null;
    let blockedUsers = [];
    let hiddenPosts = [];
    let mutedCommunities = [];
    // Check if request has Authorization header
    if (request.headers.authorization) {
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
      blockedUsers = user.safety_and_privacy_settings.blocked_users.map(
        (user) => user.id
      );
      hiddenPosts = user.hidden_and_reported_posts_ids;
      mutedCommunities = user.safety_and_privacy_settings.muted_communities.map(
        (community) => community.id
      );
    }

    const offset = (pageNumber - 1) * pageSize;
    const sortCriteria = getSortCriteria(sortBy);
    const sortDate = getTimeSortCriteria(sortTime);

    const searchQuery = request.query.query;
    if (!searchQuery)
      return generateResponse(false, 400, "Query string is required");
    console.log(searchQuery);

    var posts = await Post.find({
      _id: { $nin: hiddenPosts },
      community_id: { $nin: mutedCommunities },
      user_id: { $nin: blockedUsers },
      created_at: { $gte: sortDate },
      $or: [
        { description: { $regex: searchQuery, $options: "i" } },
        { title: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .skip(offset)
      .limit(pageSize)
      .sort(sortCriteria)
      .exec();

    if (user) {
      const postIds = new Set(posts.map((post) => post._id));
      user.history_posts_ids.push(
        ...[...postIds].filter(
          (postId) => !user.history_posts_ids.includes(postId)
        )
      );
      console.log(user.history_posts_ids.length);
      await user.save();
    }
    return {
      success: true,
      status: 200,
      posts,
      message: "Searched successfully.",
    };
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}

/**
 * Searches for comments based on a query string and specified search criteria.
 *
 * @param {Object} request - The HTTP request object containing the query string and search parameters.
 * @param {number} pageNumber - The page number for pagination (default is 1).
 * @param {number} pageSize - The number of comments to return per page (default is 10).
 * @param {string} sortBy - The field to sort the comments by (default is "relevance").
 * @returns {Object} An object containing the search results.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code.
 *   - comments {Array} - An array of comments matching the search criteria.
 *   - message {string} - A descriptive message of the operation outcome.
 */
export async function searchComments(
  request,
  pageNumber = 1,
  pageSize = 10,
  sortBy = "relevance"
) {
  try {
    let user = null;
    let blockedUsers = [];
    let mutedCommunities = [];
    // Check if request has Authorization header
    if (request.headers.authorization) {
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
      blockedUsers = user.safety_and_privacy_settings.blocked_users.map(
        (user) => user.id
      );
      mutedCommunities = user.safety_and_privacy_settings.muted_communities.map(
        (community) => community.id
      );
    }

    const offset = (pageNumber - 1) * pageSize;
    const sortCriteria = getCommentSortCriteria(sortBy);

    const searchQuery = request.query.query;
    if (!searchQuery)
      return generateResponse(false, 400, "Query string is required");
    console.log(searchQuery);

    const comments = await Comment.find({
      community_id: { $nin: mutedCommunities },
      user_id: { $nin: blockedUsers },
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .populate("post_id")
      .skip(offset)
      .limit(pageSize)
      .sort(sortCriteria)
      .exec();

    return {
      success: true,
      status: 200,
      comments,
      message: "Searched successfully.",
    };
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}

/**
 * Searches for communities based on a query string.
 *
 * @param {Object} request - The HTTP request object containing the query string and pagination parameters.
 * @param {number} pageNumber - The page number for pagination (default is 1).
 * @param {number} pageSize - The number of communities to return per page (default is 10).
 * @returns {Object} An object containing the search results.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code.
 *   - communities {Array} - An array of communities matching the search criteria.
 *   - message {string} - A descriptive message of the operation outcome.
 */
export async function searchCommunities(
  request,
  pageNumber = 1,
  pageSize = 10
) {
  try {
    let user = null;
    let mutedCommunities = null;
    if (request.headers.authorization) {
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
      mutedCommunities = user.safety_and_privacy_settings.muted_communities.map(
        (community) => community.id
      );
    }

    const offset = (pageNumber - 1) * pageSize;

    const searchQuery = request.query.query;
    if (!searchQuery)
      return generateResponse(false, 400, "Query string is required");
    console.log(searchQuery);

    const communities = await Community.find({
      _id: { $nin: mutedCommunities },
      $or: [{ name: { $regex: searchQuery, $options: "i" } }],
    })
      .populate("general_settings")
      .skip(offset)
      .limit(pageSize)
      .exec();

    return {
      success: true,
      status: 200,
      communities,
      message: "Searched successfully.",
    };
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}

/**
 * Searches for posts within a specific community based on a query string.
 *
 * @param {Object} request - The HTTP request object containing the query string and other parameters.
 * @param {number} pageNumber - The page number for pagination (default is 1).
 * @param {number} pageSize - The number of posts to return per page (default is 10).
 * @param {string} sortBy - The sorting criteria for posts (default is "relevance").
 * @param {string} sortTime - The time range for sorting posts (default is "allTime").
 * @returns {Object} An object containing the search results.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code.
 *   - posts {Array} - An array of posts matching the search criteria within the specified community.
 *   - message {string} - A descriptive message of the operation outcome.
 */
export async function searchPostCommunities(
  request,
  pageNumber = 1,
  pageSize = 10,
  sortBy = "relevance",
  sortTime = "allTime"
) {
  try {
    let user = null;
    let blockedUsers = [];
    let hiddenPosts = [];
    let mutedCommunities = [];
    // Check if request has Authorization header
    if (request.headers.authorization) {
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
      blockedUsers = user.safety_and_privacy_settings.blocked_users.map(
        (user) => user.id
      );
      hiddenPosts = user.hidden_and_reported_posts_ids;
      mutedCommunities = user.safety_and_privacy_settings.muted_communities.map(
        (community) => community.id
      );
    }

    const offset = (pageNumber - 1) * pageSize;
    const sortCriteria = getSortCriteria(sortBy);
    const sortDate = getTimeSortCriteria(sortTime);

    const searchQuery = request.query.query;
    if (!searchQuery)
      return generateResponse(false, 400, "Query string is required");

    const community_name = request.params.community_name;
    if (!community_name)
      return generateResponse(false, 400, "community_name is required");

    const posts = await Post.find({
      _id: { $nin: hiddenPosts },
      community_id: { $nin: mutedCommunities },
      user_id: { $nin: blockedUsers },
      created_at: { $gte: sortDate },
      $and: [
        { community_name },
        { post_in_community_flag: true },
        {
          $or: [
            { description: { $regex: searchQuery, $options: "i" } },
            { title: { $regex: searchQuery, $options: "i" } },
          ],
        },
      ],
    })
      .skip(offset)
      .limit(pageSize)
      .sort(sortCriteria)
      .exec();
    if (user) {
      const postIds = new Set(posts.map((post) => post._id));
      user.history_posts_ids.push(
        ...[...postIds].filter(
          (postId) => !user.history_posts_ids.includes(postId)
        )
      );
      console.log(user.history_posts_ids.length);
      await user.save();
    }
    return {
      success: true,
      status: 200,
      posts,
      message: "Searched successfully.",
    };
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}

/**
 * Searches for comments within a specific community based on a query string.
 *
 * @param {Object} request - The HTTP request object containing the query string and other parameters.
 * @param {number} pageNumber - The page number for pagination (default is 1).
 * @param {number} pageSize - The number of comments to return per page (default is 10).
 * @param {string} sortBy - The sorting criteria for comments (default is "relevance").
 * @returns {Object} An object containing the search results.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code.
 *   - comments {Array} - An array of comments matching the search criteria within the specified community.
 *   - message {string} - A descriptive message of the operation outcome.
 */
export async function searchCommentCommunities(
  request,
  pageNumber = 1,
  pageSize = 10,
  sortBy = "relevance"
) {
  try {
    let user = null;
    let blockedUsers = [];
    let mutedCommunities = [];
    // Check if request has Authorization header
    if (request.headers.authorization) {
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
      blockedUsers = user.safety_and_privacy_settings.blocked_users.map(
        (user) => user.id
      );
      mutedCommunities = user.safety_and_privacy_settings.muted_communities.map(
        (community) => community.id
      );
    }

    const offset = (pageNumber - 1) * pageSize;
    const sortCriteria = getCommentSortCriteria(sortBy);

    const searchQuery = request.query.query;
    if (!searchQuery)
      return generateResponse(false, 400, "Query string is required");

    const community_name = request.params.community_name;
    if (!community_name)
      return generateResponse(false, 400, "community_name is required");

    const comments = await Comment.find({
      community_id: { $nin: mutedCommunities },
      user_id: { $nin: blockedUsers },
      $and: [
        { community_name },
        { comment_in_community_flag: true },
        {
          $or: [
            { description: { $regex: searchQuery, $options: "i" } },
            { title: { $regex: searchQuery, $options: "i" } },
          ],
        },
      ],
    })
      .populate("post_id")
      .skip(offset)
      .limit(pageSize)
      .sort(sortCriteria)
      .exec();

    return {
      success: true,
      status: 200,
      comments,
      message: "Searched successfully.",
    };
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}
