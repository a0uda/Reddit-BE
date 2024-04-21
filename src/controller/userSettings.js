import {
  getBlockedUserHelper,
  getMutedCommunitiesHelper,
} from "../services/users.js";
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
import { generateResponse } from "../utils/generalUtils.js";

export async function getSettings(request, flag) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
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
      message: "Settings retrieved successfully",
      settings: settings,
    };
  } catch (error) {
    return generateResponse(false, 400, error.message);
  }
}

export async function getSafetySettings(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }

    const blockedUsers = await getBlockedUserHelper(user);
    const mutedCommunities = await getMutedCommunitiesHelper(user);

    const settings = getSafetySettingsFormat(blockedUsers, mutedCommunities);
    return { success: true, settings };
  } catch (error) {
    return generateResponse(false, 400, error.message);
  }
}

export async function setSettings(request, flag) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return generateResponse(success, status, err);
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
    message: "Settings set successfully",
  };
}

export async function addSocialLink(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }
    const { username, display_text, type, custom_url } = request.body;
    if (!username || !type || !custom_url) {
      return generateResponse(false, 400, "Missing required field");
    }

    const validOptions = [
      "instagram",
      "facebook",
      "custom_url",
      "reddit",
      "twitter",
      "tiktok",
      "twitch",
      "youtube",
      "spotify",
      "soundcloud",
      "discord",
      "paypal",
    ];

    // Check if type is in enum
    if (!validOptions.includes(type)) {
      return generateResponse(
        false,
        400,
        "Type must be in " + validOptions.join(", ")
      );
    }
    console.log(username, display_text, custom_url, type);
    user.social_links.push({
      username: user.username,
      display_text: display_text ? display_text : null,
      custom_url,
      type,
    });

    await user.save();
    return generateResponse(true, null, "Added social link successfully");
  } catch (error) {
    return generateResponse(false, 400, error.message);
  }
}

export async function deleteSocialLink(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }
    const { id } = request.body;
    if (!id) {
      return generateResponse(
        false,
        400,
        "Missing social link id required field"
      );
    }
    const index = user.social_links.findIndex(
      (sociallink) => sociallink._id.toString() == id.toString()
    );
    console.log(user.social_links, id, index);
    if (index !== -1) {
      user.social_links.splice(index, 1)[0];
      await user.save();
      return generateResponse(true, null, "Deleted social link successfully");
    } else {
      return generateResponse(false, 400, "Social link id not found");
    }

    return { success: true, settings };
  } catch (error) {
    return generateResponse(false, 400, error.message);
  }
}
