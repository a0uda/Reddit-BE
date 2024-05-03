import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { getSortCriteria } from "../utils/lisitng.js";
import {
  paginateUserPosts,
  paginateUserComments,
  paginatePosts,
  paginateComments,
} from "./lisitngs.js";
import { checkVotesMiddleware } from "./posts.js";
import { checkCommentVotesMiddleware } from "./comments.js";
import { getCommunityGeneralSettings } from "../services/communitySettingsService.js";

export async function followUserHelper(user1, user2, follow = true) {
  try {
    if (follow) {
      if (!user2.followers_ids.includes(user1._id)) {
        user2.followers_ids.push(user1._id);
        await user2.save();
      }

      if (!user1.following_ids.includes(user2._id)) {
        user1.following_ids.push(user2._id);
        await user1.save();
      }

      console.log(`User ${user1.username} follows user ${user2.username}.`);
    } else {
      const indexUserOne = user2.followers_ids.indexOf(user1._id);
      if (indexUserOne !== -1) {
        user2.followers_ids.splice(indexUserOne, 1);
        await user2.save();
      }

      const indexUserTwo = user1.following_ids.indexOf(user2._id);
      if (indexUserTwo !== -1) {
        user1.following_ids.splice(indexUserTwo, 1);
        await user1.save();
      }

      console.log(`User ${user1.username} unfollows user ${user2.username}.`);
    }
  } catch (error) {
    //console.error("Error:", error);
  }
}

//Posts saved in user arrays
export async function getPostsHelper(
  user,
  postsType,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let hidden_posts = user.hidden_and_reported_posts_ids;
    if (postsType == "hidden_and_reported_posts_ids") hidden_posts = [];

    let posts = await paginatePosts(
      user,
      postsType,
      hidden_posts,
      offset,
      sortCriteria,
      pageSize
    );
    if (user) posts = await checkVotesMiddleware(user, posts);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    // throw error;
  }
}

//Posts written by certain user
export async function getUserPostsHelper(
  loggedInUser,
  user,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let posts = [];
    if (loggedInUser) {
      let hidden_posts = loggedInUser.hidden_and_reported_posts_ids;

      posts = await paginateUserPosts(
        user._id,
        hidden_posts,
        offset,
        sortCriteria,
        pageSize
      );

      posts = await checkVotesMiddleware(loggedInUser, posts);

      const postIds = posts.map((post) => post._id);

      await Post.updateMany(
        { _id: { $in: postIds } },
        {
          $inc: {
            views_count: 1,
            "user_details.total_views": 1,
          },
        }
      );
    } else {
      posts = await paginateUserPosts(
        user._id,
        [],
        offset,
        sortCriteria,
        pageSize
      );
    }
    // console.log(posts);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    // throw error;
  }
}

export async function getCommentsHelper(
  user,
  commentsType,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    console.log(commentsType);
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let comments = await paginateComments(
      user,
      commentsType,
      offset,
      sortCriteria,
      pageSize
    );
    comments = await checkCommentVotesMiddleware(user, comments);

    await Promise.all(
      comments.map(async (comment) => {
        comment.replies_comments_ids = await checkCommentVotesMiddleware(
          user,
          comment.replies_comments_ids
        );
      })
    );
    return comments;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
}

export async function getUserCommentsHelper(
  loggedInUser,
  user,
  pageNumber,
  pageSize,
  sortBy
) {
  try {
    const offset = (pageNumber - 1) * pageSize;
    let sortCriteria = getSortCriteria(sortBy);
    let comments = [];
    if (loggedInUser) {
      let hidden_comments = loggedInUser.reported_comments_ids;

      comments = await paginateUserComments(
        user._id,
        hidden_comments,
        offset,
        sortCriteria,
        pageSize
      );

      comments = await checkCommentVotesMiddleware(loggedInUser, comments);

      await Promise.all(
        comments.map(async (comment) => {
          comment.replies_comments_ids = await checkCommentVotesMiddleware(
            loggedInUser,
            comment.replies_comments_ids
          );
        })
      );
    } else {
      comments = await paginateUserComments(
        user._id,
        [],
        offset,
        sortCriteria,
        pageSize
      );
    }
    // console.log(comments);
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    // throw error;
  }
}

export async function getCommunitiesHelper(user) {
  const communities = await Promise.all(
    user.communities.map(async (userCommunity) => {
      const community = await Community.findById(userCommunity.id);
      if (community) {
        const { name, profile_picture, members_count } = community;
        return {
          id: userCommunity.id.toString(),
          name,
          profile_picture,
          favorite_flag: userCommunity.favorite_flag,
          disable_updates: userCommunity.disable_updates,
          members_count,
        };
      }
    })
  );
  const filteredCommunities = communities.filter(
    (community) => community != null
  );
  return filteredCommunities;
}

export async function getModeratedCommunitiesHelper(user) {
  const moderatedCommunities = await Promise.all(
    user.moderated_communities.map(async (userCommunity) => {
      const community = await Community.findById(userCommunity.id);
      if (community) {
        const { name, profile_picture, members_count } = community;
        const joinedCommunity = user.communities.find(
          (joinedCommunityObj) =>
            joinedCommunityObj.id.toString() == community._id.toString()
        );
        const joined = !joinedCommunity ? false : true;
        return {
          id: userCommunity.id.toString(),
          name,
          profile_picture,
          favorite_flag: userCommunity.favorite_flag,
          members_count,
          joined,
        };
      }
    })
  );
  const filteredCommunities = moderatedCommunities.filter(
    (community) => community != null
  );
  return filteredCommunities;
}

export async function getBlockedUserHelper(user) {
  const blockedUsers = await Promise.all(
    user.safety_and_privacy_settings.blocked_users.map(async (block) => {
      const blockedUser = await User.findById(block.id);
      if (blockedUser) {
        const { username, profile_picture } = blockedUser;
        return {
          id: block.id.toString(),
          username,
          profile_picture,
          blocked_date: block.blocked_date,
        };
      }
    })
  );
  const filteredBlockedUsers = blockedUsers.filter((user) => user != null);
  return filteredBlockedUsers;
}

export async function getMutedCommunitiesHelper(user) {
  const mutedCommunities = await Promise.all(
    user.safety_and_privacy_settings.muted_communities.map(async (muted) => {
      const mutedCommunity = await Community.findById(muted.id);
      if (mutedCommunity) {
        const { name, profile_picture } = mutedCommunity;
        return {
          id: muted.id.toString(),
          name,
          profile_picture,
          muted_date: muted.muted_date,
        };
      }
    })
  );
  const filteredMutedCommunities = mutedCommunities.filter(
    (community) => community != null
  );
  return filteredMutedCommunities;
}

export async function getActiveCommunitiesHelper(communities) {
  const activeCommunities = await Promise.all(
    communities.map(async (community) => {
      const { err, general_settings } = await getCommunityGeneralSettings(
        community.name
      );
      if (!err) {
        return {
          id: community.id.toString(),
          name: community.name,
          description: general_settings.description,
          title: general_settings.title,
          profile_picture: community.profile_picture,
          banner_picture: community.banner_picture,
          members_count: community.members_count,
        };
      }
    })
  );
  return activeCommunities.filter((community) => community);
}
