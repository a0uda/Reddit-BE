import {
  getProfileSettingsFormat,
  getSafetySettingsFormat,
  getFeedSettingsFormat,
  getNotificationsSettingsFormat,
  getEmailSettingsFormat,
  getChatAndMsgsSettingsFormat,
} from "../utils/userSettings.js";
import { verifyAuthToken } from "./userAuth.js";

export async function getSettings(request, flag) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return { success, err, status, user, msg };
  }
  console.log(user.notifications_settings.mentions);
  var settings;
  if (flag == "Profile") settings = getProfileSettingsFormat(user);
  else if (flag == "Feed") settings = getFeedSettingsFormat(user);
  else if (flag == "Safety") settings = getSafetySettingsFormat(user);
  else if (flag == "Notification")
    settings = getNotificationsSettingsFormat(user);
  else if (flag == "Chat") settings = getChatAndMsgsSettingsFormat(user);
  else if (flag == "Email") settings = getEmailSettingsFormat(user);
  return {
    success: true,
    settings: settings,
  };
}
