import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Comment } from "../src/db/models/Comment.js";
import { Community } from "../src/db/models/Community.js";
import { Notification } from "../src/db/models/Notification.js";
import { User } from "../src/db/models/User.js";
import {
  getRandomBool,
  getRandomNumber,
  getRandomUserId,
  getRandomElement,
} from "./helpers/seedHelpers.js";

const NOTIFICATIONS_COUNT = 20;

async function generateRandomNotifications(posts, comments, users) {
  const notifications = [];

  for (let i = 0; i < NOTIFICATIONS_COUNT; i++) {
    // const community = await Community.findOne();
    // const moderator = getRandomElement(community.moderators);
    const randomPost = getRandomElement(posts);
    const randomComment = getRandomElement(comments);
    const type = getRandomElement([
      "upvotes_posts",
      "upvotes_comments",
      "comments",
      "replies",
      "new_followers",
      "invitations",
      "private_messages",
      "mentions",
      "chat_messages",
      "chat_requests",
    ]);

    let randomUser;
    do {
      randomUser = getRandomElement(users);
    } while (!randomUser.notifications_settings[type]);

    let randomUser2;
    do {
      randomUser2 = getRandomElement(users);
    } while (randomUser == randomUser2);

    let community_name;
    if (type == "upvotes_posts") {
      if (randomPost.post_in_community_flag) {
        community_name = randomPost.community_name;
      }
    }
    if (type == "upvotes_comments" || type == "comments" || type == "replies") {
      if (randomComment.comment_in_community_flag) {
        community_name = randomComment.community_name;
      }
    }
    const fakeNotification = {
      user_id: randomUser._id,
      created_at: faker.date.past(),

      post_id: type == "upvotes_posts" ? randomPost._id : null,
      comment_id:
        type == "upvotes_comments" || type == "comments" || type == "replies"
          ? randomComment._id
          : null,

      sending_user_username: randomUser2.username,
      community_name,
      unread_flag: getRandomBool(),
      hidden_flag: getRandomBool(),
      type,
    };

    notifications.push(fakeNotification);
  }

  return notifications;
}

export async function seedNotifications(posts,comments, users) {
  await Notification.deleteMany({});
  const notifications = await generateRandomNotifications(posts,comments, users);
  const options = { timeout: 30000 }; // 30 seconds timeout
  const notificationsInserted = await Notification.insertMany(
    notifications,
    options
  );
  return notificationsInserted;
}
