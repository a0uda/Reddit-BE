import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";
import { User } from "../db/models/User.js";
import { Comment } from "../db/models/Comment.js";
import { toggler } from "../utils/toggler.js";

export async function postToggler(request, toToggle) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const post = await Post.findOne({
      _id: request.body.id,
      user_id: user._id,
    });

    // If post not found or user not authorized, return an error response
    if (!post) {
      return {
        success: false,
        status: 400,
        err: "Post Not Found or User Not Authorized",
        msg: "Post not found or user is not authorized to modify it.",
      };
    }

    // Toggle the spoiler_flag for the post
    toggler(post, toToggle);

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

export async function editPostDescription(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const post = await Post.findOne({
      _id: request.body.id,
      user_id: user._id,
    });

    // If post not found or user not authorized, return an error response
    if (!post) {
      return {
        success: false,
        status: 400,
        err: "Post Not Found or User Not Authorized",
        msg: "Post not found or user is not authorized to modify it.",
      };
    }
    post.description = request.body.edited_text;
    post.edited_at = Date.now();
    await post.save();

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

export async function postVote(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const post = await Post.findOne({
      _id: request.body.id,
    });

    // If post not found or user not authorized, return an error response
    if (!post) {
      return {
        success: false,
        status: 400,
        err: "Post Not Found or User Not Authorized",
        msg: "Post not found or user is not authorized to modify it.",
      };
    }
    const downvoteIndex = user.downvotes_posts_ids.indexOf(post._id);
    const upvoteIndex = user.upvotes_posts_ids.indexOf(post._id);
    if (request.body.vote == "1") {
      if (upvoteIndex != -1) {
        user.upvotes_posts_ids.splice(upvoteIndex, 1);
        post.upvotes_count--;
      } else if (downvoteIndex != -1) {
        user.downvotes_posts_ids.splice(downvoteIndex, 1);
        post.downvotes_count--;
        post.upvotes_count = post.upvotes_count + 1;
        user.upvotes_posts_ids.push(post._id);
      } else {
        post.upvotes_count = post.upvotes_count + 1;
        user.upvotes_posts_ids.push(post._id);
      }
      await post.save();
      await user.save();
    } else {
      if (downvoteIndex != -1) {
        user.downvotes_posts_ids.splice(downvoteIndex, 1);
        post.downvotes_count--;
      } else if (upvoteIndex != -1) {
        user.upvotes_posts_ids.splice(upvoteIndex, 1);
        post.upvotes_count--;
        post.downvotes_count = post.downvotes_count + 1;
        user.downvotes_posts_ids.push(post._id);
      } else {
        post.downvotes_count = post.downvotes_count + 1;
        user.downvotes_posts_ids.push(post._id);
      }
      await post.save();
      await user.save();
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

export async function postSave(request) {
  try {
    // Verify the auth token
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    // If authentication fails, return the response
    if (!user) {
      return { success, err, status, user, msg };
    }

    const postId = request.body.id;

    const post = await Post.findOne({ _id: postId });

    // If post not found or user not authorized, return an error response
    if (!post) {
      return {
        success: false,
        status: 400,
        err: "Post Not Found or User Not Authorized",
        msg: "Post not found or user is not authorized to modify it.",
      };
    }

    // Check if the post ID is already in the saved_posts_ids array
    const index = user.saved_posts_ids.indexOf(postId);
    if (index !== -1) {
      // If found, remove it from the array
      user.saved_posts_ids.splice(index, 1);
    } else {
      // If not found, add it to the array
      user.saved_posts_ids.push(postId);
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
