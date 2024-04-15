import { Post } from "../db/models/Post.js";
import { verifyAuthToken } from "./userAuth.js";
import {
  getCommunityGeneralSettings,
  getCommunityPostsAndComments,
  getCommunityContentControls,
} from "../services/communitySettingsService.js";
import { toggler } from "../utils/toggler.js";
import {
  checkApprovedUser,
  checkBannedUser,
  checkNewPostInput,
  getPostCommentsHelper,
  getCommunity,
  checkPostSettings,
  checkContentSettings,
} from "../services/posts.js";

export async function createPost(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return { success, error: { status, message: err } };
  }
  const { result, message } = await checkNewPostInput(request.body);
  if (!result) {
    return {
      success: result,
      error: {
        status: 400,
        message,
      },
    };
  }

  const {
    title,
    description,
    post_in_community_flag,
    type,
    images,
    videos,
    link_url,
    polls,
    polls_voting_length,
    community_name,
    oc_flag,
    spoiler_flag,
    nsfw_flag,
  } = request.body;

  const post = new Post({
    title,
    description,
    post_in_community_flag,
    type,
    images: type != "image_and_videos" && type !== "hybrid" ? [] : images,
    videos: type != "image_and_videos" && type !== "hybrid" ? [] : videos,
    link_url: type != "url" && type != "hybrid" ? null : link_url,
    polls: type != "polls" && type != "hybrid" ? [] : polls,
    polls_voting_length:
      type != "polls" && type != "hybrid" ? 3 : polls_voting_length,
    community_name,
    oc_flag,
    spoiler_flag,
    nsfw_flag,
  });

  //if post in community
  if (post_in_community_flag) {
    //1.community must exist
    const { success, community, error } = await getCommunity(community_name);
    console.log(success, community, error);
    if (!success) {
      return { success, error };
    }
    //2. if community is restricted or private only approved users can post
    const { err, general_settings } = await getCommunityGeneralSettings(
      community_name
    );
    if (err) {
      return next(err);
    }
    if (general_settings.visibility != "Public") {
      const result = await checkApprovedUser(community, user._id);
      if (!result.success) {
        return result;
      }
    }

    //3. check if user is banned he can't post
    const result = await checkBannedUser(community, user._id);
    if (!result.success) {
      return result;
    }

    //4. if nsfw flag in general settings community is true ->flag post is true
    post.nsfw_flag = general_settings.nsfw_flag;
    //5.check allowed type post url,poll,image
    //allow_multiple_images_per_post
    const resultType = await checkPostSettings(post, community_name);
    console.log(resultType);
    if (!resultType.success) {
      return resultType;
    }
    //6. community content controls:
    const resultContent = await checkContentSettings(post, community_name);
    if (!resultContent.success) {
      return resultContent;
    }
    post.community_id = community._id;
  }
  //if post in user profile
  //check nsfw flag
  else {
    post.nsfw_flag = user.profile_settings.nsfw_flag;
  }

  //if all good and i am going to post
  //set all necessary attributes (flags oc and nsf and spoiler if found)
  //upvote++
  //add it is user upvote posts
  post.user_id = user._id;
  post.created_at = Date.now();
  post.upvotes_count++;
  user.upvotes_posts_ids.push(post._id);
  await post.save();
  await user.save();
  return {
    success: true,
    error: {},
    message: "Post created sucessfully ",
  };
}

export async function sharePost(request) {
  try {
    const { success, error, post, user, message } = await getPost(
      request,
      true
    );
    if (!success) {
      return { success, error };
    }
    const {
      post_in_community_flag,
      community_name,
      caption,
      oc_flag,
      spoiler_flag,
      nsfw_flag,
    } = request.body;
    const shared_post = new Post({
      created_at: Date.now(),
      user_id: user._id,
      type: "reposted",
      title: caption,
      post_in_community_flag,
      oc_flag,
      spoiler_flag,
      nsfw_flag,
      is_reposted_flag: true,
      reposted: {
        original_post_id: post._id,
      },
    });
    if (post_in_community_flag == undefined || caption == undefined) {
      return {
        success: false,
        error: {
          status: 400,
          message: "post_in_community_flag and caption are required",
        },
      };
    }
    // console.log(community_name);
    //1.check user can't repost same post twice(IN SAME COMMUNITY)
    const existingRepost = await Post.findOne({
      "reposted.original_post_id": post._id,
      user_id: user._id,
      post_in_community_flag,
      community_name,
    });
    if (existingRepost) {
      return {
        success: false,
        error: {
          status: 400,
          message:
            "You have already reposted this post in the same community/your profile",
        },
      };
    }
    //2.check user can't repost a reposted post
    if (post.is_reposted_flag) {
      return {
        success: false,
        error: {
          status: 400,
          message: "You cannot repost a reposted post",
        },
      };
    }

    //check if repost in community
    if (post_in_community_flag) {
      const { success, community, error } = await getCommunity(community_name);
      if (!success) {
        return { success, error };
      }

      const { err, posts_and_comments } = await getCommunityPostsAndComments(
        community_name
      );
      if (err) {
        return next(err);
      }
      if (!posts_and_comments.posts.allow_crossposting_of_posts) {
        return {
          success: false,
          error: {
            status: 400,
            message: "Can't repost to this community",
          },
        };
      }
      //2. if community is restricted or private only approved users can post
      const { err: err2, general_settings } = await getCommunityGeneralSettings(
        community_name
      );
      if (err2) {
        return next(err2);
      }
      if (general_settings.visibility != "Public") {
        const result = await checkApprovedUser(community, user._id);
        if (!result.success) {
          return result;
        }
      }

      //3. check if user is banned he can't post
      const result = await checkBannedUser(community, user._id);
      if (!result.success) {
        return result;
      }

      shared_post.community_name = community_name;
      shared_post.community_id = community._id;
    }

    post.shares_count++;
    post.user_details.total_shares++;
    await shared_post.save();
    await post.save();

    return {
      success: true,
      error: {},
      message: "Shared post sucessfully",
    };
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}

export async function getPost(request, verifyUser) {
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
    user,
    message: "Post Retrieved sucessfully",
  };
}

export async function getPostComments(request) {
  const { success, error, post, message } = await getPost(request, false);
  if (!success) {
    return { success, error };
  }

  const comments = await getPostCommentsHelper(post._id);
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
        err: "Post Not Found ",
        msg: "Post not found ",
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

export async function postApprove(request) {
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

    post.moderator_details.removed_flag = false;
    post.moderator_details.removed_by = null;
    post.moderator_details.removed_date = null;
    post.moderator_details.approved_flag = true;
    post.moderator_details.approved_by = user._id;
    post.moderator_details.approved_date = Date.now();
    await post.save();
    return {
      success: true,
      status: 200,
      msg: "post approved successfully",
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

export async function postRemove(request) {
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

    post.moderator_details.approved_flag = false;
    post.moderator_details.approved_by = null;
    post.moderator_details.approved_date = null;
    post.moderator_details.removed_flag = true;
    post.moderator_details.removed_by = user._id;
    post.moderator_details.removed_date = Date.now();
    await post.save();
    return {
      success: true,
      status: 200,
      msg: "post removed successfully",
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

export async function postReport(request) {
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
    if (!post || post.user_id == user._id) {
      return {
        success: false,
        status: 400,
        err: "Post Not Found or User Not Authorized",
        msg: "Post not found or user is not authorized to report it.",
      };
    }
    user.hidden_and_reported_posts_ids.push(post._id);
    await user.save();
    return {
      success: true,
      status: 200,
      msg: "post is reported successfully",
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

export async function getUserPostDetails(request) {
  const { success, error, post, user, message } = await getPost(request, true);
  if (!success) {
    return { success, error };
  }
  //check if the user is the author of this post
  if (post.user_id.toString() != user._id.toString()) {
    return {
      success: false,
      error: {
        status: 400,
        message:
          "The user can't view post statistics ad he is no the owner of this post",
      },
    };
  }
  return {
    success: true,
    user_details: {
      ...post.user_details,
      comments_count: post.comments_count,
    },
    message: "Post user details retrieved sucessfully",
  };
}

export async function postDelete(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);

    if (!user) {
      return { success, err, status, user, msg };
    }

    const postId = request.body.id;

    const post = await Post.findOne({
      _id: postId,
      user_id: user._id,
    });

    if (!post) {
      return {
        success: false,
        status: 400,
        err: "Post Not Found or User Not Authorized",
        msg: "Post not found or user is not authorized to delete it.",
      };
    }

    post.deleted_at = Date.now();
    post.deleted = true;
    await post.save();

    return {
      success: true,
      status: 200,
      msg: "Post deleted successfully",
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
