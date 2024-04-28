import { Notification } from "../db/models/Notification.js";
import { User } from "../db/models/User.js";
import { verifyAuthToken } from "./userAuth.js";
import { generateResponse } from "../utils/generalUtils.js";

export async function pushNotification(
  user,
  sending_user_username,
  post,
  comment,
  notifType
) {
  //if the user wants to recieve notifs of this type
  try {
    const community_name = post ? post.community_name : comment?.community_name;
    console.log("hi", user, notifType);
    console.log(user.username, sending_user_username);
    if (user.username != sending_user_username) {
      if (user.notifications_settings[notifType]) {
        const notification = new Notification({
          created_at: Date.now(),
          community_name,
          post_id: post?._id,
          comment_id: comment?._id,
          user_id: user._id,
          sending_user_username,
          type: notifType,
        });
        await notification.save();
        // console.log(notification);
        return { success: true, notification };
      } else return { success: false, error: "User has this option sent off" };
    } else return { success: false, error: "Can't push notif to same user" };
  } catch (e) {
    return { success: false, error: e };
  }
}

export async function getNotifications(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }

    const notifications = await Notification.find({ user_id: user._id }).exec();

    const communityNames = new Set();
    const sendingUserUsernames = new Set();

    for (const notification of notifications) {
      if (notification.community_name) {
        communityNames.add(notification.community_name);
      } else {
        sendingUserUsernames.add(notification.sending_user_username);
      }
    }

    // Retrieve profile pictures for communities
    const communityProfiles = await Community.find({
      name: { $in: Array.from(communityNames) },
    }).exec();
    const communityProfilesMap = new Map(
      communityProfiles.map((community) => [
        community.name,
        community.profile_picture,
      ])
    );

    // Retrieve profile pictures for sending users
    const sendingUserProfiles = await User.find({
      username: { $in: Array.from(sendingUserUsernames) },
    }).exec();
    const sendingUserProfilesMap = new Map(
      sendingUserProfiles.map((user) => [user.username, user.profile_picture])
    );

    return {
      success: true,
      message: "Notifications retrieved successfully",
      notifications: notifications.map((notification) => ({
        id: notification._id,
        created_at: notification.created_at,
        post_id: notification.post_id,
        comment_id: notification.comment_id,
        sending_user_username: notification.sending_user_username,
        community_name: notification.community_name,
        unread_flag: notification.unread_flag,
        hidden_flag: notification.hidden_flag,
        type: notification.type,
        profile_picture: notification.community_name
          ? communityProfilesMap.get(notification.community_name)
          : sendingUserProfilesMap.get(notification.sending_user_username),
        is_in_community: !!notification.community_name,
      })),
    };
  } catch (e) {
    generateResponse(false, 500, "Internal Server error");
  }
}
