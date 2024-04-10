import { Comment } from "../db/models/Comment.js";

export async function getPostCommentsHelper(postId) {
  const comments = await Comment.find({ post_id: postId }).exec();
  if (!comments || comments.length === 0) return [];
  const commentsWithReplies = [];
  for (const comment of comments) {
    const replies = comment.replies_comments_ids;
    comment.replies_comments_ids = [];
    for (const reply of replies) {
      const replyObject = await Comment.findById(reply);
      comment.replies_comments_ids.push(replyObject);
    }
    commentsWithReplies.push(comment);
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
