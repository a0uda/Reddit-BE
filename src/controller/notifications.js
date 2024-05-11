/**
 * @module notifications/controller
 */
import { Notification } from "../db/models/Notification.js";
import { User } from "../db/models/User.js";
import { verifyAuthToken } from "./userAuth.js";
import { generateResponse } from "../utils/generalUtils.js";
import { Community } from "../db/models/Community.js";

/**
 * Send a notification to a user based on specified parameters and settings.
 *
 * @param {Object} user - The user object to receive the notification.
 * @param {string} sending_user_username - The username of the user sending the notification.
 * @param {Object} [post] - The post object associated with the notification (optional).
 * @param {Object} [comment] - The comment object associated with the notification (optional).
 * @param {string} notifType - The type of notification being sent (e.g., 'comments', 'replies').
 * @returns {Object} An object indicating the success status and details of the sent notification.
 */
export async function pushNotification(
  user,
  sending_user_username,
  post,
  comment,
  notifType
) {
  //if the user wants to recieve notifs of this type
  try {
    let community_name = "";
    let mutedCommunities =
      user.safety_and_privacy_settings.muted_communities.map(
        (community) => community.id
      );

    // console.log(post.community_id.toString());
    if (post) {
      if (post.post_in_community_flag) {
        community_name = post.community_name;
        const index = mutedCommunities.findIndex(
          (id) => id.toString() == post.community_id.toString()
        );
        if (index != -1)
          return { success: false, error: "User has this community muted" };
      }
    }

    if (comment) {
      if (comment.comment_in_community_flag) {
        community_name = comment.community_name;
        const index = mutedCommunities.findIndex(
          (id) => id.toString() == comment.community_id.toString()
        );
        if (index != -1)
          return { success: false, error: "User has this community muted" };
      }
    }

    //check if blocked sending user
    const sendingUser = await User.findOne({ username: sending_user_username });
    const index = user.safety_and_privacy_settings.blocked_users.findIndex(
      (blockedUser) => blockedUser.id.toString() == sendingUser._id.toString()
    );
    if (index != -1) return { success: false, error: "User blocked" };
    // console.log("hi", user, notifType);
    // console.log(user.username, sending_user_username);
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
    return { success: false, error: "Internal server error" };
  }
}
/**
 * Retrieve notifications for the authenticated user.
 *
 * @param {Object} request - The HTTP request object containing user authentication details.
 * @returns {Object} An object containing the retrieved notifications for the user.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - message {string} - A message indicating the outcome of the operation.
 *   - notifications {Array} - An array of notification objects.
 *     Each notification object has the following properties:
 *     - id {string} - The unique identifier of the notification.
 *     - created_at {Date} - The date and time when the notification was created.
 *     - post_id {string} - The identifier of the associated post (if applicable).
 *     - comment_id {string} - The identifier of the associated comment (if applicable).
 *     - sending_user_username {string} - The username of the user who sent the notification.
 *     - community_name {string} - The name of the community associated with the notification (if applicable).
 *     - unread_flag {boolean} - Indicates whether the notification has been read.
 *     - hidden_flag {boolean} - Indicates whether the notification is hidden.
 *     - type {string} - The type of notification ('comments', 'replies', etc.).
 *     - profile_picture {string|null} - The profile picture URL of the associated community or user.
 *     - is_in_community {boolean} - Indicates whether the notification is related to a community.
 */
export async function getNotifications(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }

    const notifications = await Notification.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .exec();
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

    // console.log(sendingUserUsernames);
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

    console.log("HI", communityNames);
    console.log("HI", communityProfilesMap);
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
        profile_picture: !!notification.community_name
          ? communityProfilesMap.get(notification.community_name)
          : sendingUserProfilesMap.get(notification.sending_user_username),
        is_in_community: !!notification.community_name,
      })),
    };
  } catch (e) {
    generateResponse(false, 500, "Internal Server error");
  }
}

/**
 * Marks notifications as read based on the specified criteria.
 *
 * @param {Object} request - The HTTP request object containing user authentication details and notification ID (if applicable).
 * @param {boolean} markAllFlag - A flag indicating whether to mark all notifications as read.
 * @returns {Object} An object indicating the outcome of the operation.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code indicating the result of the operation.
 *   - message {string} - A message describing the outcome of the operation.
 */
export async function markAsRead(request, markAllFlag) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }
    if (markAllFlag) {
      const notifications = await Notification.find({
        user_id: user._id,
      }).exec();

      await Promise.all(
        notifications.map(async (notification) => {
          notification.unread_flag = false;
          await notification.save();
        })
      );

      return generateResponse(
        true,
        200,
        "All Notifications are read successfully"
      );
    } else {
      const _id = request.body.id;
      if (!_id) {
        return generateResponse(false, 400, "Notification id is required");
      }
      const notification = await Notification.findById({ _id });
      if (!notification) {
        return generateResponse(false, 400, "Notification is not found");
      }
      notification.unread_flag = false;
      await notification.save();
      return generateResponse(true, 200, "Notification read successfully");
    }
  } catch (e) {
    return generateResponse(false, 500, "Internal Server error");
  }
}

/**
 * Hides a specific notification for the authenticated user.
 *
 * @param {Object} request - The HTTP request object containing user authentication details and the ID of the notification to hide.
 * @returns {Object} An object indicating the outcome of hiding the notification.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code indicating the result of the operation.
 *   - message {string} - A message describing the outcome of the operation.
 */
export async function hideNotification(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) return generateResponse(success, status, err);

    const _id = request.body.id;
    if (!_id) {
      return generateResponse(false, 400, "Notification id is required");
    }
    const notification = await Notification.findById({ _id });
    if (!notification) {
      return generateResponse(false, 400, "Notification is not found");
    }
    notification.hidden_flag = true;
    await notification.save();
    return generateResponse(true, 200, "Notification hidden successfully");
  } catch (e) {
    return generateResponse(false, 500, "Internal Server error");
  }
}

/**
 * Retrieves the count of unread notifications for the authenticated user.
 *
 * @param {Object} request - The HTTP request object containing user authentication details.
 * @returns {Object} An object indicating the outcome of retrieving the count of unread notifications.
 *   - success {boolean} - Indicates whether the operation was successful.
 *   - status {number} - The HTTP status code indicating the result of the operation.
 *   - message {string} - A message describing the outcome of the operation.
 *   - count {number} - The count of unread notifications for the user.
 */
export async function getUnreadNotificationsCount(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }
    const notifications = await Notification.find({
      user_id: user._id,
      unread_flag: true,
    }).exec();
    return {
      success: true,
      message: "Notifications retrieved successfully",
      count: notifications.length,
    };
  } catch (e) {
    return generateResponse(false, 500, "Internal Server error");
  }
}
