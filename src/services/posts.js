/**
 * @module posts/services
 */
import { communityNameExists } from "../utils/communities.js";
import {
  getCommunityGeneralSettings,
  getCommunityPostsAndComments,
  getCommunityContentControls,
} from "../services/communitySettingsService.js";
import { Post } from "../db/models/Post.js";
import mongoose from "mongoose";

/**
 * Helper function to validate input parameters for creating a new post.
 *
 * @param {Object} requestBody - The request body containing post creation parameters.
 * @param {String} requestBody.title - The title of the post.
 * @param {Boolean} requestBody.post_in_community_flag - Flag indicating whether the post is in a community.
 * @param {String} requestBody.type - The type of post ('image_and_videos', 'polls', 'url', 'text', 'hybrid').
 * @param {Array<Object>} requestBody.images - Array of image objects for image_and_videos type.
 * @param {Array<Object>} requestBody.videos - Array of video objects for image_and_videos type.
 * @param {String} requestBody.link_url - URL for url type post.
 * @param {Array<String>} requestBody.polls - Array of options for polls type post.
 * @param {Number} requestBody.polls_voting_length - Length of time (in days) for polls type post.
 * @param {String} requestBody.community_name - Name of the community for community-specific posts.
 * 
 * @returns {Object} An object containing a result flag and optional message:
 *   - {Boolean} result: Indicates whether the input parameters are valid (true) or not (false).
 *   - {String} [message]: Optional message indicating the reason for validation failure.
 * 
 * @example
 * // Example usage of checkNewPostInput function
 * const requestBody = {
 *   title: "Exciting News!",
 *   post_in_community_flag: true,
 *   type: "image_and_videos",
 *   images: [{ path: "image1.jpg" }, { path: "image2.jpg" }],
 *   videos: [{ path: "video1.mp4" }],
 *   community_name: "community1",
 * };
 * 
 * const validation = await checkNewPostInput(requestBody);
 * if (validation.result) {
 *   console.log("Input parameters are valid. Proceed to create the post.");
 * } else {
 *   console.error("Invalid input parameters:", validation.message);
 * }
 */
export async function checkNewPostInput(requestBody) {
  const {
    title,
    post_in_community_flag,
    type,
    images,
    videos,
    link_url,
    polls,
    polls_voting_length,
    community_name,
  } = requestBody;

  // Check required parameters
  if (!title || post_in_community_flag === undefined || !type) {
    return {
      result: false,
      message: "One of the required parameters is missing",
    };
  }

  const validOptions = ["image_and_videos", "polls", "url", "text", "hybrid"];

  // Check if type is in enum
  if (!validOptions.includes(type)) {
    return {
      result: false,
      message: "Type must be in " + validOptions.join(", "),
    };
  }

  // Check for specific conditions based on type
  switch (type) {
    case "image_and_videos":
      if (!images && !videos) {
        return {
          result: false,
          message:
            "Must provide image or video for post of type image_and_videos",
        };
      }
      const allHavePathImg = images ? images.every((img) => img.path) : true;
      const allHavePathVids = videos ? videos.every((vid) => vid.path) : true;
      if (!allHavePathImg || !allHavePathVids) {
        return {
          result: false,
          message: "All images and videos must have a path",
        };
      }
      break;
    case "url":
      if (!link_url) {
        return {
          result: false,
          message: "Type url must have a link_url",
        };
      }
      break;
    case "polls":
      if (
        !polls ||
        polls.length < 2 ||
        !polls_voting_length ||
        polls_voting_length < 1 ||
        polls_voting_length > 7
      ) {
        return {
          result: false,
          message:
            "Type polls must have at least 2 options and polls_voting_length and it must be between 1-7 days",
        };
      }
      break;
    default:
      break;
  }

  // Check if post in community flag is true and requires community_name
  if (post_in_community_flag && !community_name) {
    return {
      result: false,
      message: "If post in community it must have a community_name",
    };
  }
  return {
    result: true,
  };
}

/**
 * Retrieve a community by its name.
 *
 * @param {String} community_name - The name of the community to retrieve.
 * 
 * @returns {Object} An object containing the result of the operation:
 *   - {Boolean} success: Indicates whether the operation was successful (`true`) or not (`false`).
 *   - {Object} [community]: The community object if found (only present if `success` is `true`).
 *   - {Object} [error]: The error details if the community is not found (only present if `success` is `false`).
 *     - {Number} status: The HTTP status code indicating the error (e.g., 404 for "Community not found").
 *     - {String} message: A descriptive error message indicating the reason for failure.
 * 
 * @example
 * // Example usage of getCommunity function
 * const communityName = "community1";
 * const result = await getCommunity(communityName);
 * if (result.success) {
 *   console.log("Community found:", result.community);
 * } else {
 *   console.error("Failed to retrieve community:", result.error.message);
 * }
 */
export async function getCommunity(community_name) {
  const community = await communityNameExists(community_name);
  if (!community) {
    return {
      success: false,
      error: {
        status: 404,
        message: "Community not found",
      },
    };
  }
  return {
    success: true,
    community,
  };
}

/**
 * Check if a user is banned from performing actions within a community.
 *
 * @param {Object} community - The community object containing information about banned users.
 * @param {String} username - The username of the user to check for ban status.
 * 
 * @returns {Object} An object indicating the result of the ban check:
 *   - {Boolean} success: Indicates whether the user is allowed to perform actions (`true`) or not (`false`).
 *   - {Object} [error]: The error details if the user is banned (only present if `success` is `false`).
 *     - {Number} status: The HTTP status code indicating the error (e.g., 400 for "User is banned").
 *     - {String} message: A descriptive error message indicating the reason for the ban.
 * 
 * @example
 * // Example usage of checkBannedUser function
 * const community = {
 *   banned_users: [
 *     { username: "user1" },
 *     { username: "user2" }
 *   ]
 * };
 * const username = "user1";
 * const result = await checkBannedUser(community, username);
 * if (result.success) {
 *   console.log("User is not banned. Allow action.");
 * } else {
 *   console.error("User is banned:", result.error.message);
 * }
 */
export async function checkBannedUser(community, username) {
  const isBannedUser = community.banned_users.find(
    (userBanned) => userBanned.username == username
  );
  if (isBannedUser) {
    return {
      success: false,
      error: {
        status: 400,
        message: "User can't do this action because he is banned",
      },
    };
  }
  return {
    success: true,
  };
}

/**
 * Check if a user is approved to perform actions within a community.
 *
 * @param {Object} community - The community object containing information about approved users.
 * @param {String} username - The username of the user to check for approval status.
 * 
 * @returns {Object} An object indicating the result of the approval check:
 *   - {Boolean} success: Indicates whether the user is allowed to perform actions (`true`) or not (`false`).
 *   - {Object} [error]: The error details if the user is not approved (only present if `success` is `false`).
 *     - {Number} status: The HTTP status code indicating the error (e.g., 400 for "User is not approved").
 *     - {String} message: A descriptive error message indicating the reason for the approval check failure.
 * 
 * @example
 * // Example usage of checkApprovedUser function
 * const community = {
 *   approved_users: [
 *     { username: "user1" },
 *     { username: "user2" }
 *   ]
 * };
 * const username = "user1";
 * const result = await checkApprovedUser(community, username);
 * if (result.success) {
 *   console.log("User is approved. Allow action.");
 * } else {
 *   console.error("User is not approved:", result.error.message);
 * }
 */
export async function checkApprovedUser(community, username) {
  const isApprovedUser = community.approved_users.find(
    (userApproved) => userApproved.username == username
  );
  // console.log(community.approved_users[0].id,user._id);
  if (!isApprovedUser) {
    return {
      success: false,
      error: {
        status: 400,
        message: "User can't do this action because he is not approved",
      },
    };
  }
  return {
    success: true,
  };
}

/**
 * Check post settings against community-specific rules to determine if the post is allowed.
 *
 * @param {Object} post - The post object containing details of the post to be validated.
 * @param {String} community_name - The name of the community to which the post belongs.
 * 
 * @returns {Object} An object indicating the result of the post validation:
 *   - {Boolean} success: Indicates whether the post settings are valid (`true`) or not (`false`).
 *   - {Object} [error]: The error details if the post settings violate community rules (only present if `success` is `false`).
 *     - {Number} status: The HTTP status code indicating the error (e.g., 400 for "Community rules violation").
 *     - {String} message: A descriptive error message indicating the reason for the validation failure.
 * 
 * @example
 * // Example usage of checkPostSettings function
 * const post = {
 *   type: "image_and_videos",
 *   polls: [],
 *   images: [{ path: "image1.jpg" }, { path: "image2.jpg" }],
 *   videos: []
 * };
 * const communityName = "community1";
 * const result = await checkPostSettings(post, communityName);
 * if (result.success) {
 *   console.log("Post settings are valid. Allow posting.");
 * } else {
 *   console.error("Post settings are not valid:", result.error.message);
 * }
 */
export async function checkPostSettings(post, community_name) {
  const { err: err2, posts_and_comments } = await getCommunityPostsAndComments(
    community_name
  );
  if (err2) {
    return next(err2);
  }
  const type = post.type;
  const allowType = posts_and_comments.posts.post_type_options;
  const allowPolls = posts_and_comments.posts.allow_polls;
  const allowVideos = posts_and_comments.posts.allow_videos;
  const allowMultipleImages =
    posts_and_comments.posts.allow_multiple_images_per_post;
  console.log(`allowType: ${allowType}, type: ${type}`,allowPolls);
  if (
    (!allowPolls && post.polls.length > 0) ||
    (allowType == "Links Only" && type != "url" && type != "hybrid") ||
    (allowType == "Text Posts Only" && type != "text")||
    (!allowVideos && post.videos.length > 0)
  )
    return {
      success: false,
      error: {
        status: 400,
        message: "Community doesn't allow this type of posts",
      },
    };
  if (
    type == "image_and_videos" &&
    post.images.length > 1 &&
    !allowMultipleImages
  ) {
    return {
      success: false,
      error: {
        status: 400,
        message: `Can't allow multiple images per post`,
      },
    };
  }
  return {
    success: true,
  };
}

/**
 * Check post content settings against community-specific rules to determine if the post is allowed.
 *
 * @param {Object} post - The post object containing details of the post to be validated.
 * @param {String} community_name - The name of the community to which the post belongs.
 * 
 * @returns {Object} An object indicating the result of the post content validation:
 *   - {Boolean} success: Indicates whether the post content settings are valid (`true`) or not (`false`).
 *   - {Object} [error]: The error details if the post content violates community rules (only present if `success` is `false`).
 *     - {Number} status: The HTTP status code indicating the error (e.g., 400 for "Community rules violation").
 *     - {String} message: A descriptive error message indicating the reason for the validation failure.
 * 
 * @example
 * // Example usage of checkContentSettings function
 * const post = {
 *   type: "image_and_videos",
 *   title: "Awesome post",
 *   description: "This is a great post.",
 *   link_url: "https://example.com",
 * };
 * const communityName = "community1";
 * const result = await checkContentSettings(post, communityName);
 * if (result.success) {
 *   console.log("Post content settings are valid. Allow posting.");
 * } else {
 *   console.error("Post content settings are not valid:", result.error.message);
 * }
 */
export async function checkContentSettings(post, community_name) {
  const { err: e, content_controls } = await getCommunityContentControls(
    community_name
  );
  if (e) {
    return next(e);
  }
  const {
    require_words_in_post_title,
    ban_words_from_post_title,
    ban_words_from_post_body,
    require_or_ban_links_from_specific_domains,
    restrict_how_often_the_same_link_can_be_posted,
  } = content_controls;

  // Check require_words_in_post_title flag
  if (
    require_words_in_post_title.flag &&
    require_words_in_post_title.add_required_words.length > 0
  ) {
    const requiredWords = require_words_in_post_title.add_required_words;
    const missingWords = requiredWords.filter(
      (word) => !post.title.includes(word)
    );
    if (missingWords.length > 0) {
      return {
        success: false,
        error: {
          status: 400,
          message:
            "Post title must include the following words: " +
            missingWords.join(", "),
        },
      };
    }
  }
  // Check ban_words_from_post_title flag
  if (
    ban_words_from_post_title.flag &&
    ban_words_from_post_title.add_banned_words.length > 0
  ) {
    const bannedWords = ban_words_from_post_title.add_banned_words;
    const bannedWordFound = bannedWords.some((word) =>
      post.title.includes(word)
    );
    if (bannedWordFound) {
      return {
        success: false,
        error: {
          status: 400,
          message: "Post title contains banned words. ",
        },
      };
    }
  }
  //ban_words_from_post_body
  if (
    post.description &&
    ban_words_from_post_body.flag &&
    ban_words_from_post_body.add_banned_words.length > 0
  ) {
    const bannedWords = ban_words_from_post_body.add_banned_words;
    const bannedWordFound = bannedWords.some((word) =>
      post.description.includes(word)
    );
    if (bannedWordFound) {
      return {
        success: false,
        error: {
          status: 400,
          message: "Post body contains banned words. ",
        },
      };
    }
  }
  // Check require_or_ban_links_from_specific_domains flag
  if (post.link_url && require_or_ban_links_from_specific_domains.flag) {
    const restrictionType =
      require_or_ban_links_from_specific_domains.restriction_type;
    const requiredOrBlockedDomains =
      require_or_ban_links_from_specific_domains.require_or_block_link_posts_with_these_domains.split(
        ","
      );
    const postDomain = new URL(post.link_url).hostname;
    if (
      (restrictionType === "Required domains" &&
        !requiredOrBlockedDomains.includes(postDomain)) ||
      (restrictionType === "Blocked domains" &&
        requiredOrBlockedDomains.includes(postDomain))
    ) {
      return {
        success: false,
        error: {
          status: 400,
          message: `Posts must have links from ${
            restrictionType === "Required domains" ? "these" : "other"
          } domains.`,
        },
      };
    }
  }

  // Check restrict_how_often_the_same_link_can_be_posted flag
  if (
    post.link_url &&
    restrict_how_often_the_same_link_can_be_posted.flag &&
    restrict_how_often_the_same_link_can_be_posted.number_of_days > 0
  ) {
    const numberOfDays =
      restrict_how_often_the_same_link_can_be_posted.number_of_days;

    const lastPosts = await Post.find({
      link_url: { $exists: true },
      created_at: {
        $gte: new Date(Date.now() - numberOfDays * 24 * 60 * 60 * 1000),
      },
    });
    if (lastPosts.length > 0) {
      const sameLinkPosted = lastPosts.some(
        (p) => p.link_url === post.link_url
      );
      if (sameLinkPosted) {
        return {
          success: false,
          error: {
            status: 400,
            message: `This link has already been posted within the last ${numberOfDays} days.`,
          },
        };
      }
    }
  }
  return {
    success: true,
  };
}

/**
 * Middleware function to fetch and populate posts with voting and saved status for the current user.
 *
 * @param {Object} currentUser - The authenticated user object.
 * @param {Array} posts - An array of posts to be populated with user-specific voting and save status.
 * 
 * @returns {Array|null} An array of posts with added attributes:
 *   - {Boolean} vote: Indicates the voting status of the current user on the post (-1 for downvoted, 0 for neutral, 1 for upvoted).
 *   - {String|null} poll_vote: Indicates the poll option voted by the user (if applicable, otherwise `null`).
 *   - {Boolean} saved: Indicates whether the post is saved by the current user.
 * 
 * @example
 * // Example usage of checkVotesMiddleware function
 * const currentUser = {
 *   _id: "user123",
 *   upvotes_posts_ids: ["post1", "post2"],
 *   downvotes_posts_ids: [],
 *   saved_posts_ids: ["post2", "post3"],
 * };
 * const posts = [
 *   { _id: "post1", type: "text" },
 *   { _id: "post2", type: "image_and_videos" },
 *   { _id: "post3", type: "polls", polls: [{ id: "option1", users_ids: ["user123"] }] },
 * ];
 * const updatedPosts = await checkVotesMiddleware(currentUser, posts);
 * console.log(updatedPosts);
 */
export async function checkVotesMiddleware(currentUser, posts) {
  // Assume currentUser is the authenticated user
  if (currentUser) {
    const currentUserId = currentUser._id; // Assuming userId is used for comparison
    console.log(currentUserId && currentUser.saved_posts_ids.includes("j"));
    // Fetch and populate posts with upvote/downvote status for the current user
    posts = posts.map((post) => {
      // Add isUpvoted and isDownvoted as temporary fields
      const isUpvoted = currentUser.upvotes_posts_ids.includes(
        post._id.toString()
      );
      const isDownvoted = currentUser.downvotes_posts_ids.includes(
        post._id.toString()
      );
      var vote = 0;
      if (isUpvoted) vote = 1;
      else if (isDownvoted) vote = -1;
      //add atribute for poll_vote
      var poll_vote = null;
      if (post.type == "polls") {
        const option = post.polls.find((op) =>
          op.users_ids.find(
            (user) => user.toString() == currentUserId.toString()
          )
        );
        if (option) {
          poll_vote = option.id;
        }
      }
      const saved = currentUser.saved_posts_ids.includes(post._id.toString());
      if (post instanceof mongoose.Document)
        return { ...post.toObject(), vote, poll_vote, saved };
      else return { ...post, vote, poll_vote, saved };
    });
    return posts;
  }
  return null;
}
