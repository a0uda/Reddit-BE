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
/**
 * Retrieves user settings based on the specified flag value.
 * @param {Object} request The incoming request object.
 * @param {string} flag Specifies the type of settings to retrieve (e.g., "Account", "Profile", "Feed", etc.).
 * @returns {Promise<Object>} An object containing the success status, message, and settings data.
 */
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
    return generateResponse(false, 500, "Internal server error");
  }
}
/**
 * Retrieves safety settings for a user based on their authentication token.
 * @param {Object} request The incoming request object containing authentication data.
 * @returns {Promise<Object>} An object containing the success status and safety settings data.
 */
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
    return generateResponse(false, 500, "Internal server error");
  }
}
/**
 * Updates user settings based on the specified flag value.
 * @param {Object} request The incoming request object containing authentication data and settings.
 * @param {string} flag Specifies the type of settings to update (e.g., "Account", "Profile", "Feed", etc.).
 * @returns {Promise<Object>} An object containing the success status and a message indicating the settings were updated successfully.
 */
export async function setSettings(request, flag) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }

    const settings = request.body;
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
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}
/**
 * Adds a social link to the user's profile based on the provided request data.
 * @param {Object} request The incoming request object containing authentication data and social link details.
 * @returns {Promise<Object>} An object containing the success status and a message indicating the social link was added successfully.
 */
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
    user.social_links.push({
      username: user.username,
      display_text: display_text ? display_text : null,
      custom_url,
      type,
    });

    await user.save();
    return generateResponse(true, null, "Added social link successfully");
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}
/**
 * Edits an existing social link in the user's profile based on the provided request data.
 * @param {Object} request The incoming request object containing authentication data and social link details.
 * @returns {Promise<Object>} An object containing the success status and a message indicating the social link was edited successfully.
 */
export async function editSocialLink(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }
    const { id, username, display_text, custom_url } = request.body;
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
    const socialLink = user.social_links.find(
      (sociallink) => sociallink._id.toString() == id.toString()
    );
    if (index !== -1) {
      socialLink.username = username ? username : socialLink.username;
      socialLink.custom_url = custom_url ? custom_url : socialLink.custom_url;
      socialLink.display_text = display_text
        ? display_text
        : socialLink.display_text;

      await user.save();
      return generateResponse(true, null, "Edited social link successfully");
    } else {
      return generateResponse(false, 400, "Social link id not found");
    }
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}
/**
 * Deletes an existing social link from the user's profile based on the provided request data.
 * @param {Object} request The incoming request object containing authentication data and social link ID.
 * @returns {Promise<Object>} An object containing the success status and a message indicating the social link was deleted successfully.
 */
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
    if (index !== -1) {
      user.social_links.splice(index, 1)[0];
      await user.save();
      return generateResponse(true, null, "Deleted social link successfully");
    } else {
      return generateResponse(false, 400, "Social link id not found");
    }
  } catch (error) {
    return generateResponse(false, 500, "Internal server error");
  }
}
