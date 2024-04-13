import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";
import { User } from "../db/models/User.js";
import { Comment } from "../db/models/Comment.js";
import { toggler } from "../utils/toggler.js";
import { getPost } from "./posts.js";
import {
  checkBannedUser,
  getCommentRepliesHelper,
  getCommunity,
} from "../services/posts.js";

export async function getComment(request, verifyUser) {
  let user;
  if (verifyUser) {
    const {
      success,
      err,
      status,
      user: verifiedUser,
      msg,
    } = await verifyAuthToken(request);
    if (!verifiedUser) {
      return { success, error: { status, message: err } };
    }
    user = verifiedUser;
  }
  const commentId = request?.body?.id || request?.query?.id;
  if (commentId == undefined || commentId == null) {
    return {
      success: false,
      error: { status: 400, message: "Comment id is required" },
    };
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    return {
      success: false,
      error: { status: 404, message: "Comment Not found" },
    };
  }
  return {
    success: true,
    comment,
    user,
    message: "Comment Retrieved sucessfully",
  };
}

export async function getCommentWithReplies(request, verifyUser) {
  const { success, error, comment, user, message } = await getComment(
    request,
    false
  );
  console.log(comment);
  if (!success) {
    return { success, error };
  }
  const commentWithReplies = await getCommentRepliesHelper(comment);
  return {
    success: true,
    comment: commentWithReplies,
    user,
    message: "Comment Retrieved sucessfully",
  };
}

export async function newComment(request) {
  const { success, error, post, user, message } = await getPost(request, true);
  if (!success) {
    return { success, error };
  }
  const description = request?.body?.description;
  if (description == undefined || description == null) {
    return {
      success: false,
      error: { status: 400, message: "Comment description is required" },
    };
  }
  //check if post is locked
  if (post.locked_flag) {
    return {
      success: false,
      error: { status: 400, message: "Post is locked can't comment" },
    };
  }

  //check if user posting a comment in community he is banned in he can't comment
  if (post.post_in_community_flag) {
    const { success, community, error } = await getCommunity(
      post.community_name
    );
    if (!success) {
      return { success, error };
    }
    // console.log(community.banned_users,user._id)
    const result = await checkBannedUser(community, user._id);
    if (!result.success) {
      return result;
    }
  }
  const comment = new Comment({
    post_id: post._id,
    user_id: user._id,
    username: user.username,
    parent_id: null, //i am a comment not a reply
    parent_username: null, //i am a comment not a reply
    is_reply: false, //i am a comment not a reply
    created_at: Date.now(),
    description,
    comment_in_community_flag: post.post_in_community_flag, //same as post
    community_id: post.community_id,
    community_name: post.community_name,
    upvotes_count: 1, //when i first make comment
    spoiler_flag: post.spoiler_flag,
  });

  await comment.save();

  return {
    success: true,
    error: {},
    message: "Comment created sucessfully ",
  };
}

export async function replyToComment(request) {
  const { success, error, comment, user, message } = await getComment(
    request,
    true
  );
  console.log(comment);
  if (!success) {
    return { success, error };
  }

  const description = request?.body?.description;
  if (description == undefined || description == null) {
    return {
      success: false,
      error: { status: 400, message: "Comment description is required" },
    };
  }

  //check if post is locked
  if (comment.locked_flag) {
    return {
      success: false,
      error: { status: 400, message: "Comment is locked can't reply" },
    };
  }
  if (comment.comment_in_community_flag) {
    const { success, community, error } = await getCommunity(
      comment.community_name
    );
    if (!success) {
      return { success, error };
    }
    const isBannedUser = community.banned_users.find(
      (userBanned) => userBanned.id.toString() == user._id.toString()
    );
    if (isBannedUser) {
      return {
        success: false,
        error: {
          status: 400,
          message: "User can't reply he is banned",
        },
      };
    }
  }
  const reply = new Comment({
    post_id: comment.post_id,
    user_id: user._id,
    username: user.username,
    parent_id: comment._id, //i am  a reply so my parent is another comment
    parent_username: comment.username, //reply so my parent is another comment
    is_reply: true, //reply so true
    created_at: Date.now(),
    description,
    comment_in_community_flag: comment.post_in_community_flag, //same as post
    community_id: comment.community_id,
    community_name: comment.community_name,
    upvotes_count: 1, //when i first make comment
    spoiler_flag: comment.spoiler_flag,
  });

  comment.replies_comments_ids.push(reply._id);

  await comment.save();
  await reply.save();

  return {
    success: true,
    error: {},
    message: "Replied to comment sucessfully ",
  };
}

export async function commentToggler(request, toToggle) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }
    // Handle comments
    const comment = await Comment.findOne({
      _id: request.body.id,
      user_id: user._id,
    });

    // If comment not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        err: "Comment Not Found or User Not Authorized",
        msg: "Comment not found or user is not authorized to modify it.",
      };
    }

    // Toggle the spoiler_flag for the comment
    toggler(comment, toToggle);

    // Return success response
    return {
      success: true,
      status: 200,
      msg: `${toToggle} toggled successfully.`,
    };
  } catch (error) {
    // Catch any errors that occur during the process
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function editCommentDescription(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const comment = await Comment.findOne({
      _id: request.body.id,
      user_id: user._id,
    });

    // If comment not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        err: "Comment Not Found or User Not Authorized",
        msg: "Comment not found or user is not authorized to modify it.",
      };
    }
    comment.description = request.body.edited_text;
    comment.edited_at = Date.now();
    await comment.save();

    return {
      success: true,
      status: 200,
      msg: "text edited successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function commentVote(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const comment = await Comment.findOne({
      _id: request.body.id,
    });

    // If post not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        err: "Comment Not Found or User Not Authorized",
        msg: "Comment not found or user is not authorized to modify it.",
      };
    }
    if (request.body.vote == "1") {
      comment.upvotes_count = comment.upvotes_count + 1;
      await comment.save();
    } else {
      comment.downvotes_count = comment.downvotes_count + 1;
      await comment.save();
    }

    return {
      success: true,
      status: 200,
      msg: "voted successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function commentSave(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const commentId = request.body.id;

    const comment = await Comment.findOne({ _id: commentId });

    // If post not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        err: "Comment Not Found ",
        msg: "Comment not found ",
      };
    }

    // Check if the post ID is already in the saved_posts_ids array
    const index = user.saved_comments_ids.indexOf(commentId);
    if (index !== -1) {
      // If found, remove it from the array
      user.saved_comments_ids.splice(index, 1);
    } else {
      // If not found, add it to the array
      user.saved_comments_ids.push(commentId);
    }

    await user.save();

    return {
      success: true,
      status: 200,
      msg: "Action completed successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function commentApprove(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const comment = await Comment.findOne({
      _id: request.body.id,
      user_id: user._id,
    });

    // If post not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        err: "comment Not Found or User Not Authorized",
        msg: "comment not found or user is not authorized to modify it.",
      };
    }

    comment.moderator_details.removed_flag = false;
    comment.moderator_details.removed_by = null;
    comment.moderator_details.removed_date = null;
    comment.moderator_details.approved_flag = true;
    comment.moderator_details.approved_by = user._id;
    comment.moderator_details.approved_date = Date.now();
    await comment.save();
    return {
      success: true,
      status: 200,
      msg: "comment approved successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function commentRemove(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const comment = await Comment.findOne({
      _id: request.body.id,
      user_id: user._id,
    });

    // If post not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        err: "comment Not Found or User Not Authorized",
        msg: "comment not found or user is not authorized to modify it.",
      };
    }

    comment.moderator_details.approved_flag = false;
    comment.moderator_details.approved_by = null;
    comment.moderator_details.approved_date = null;
    comment.moderator_details.removed_flag = true;
    comment.moderator_details.removed_by = user._id;
    comment.moderator_details.removed_date = Date.now();
    await comment.save();
    return {
      success: true,
      status: 200,
      msg: "comment removed successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function commentReport(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const comment = await Comment.findOne({
      _id: request.body.id,
    });

    // If post not found or user not authorized, return an error response
    if (!comment || comment.user_id == user._id) {
      return {
        success: false,
        status: 400,
        err: "Comment Not Found or User Not Authorized",
        msg: "Comment not found or user is not authorized to report it.",
      };
    }
    user.reported_comments_ids.push(comment._id);
    await user.save();
    return {
      success: true,
      status: 200,
      msg: "Comment is reported successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function commentDelete(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    if (!user) {
      return { success, err, status, user, msg };
    }

    const commentId = request.body.id;

    const comment = await Comment.findOne({
      _id: commentId,
      user_id: user._id,
    });

    if (!comment) {
      return {
        success: false,
        status: 400,
        err: "Comment Not Found or User Not Authorized",
        msg: "Comment not found or user is not authorized to delete it.",
      };
    }

    comment.deleted_at = Date.now();
    comment.deleted = true;
    await comment.save();

    return {
      success: true,
      status: 200,
      msg: "Comment deleted successfully",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}
