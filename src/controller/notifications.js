import { Notification } from "../db/models/Notification.js";
import { User } from "../db/models/User.js";

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
