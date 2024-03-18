import {
  getAccountSettingsFormat,
  getProfileSettingsFormat,
  getSafetySettingsFormat,
  getFeedSettingsFormat,
  getNotificationsSettingsFormat,
  getEmailSettingsFormat,
  getChatAndMsgsSettingsFormat,
  setAccountSettings,
  setProfileSettings,
  setNotificationSettings,
  setEmailSettings,
  setChatSettings,
  setFeedSettings,
} from "../utils/userSettings.js";
import { verifyAuthToken } from "./userAuth.js";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";

export async function getSettings(request, flag) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return { success, err, status, user, msg };
  }
  var settings;
  if (flag == "Account") settings = getAccountSettingsFormat(user);
  else if (flag == "Profile") settings = getProfileSettingsFormat(user);
  else if (flag == "Feed") settings = getFeedSettingsFormat(user);
  else if (flag == "Notification")
    settings = getNotificationsSettingsFormat(user);
  else if (flag == "Chat") settings = getChatAndMsgsSettingsFormat(user);
  else if (flag == "Email") settings = getEmailSettingsFormat(user);
  return {
    success: true,
    settings: settings,
  };
}

export async function getSafetySettings(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }

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

    const filteredBlockedUsers = blockedUsers.filter((user) => user != null);
    const filteredMutedCommunities = mutedCommunities.filter(
      (community) => community != null
    );

    const settings = getSafetySettingsFormat(
      filteredBlockedUsers,
      filteredMutedCommunities
    );
    return { success: true, settings };
  } catch (error) {
    return { success: false, error };
  }
}

export async function setSettings(request, flag) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return { success, err, status, user, msg };
  }

  const settings = request.body;
  console.log(settings);
  var updatedUser;
  if (flag == "Account")
    updatedUser = setAccountSettings(user, settings.account_settings);
  else if (flag == "Profile")
    updatedUser = setProfileSettings(user, settings.profile_settings);
  else if (flag == "Feed")
    updatedUser = setFeedSettings(user, settings.feed_settings);
  else if (flag == "Notification")
    updatedUser = setNotificationSettings(
      user,
      settings.notifications_settings
    );
  else if (flag == "Email")
    updatedUser = setEmailSettings(user, settings.email_settings);
  else if (flag == "Chat")
    updatedUser = setChatSettings(user, settings.chat_and_messaging_settings);

  // console.log("HIII", x);
  await updatedUser.save();

  return {
    success: true,
    msg: "Settings set successfully",
  };
}
