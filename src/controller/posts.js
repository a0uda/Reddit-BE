import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { User } from "../db/models/User.js";
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
  getCommunity,
  checkPostSettings,
  checkContentSettings,
  checkVotesMiddleware,
} from "../services/posts.js";
import { checkCommentVotesMiddleware } from "../services/comments.js";
import mongoose from "mongoose";
import { generateResponse } from "../utils/generalUtils.js";
import { pushNotification } from "./notifications.js";
import { getCommentsHelper } from "../services/users.js";

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
    // console.log(success, community, error);
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
    if (general_settings.type != "Public") {
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
    // console.log(resultType);
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
  post.username = user.username;
  post.created_at = Date.now();
  post.upvotes_count++;
  user.upvotes_posts_ids.push(post._id);
  
  if (post.upvotes_count + post.downvotes_count != 0) {
    post.user_details.upvote_rate =
      (post.upvotes_count / (post.upvotes_count + post.downvotes_count)) * 100;
  }

  await post.save();
  await user.save();
  console.log("HIIIIIIIIII", post._id);
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

    //
    if (!success) {
      return { success, error };
    }
    // post = await Post.findById(post._id);
    // console.log("SSSS", post instanceof mongoose.Document);
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
      username: user.username,
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

      if (general_settings.type != "Public") {
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

    await shared_post.save();
    const postObj = await Post.findById(post._id);
    postObj.shares_count++;
    postObj.user_details.total_shares++;
    await postObj.save();

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
  var post = await Post.findById(postId);

  if (!post) {
    return {
      success: false,
      error: { status: 404, message: "Post Not found" },
    };
  }
  const { user: loggedInUser } = await verifyAuthToken(request);
  if (loggedInUser) {
    var result = await checkVotesMiddleware(loggedInUser, [post]);
    post = result[0];
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
  const { user } = await verifyAuthToken(request);
  var comments = await Comment.find({ post_id: post._id })
    .populate("replies_comments_ids")
    .exec();
  if (user) {
    comments = await checkCommentVotesMiddleware(user, comments);

    await Promise.all(
      comments.map(async (comment) => {
        comment.replies_comments_ids = await checkCommentVotesMiddleware(
          user,
          comment.replies_comments_ids
        );
      })
    );
  }
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
    const postObj = await Post.findById(post._id);
    postObj.nsfw_flag = !postObj.nsfw_flag;
    await postObj.save();
    return {
      success: true,
      error: {},
      message: "Post nsfw_flag updated sucessfully to " + postObj.nsfw_flag,
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
    const postObj = await Post.findById(post._id);
    postObj.allowreplies_flag = !postObj.allowreplies_flag;
    await postObj.save();
    return {
      success: true,
      error: {},
      message:
        "Post allowreplies_flag updated sucessfully to " +
        postObj.allowreplies_flag,
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
    const postObj = await Post.findById(post._id);
    postObj.set_suggested_sort = request.body.set_suggested_sort;
    await postObj.save();
    return {
      success: true,
      error: {},
      message:
        "Post set_suggested_sort updated sucessfully to " +
        postObj.set_suggested_sort,
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
    // //console.error("Error:", error);
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
    // //console.error("Error:", error);
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
      //upvote
      if (upvoteIndex != -1) {
        //kan amel upvote -> toggle ysheel upvote
        user.upvotes_posts_ids.splice(upvoteIndex, 1);
        post.upvotes_count--;
      } else if (downvoteIndex != -1) {
        //kan amel downvote-> ashelo mn downvote w ahoto f upvote
        user.downvotes_posts_ids.splice(downvoteIndex, 1);
        post.downvotes_count--;
        post.upvotes_count = post.upvotes_count + 1;
        user.upvotes_posts_ids.push(post._id);
      } else {
        post.upvotes_count = post.upvotes_count + 1;
        user.upvotes_posts_ids.push(post._id);

        //send notif
        const userOfPost = await User.findById(post.user_id);

        const { success, error } = await pushNotification(
          userOfPost,
          user.username,
          post,
          null,
          "upvotes_posts"
        );
        if (!success) console.log(error);
      }
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
    }
    // console.log(post);
    console.log(post.upvotes_count + post.downvotes_count);
    console.log(post.downvotes_count);
    if (post.upvotes_count + post.downvotes_count != 0) {
      console.log(
        (post.upvotes_count / (post.upvotes_count + post.downvotes_count)) * 100
      );
      post.user_details.upvote_rate =
        (post.upvotes_count / (post.upvotes_count + post.downvotes_count)) *
        100;
    }
    try {
      await post.save();
      await user.save();
    } catch (e) {
      console.log(e);
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
      user.saved_posts_ids.push(post._id);
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
    // //console.error("Error:", error);
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
    // //console.error("Error:", error);
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
    // //console.error("Error:", error);
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
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred.",
    };
  }
}

export async function pollVote(request) {
  try {
    const { success, error, post, user, message } = await getPost(
      request,
      true
    );
    if (!success) {
      return { success, error };
    }
    const { id, option_id } = request.body;
    if (!id || !option_id) {
      return generateResponse(false, 400, "Required post id and option id");
    }
    if (post.type != "polls")
      return generateResponse(false, 400, "Post is not of type polls");

    if (post.polls_voting_is_expired_flag)
      return generateResponse(false, 400, "Post poll vote is expired");

    const postObj = await Post.findById(post._id);
    const expirationDate = new Date(post.created_at);
    expirationDate.setDate(expirationDate.getDate() + post.polls_voting_length);
    const currentDate = new Date();
    if (currentDate > expirationDate) {
      postObj.polls_voting_is_expired_flag = true;
      await postObj.save();
      return generateResponse(false, 400, "Post poll vote is expired");
    }

    const index = postObj.polls.findIndex(
      (option) => option._id.toString() == option_id.toString()
    );
    if (index == -1)
      return generateResponse(false, 400, "Option not found in post poll");

    postObj.polls[index].votes++;
    postObj.polls[index].users_ids.push(user._id);

    await postObj.save();
    return {
      success: true,
      error: {},
      message:
        "Voted to option " + postObj.polls[index].options + " sucessfully",
    };
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}

export async function getTrendingPosts(request) {
  try {
    const postsTitles = await Post.aggregate([
      {
        $match: {
          type: "image_and_videos",
          images: { $elemMatch: { path: { $exists: true, $ne: null } } },
        },
      },
      {
        $group: {
          _id: "$title",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "Post",
          localField: "_id",
          foreignField: "title",
          as: "Post",
        },
      },
    ]);

    console.log(postsTitles);
    var posts = [];

    for (const titleInfo of postsTitles) {
      const post = await Post.findOne({ title: titleInfo._id }); // Assuming title is unique
      posts.push(post);
    }

    return { success: true, posts };
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}
