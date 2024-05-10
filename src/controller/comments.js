/**
 * @module comments/controller
 */
import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";
import { User } from "../db/models/User.js";
import { Comment } from "../db/models/Comment.js";
import { toggler } from "../utils/toggler.js";
import { getPost } from "./posts.js";
import { checkBannedUser, getCommunity } from "../services/posts.js";
import { checkCommentVotesMiddleware } from "../services/comments.js";
import { pushNotification } from "./notifications.js";

/**
 * Retrieve a specific comment by its ID and populate its replies.
 *
 * @param {Object} request - The request object containing comment ID in the body or query.
 * @param {Boolean} verifyUser - A flag indicating whether to verify the user's authentication token.
 * 
 * @returns {Object} An object containing the retrieved comment and user information (if authenticated).
 */
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
  const comment = await Comment.findById(commentId)
    .populate("replies_comments_ids")
    .exec();
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
    message: "Comment Retrieved successfully",
  };
}

/**
 * Retrieve a comment with its replies and handle user authentication for vote status.
 *
 * @param {Object} request - The request object containing the comment ID.
 * @returns {Object} An object containing the retrieved comment with votes and authenticated user.
 *
 * @typedef {Object} CommentDataWithReplies
 * @property {Boolean} success - Indicates if the operation was successful.
 * @property {Object|null} comment - The retrieved comment object with populated replies.
 * @property {Object|null} user - The authenticated user object (or null if not verified or authenticated).
 * @property {String|null} message - A descriptive message indicating the result of the operation.
 */
export async function getCommentWithReplies(request) {
  const { success, error, comment, message } = await getComment(request, false);
  // console.log(comment);
  if (!success) {
    return { success, error };
  }
  var commentWithReply = comment;
  const { user } = await verifyAuthToken(request);
  if (user) {
    var res = await checkCommentVotesMiddleware(user, [commentWithReply]);
    commentWithReply = res[0];
    commentWithReply.replies_comments_ids = await checkCommentVotesMiddleware(
      user,
      commentWithReply.replies_comments_ids
    );
  }
  return {
    success: true,
    comment: commentWithReply,
    user,
    message: "Comment Retrieved sucessfully",
  };
}

/**
 * Create a new comment on a post and handle related validations and operations.
 *
 * @param {Object} request - The request object containing the necessary data for creating a comment.
 * @returns {Object} An object indicating the success status and details of the created comment.
 *
 * @typedef {Object} NewCommentResult
 * @property {Boolean} success - Indicates whether the operation was successful.
 * @property {Object} error - Details of any error encountered during the operation.
 * @property {String} [error.status] - The HTTP status code associated with the error (if applicable).
 * @property {String} [error.message] - A descriptive message explaining the error (if applicable).
 * @property {String} message - A descriptive message indicating the outcome of the operation.
 * @property {String} [comment_id] - The ID of the newly created comment (if successful).
 */

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
    post_title: post.title,
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
    upvote_users: [user._id],
  });

  // comment.upvote_users.push(user._id);
  await comment.save();

  console.log(post);
  const postObj = await Post.findById(post._id);
  postObj.comments_count++;
  await postObj.save();

  //send notif

  const userOfPost = await User.findById(post.user_id);
  const { success: succesNotif, error: errorNotif } = await pushNotification(
    userOfPost,
    user.username,
    post,
    comment,
    "comments"
  );
  if (!succesNotif) console.log(errorNotif);

  return {
    success: true,
    error: {},
    message: "Comment created successfully",
    comment_id: comment._id,
  };
}

/**
 * Create a reply to an existing comment and handle related validations and operations.
 *
 * @param {Object} request - The request object containing the necessary data for creating a reply.
 * @returns {Object} An object indicating the success status and details of the created reply.
 *
 * @typedef {Object} ReplyToCommentResult
 * @property {Boolean} success - Indicates whether the operation was successful.
 * @property {Object} error - Details of any error encountered during the operation.
 * @property {String} [error.status] - The HTTP status code associated with the error (if applicable).
 * @property {String} [error.message] - A descriptive message explaining the error (if applicable).
 * @property {String} message - A descriptive message indicating the outcome of the operation.
 */
export async function replyToComment(request) {
  const { success, error, comment, user, message } = await getComment(
    request,
    true
  );
  // console.log(comment);
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

  const post = await Post.findById(comment.post_id);

  const reply = new Comment({
    post_id: comment.post_id,
    post_title: post.title,
    user_id: user._id,
    username: user.username,
    parent_id: comment._id, //i am  a reply so my parent is another comment
    parent_username: comment.username, //reply so my parent is another comment
    is_reply: true, //reply so true
    created_at: Date.now(),
    description,
    comment_in_community_flag: comment.comment_in_community_flag, //same as post
    community_id: comment.community_id,
    community_name: comment.community_name,
    upvotes_count: 1, //when i first make comment
    spoiler_flag: comment.spoiler_flag,
    upvote_users:[user._id]
  });

  console.log("J", reply);
  comment.replies_comments_ids.push(reply._id);

  await comment.save();
  // reply.upvote_users.push(user._id);
  await reply.save();
  post.comments_count++;
  await post.save();

  console.log(comment);
  //send notif
  const userOfComment = await User.findById(comment.user_id);
  console.log(userOfComment);
  const { success: succesNotif, error: errorNotif } = await pushNotification(
    userOfComment,
    user.username,
    null,
    comment,
    "replies"
  );
  if (!succesNotif) console.log(errorNotif);

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
      return { success, error: err, status, user, msg };
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
        error: "Comment Not Found or User Not Authorized",
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
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
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
      return { success, error: err, status, user, msg };
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
        error: "Comment Not Found or User Not Authorized",
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
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
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
      return { success, error: err, status, user, msg };
    }

    const comment = await Comment.findOne({
      _id: request.body.id,
    });

    // If post not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        error: "Comment Not Found or User Not Authorized",
        msg: "Comment not found or user is not authorized to modify it.",
      };
    }

    const downvoteIndex = comment.downvote_users.indexOf(user.username);
    const upvoteIndex = comment.upvote_users.indexOf(user.username);
    if (request.body.vote == "1") {
      //upvote
      if (upvoteIndex != -1) {
        //kan amel upvote -> toggle ysheel upvote
        comment.upvote_users.splice(upvoteIndex, 1);
        comment.upvotes_count--;
      } else if (downvoteIndex != -1) {
        //kan amel downvote-> ashelo mn downvote w ahoto f upvote
        comment.downvote_users.splice(downvoteIndex, 1);
        comment.downvotes_count--;
        comment.upvotes_count++;
        comment.upvote_users.push(user.username);
      } else {
        comment.upvotes_count++;
        comment.upvote_users.push(user.username);
        //send notif
        const userOfComment = await User.findById(comment.user_id);
        console.log(userOfComment);
        const { success } = await pushNotification(
          userOfComment,
          user.username,
          null,
          comment,
          "upvotes_comments"
        );
        if (!success) console.log("Error in sending notification");
      }
      await comment.save();
      await user.save();
    } else {
      if (downvoteIndex != -1) {
        comment.downvote_users.splice(downvoteIndex, 1);
        comment.downvotes_count--;
      } else if (upvoteIndex != -1) {
        comment.upvote_users.splice(upvoteIndex, 1);
        comment.upvotes_count--;
        comment.downvotes_count++;
        comment.downvote_users.push(user.username);
      } else {
        comment.downvotes_count++;
        comment.downvote_users.push(user.username);
      }
      await user.save();
      await comment.save();
    }

    return {
      success: true,
      status: 200,
      msg: "voted successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
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
      return { success, error: err, status, user, msg };
    }

    const commentId = request.body.id;

    const comment = await Comment.findOne({ _id: commentId });

    // If post not found or user not authorized, return an error response
    if (!comment) {
      return {
        success: false,
        status: 400,
        error: "Comment Not Found ",
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
      user.saved_comments_ids.push(comment._id);
    }

    await user.save();

    return {
      success: true,
      status: 200,
      msg: "Action completed successfully",
    };
  } catch (error) {
    // Catch any errors that occur during the process
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
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
      return { success, error: err, status, user, msg };
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
        error: "comment Not Found or User Not Authorized",
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
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
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
      return { success, error: err, status, user, msg };
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
        error: "comment Not Found or User Not Authorized",
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
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
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
      return { success, error: err, status, user, msg };
    }

    const comment = await Comment.findOne({
      _id: request.body.id,
    });

    // If post not found or user not authorized, return an error response
    if (!comment || comment.user_id == user._id) {
      return {
        success: false,
        status: 400,
        error: "Comment Not Found or User Not Authorized",
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
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
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
        error: "Comment Not Found or User Not Authorized",
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
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      error: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}
