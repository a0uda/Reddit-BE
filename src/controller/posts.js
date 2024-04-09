import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";
import { getPostCommentsHelper } from "../services/posts.js";

export async function getPost(request, verifyUser) {
  if (verifyUser) {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, error: { status, message: err } };
    }
  }
  const postId = request?.body?.id || request?.query?.id;
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

export async function getPostComments(request) {
  const postId = request?.query?.id;

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

  const comments = await getPostCommentsHelper(postId);
  return {
    success: true,
    comments,
    message: "Comments Retrieved sucessfully",
  };
}

export async function getViewsCount(request) {
  try {
    const { success, error, post, message } = await getPost(request, false);
    if (!success) {
      return { success, error };
    }
    return {
      success: true,
      error: {},
      message: "Post views_count retrived sucessfully ",
      views_count: post.views_count,
    };
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}

export async function marknsfw(request) {
  try {
    const { success, error, post, message } = await getPost(request, true);
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
    const { success, error, post, message } = await getPost(request, true);
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
    const { success, error, post, message } = await getPost(request, true);
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

export async function hideUnhidePost(request) {
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
  if (!user.hidden_and_reported_posts_ids.includes(post.id)) {
    user.hidden_and_reported_posts_ids.push(post.id);
    await user.save();
    return {
      success: true,
      error: {},
      message: "Post hidden sucessfully",
    };
  } else {
    const indexToRemove = user.hidden_and_reported_posts_ids.indexOf(
      post._id.toString()
    );
    user.hidden_and_reported_posts_ids.splice(indexToRemove, 1);
    await user.save();
    return {
      success: true,
      post,
      message: "Post unhidden sucessfully",
    };
  }
}
