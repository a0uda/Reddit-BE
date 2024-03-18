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
import { getBlockedUser, getMutedCommunities } from "../utils/userInfo.js";

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

    const blockedUsers = await getBlockedUser(user);
    const mutedCommunities = await getMutedCommunities(user);

    const settings = getSafetySettingsFormat(blockedUsers, mutedCommunities);
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
