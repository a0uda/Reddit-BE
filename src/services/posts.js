import { Comment } from "../db/models/Comment.js";
import { communityNameExists } from "../utils/communities.js";
import {
  getCommunityGeneralSettings,
  getCommunityPostsAndComments,
  getCommunityContentControls,
} from "../services/communitySettingsService.js";
import { checkCommentVotesMiddleware } from "./comments.js";
import mongoose from "mongoose";

export async function getCommentRepliesHelper(comment) {
  const replies = comment.replies_comments_ids;
  comment.replies_comments_ids = [];
  for (const reply of replies) {
    const replyObject = await Comment.findById(reply);
    comment.replies_comments_ids.push(replyObject);
  }
  return comment;

  // const replies = comment.replies_comments_ids;
  // comment.replies_comments_ids = [];
  // for (const reply of replies) {
  //   const replyObject = await Comment.findById(reply);
  //   comment.replies_comments_ids.push(replyObject);
  // }
  // console.log(user);
  // let x = comment.replies_comments_ids;
  // if (user) {
  //   x = await checkCommentVotesMiddleware(user, comment.replies_comments_ids);
  // }
  // comment.replies_comments_ids = x;
  // console.log(comment.replies_comments_ids);
  // return comment;
}

export async function getPostCommentsHelper(postId) {
  const comments = await Comment.find({ post_id: postId }).exec();
  if (!comments || comments.length === 0) return [];
  const commentsWithReplies = [];
  for (const comment of comments) {
    const commentResult = await getCommentRepliesHelper(comment);
    console.log(commentResult);
    commentsWithReplies.push(commentResult);
  }
  return commentsWithReplies;
}

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

export async function checkBannedUser(community, userId) {
  const isBannedUser = community.banned_users.find(
    (userBanned) => userBanned.id.toString() == userId.toString()
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

export async function checkApprovedUser(community, userId) {
  const isApprovedUser = community.approved_users.find(
    (userApproved) => userApproved.id.toString() == userId.toString()
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

export async function checkPostSettings(post, community_name) {
  const { err: err2, posts_and_comments } = await getCommunityPostsAndComments(
    community_name
  );
  if (err2) {
    return next(err2);
  }
  console.log(community_name);
  const type = post.type;
  const allowType = posts_and_comments.posts.post_type_options;
  const allowPolls = posts_and_comments.posts.allow_polls_posts;
  const allowMultipleImages =
    posts_and_comments.posts.allow_multiple_images_per_post;
  if (
    (!allowPolls && post.polls.length > 0) ||
    (allowType == "Links Only" && type != "url" && type != "hybrid") ||
    (allowType == "Text Posts Only" && type != "text")
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
    console.log(postDomain);
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
    }).exec();

    const sameLinkPosted = lastPosts.some((p) => p.link_url === post.link_url);
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
  return {
    success: true,
  };
}

export async function checkVotesMiddleware(currentUser, posts) {
  // Assume currentUser is the authenticated user
  if (currentUser) {
    console.log(currentUser, posts);
    const currentUserId = currentUser._id; // Assuming userId is used for comparison
    // Fetch and populate posts with upvote/downvote status for the current user
    posts = posts.map((post) => {
      const isUpvoted =
        currentUserId &&
        currentUser.upvotes_posts_ids.includes(post._id.toString());
      const isDownvoted =
        currentUserId &&
        currentUser.downvotes_posts_ids.includes(post._id.toString());
      var vote = 0;
      if (isUpvoted) vote = 1;
      else if (isDownvoted) vote = -1;
      // Add isUpvoted and isDownvoted as temporary fields
      if (post instanceof mongoose.Document)
        return { ...post.toObject(), vote };
      else return { ...post, vote };
    });
    console.log(posts);
    return posts;
  }
  return null;
}
