import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";

export function getFriendsFormat(user) {
  return {
    _id: user._id,
    created_at: user.created_at,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    about: user.about,
    profile_picture: user.profile_picture,
    banner_picture: user.banner_picture,
    country: user.country,
    gender: user.gender,
  };
}

export async function getBlockedUser(user) {
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

export async function getMutedCommunities(user) {
  const mutedCommunities = await Promise.all(
    user.safety_and_privacy_settings.muted_communities.map(async (muted) => {
      const mutedCommunity = await Community.findById(muted.id);
      if (mutedCommunity) {
        const { title, profile_picture } = mutedCommunity;
        return {
          id: muted.id.toString(),
          title,
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

export function getAboutFormat(user) {
  return {
    _id: user._id,
    username: user.username,
    created_at: user.created_at,
    email: user.email,
    verified_email_flag: user.verified_email_flag,
    gmail: user.gmail,
    connected_google: user.connected_google,
    facebook_email: user.facebook_email,
    display_name: user.display_name,
    about: user.about,
    social_links: user.social_links,
    profile_picture: user.profile_picture,
    banner_picture: user.banner_picture,
    country: user.country,
    gender: user.gender,
  };
}
