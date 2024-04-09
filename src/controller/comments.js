import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";
import { User } from "../db/models/User.js";
import { Comment } from "../db/models/Comment.js";
import { toggler } from "../utils/toggler.js";

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
        err: "Comment Not Found or User Not Authorized",
        msg: "Comment not found or user is not authorized to modify it.",
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
