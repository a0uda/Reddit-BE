import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";

export async function getPost(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return { success, error: { status, message: err } };
  }
  const postId = request?.body?.id;
  if (postId == undefined || postId == null) {
    return {
      success: false,
      error: { status: 400, message: "Post id is required" },
    };
  }
  const post = await Post.findById(postId);
  if (!post) {
    return {
      success: false,
      error: { status: 404, message: "Post Not found" },
    };
  }
  return {
    success: true,
    post,
    message: "Post Retrieved sucessfully",
  };
}

export async function marknsfw(request) {
  try {
    const { success, error, post, message } = await getPost(request);
    if (!success) {
      return { success, error };
    }
    post.nsfw_flag = !post.nsfw_flag;
    await post.save();
    return {
      success: true,
      error: {},
      message: "Post nsfw_flag updated sucessfully to " + post.nsfw_flag,
    };
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}

export async function allowReplies(request) {
  try {
    const { success, error, post, message } = await getPost(request);
    if (!success) {
      return { success, error };
    }
    post.allowreplies_flag = !post.allowreplies_flag;
    await post.save();
    return {
      success: true,
      error: {},
      message:
        "Post allowreplies_flag updated sucessfully to " +
        post.allowreplies_flag,
    };
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}

export async function setSuggestedSort(request) {
  try {
    const { success, error, post, message } = await getPost(request);
    if (!success) {
      return { success, error };
    }
    const validOptions = [
      "None (Recommended)",
      "Best",
      "Old",
      "Top",
      "Q&A",
      "Live (Beta)",
      "Controversial",
      "New",
    ];
    if (!validOptions.includes(request.body.set_suggested_sort)) {
      return {
        success: false,
        error: {
          status: 400,
          message:
            "Invalid value for set_suggested_sort. Valid options are: " +
            validOptions.join(", "),
        },
      };
    }
    post.set_suggested_sort = request.body.set_suggested_sort;
    await post.save();
    return {
      success: true,
      error: {},
      message:
        "Post set_suggested_sort updated sucessfully to " +
        post.set_suggested_sort,
    };
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}
