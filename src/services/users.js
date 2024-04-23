import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { getSortCriteria } from "../utils/lisitng.js";
import {
  paginateUserPosts,
  paginateUserComments,
  paginatePosts,
} from "./lisitngs.js";

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
    console.error("Error:", error);
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

    console.log(posts);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
  // const posts = await Post.find({ _id: { $in: user[postsType] } }).exec();

  // const filteredPosts = posts.filter((post) => post != null);
  // return filteredPosts;
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
    } else {
      posts = await paginateUserPosts(
        user._id,
        [],
        offset,
        sortCriteria,
        pageSize
      );
    }
    console.log(posts);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

export async function getCommentsHelper(user, commentsType) {
  const comments = await Comment.find({
    _id: { $in: user[commentsType] },
  }).exec();

  const filteredComments = comments.filter((comment) => comment != null);
  return filteredComments;
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
    } else {
      comments = await paginateUserComments(
        user._id,
        [],
        offset,
        sortCriteria,
        pageSize
      );
    }
    console.log(comments);
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
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
