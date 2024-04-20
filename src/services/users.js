import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";

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
export async function getPostsHelper(user, postsType) {
  const posts = await Post.find({ _id: { $in: user[postsType] } }).exec();

  const filteredPosts = posts.filter((post) => post != null);
  return filteredPosts;
}

//Posts written by certain user
export async function getUserPostsHelper(user) {
  console.log(user._id);
  const posts = await Post.find({ user_id: user._id }).exec();
  console.log(posts);
  return posts;
}

export async function getCommentsHelper(user, commentsType) {
  const comments = await Comment.find({
    _id: { $in: user[commentsType] },
  }).exec();

  const filteredComments = comments.filter((comment) => comment != null);
  return filteredComments;
}

export async function getUserCommentsHelper(user) {
  const comments = await Comment.find({ user_id: user._id }).exec();

  return comments;
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
