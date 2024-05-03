import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { User } from "../src/db/models/User.js";
import {
  getRandomBool,
  getRandomElement,
  getRandomNumber,
} from "./helpers/seedHelpers.js";

const JWT_SECRET = process.env.JWT_SECRET;
const USERS_COUNT = 20;

async function generateRandomUsers() {
  const users = [];
  for (let i = 0; i < USERS_COUNT; i++) {
    const fakeUser = {
      created_at: faker.date.past(),
      deleted_at: null,
      deleted: false,
      username: faker.internet.userName(),
      token: [],
      //password: faker.internet.password(8),
      password: "hamada123",
      is_password_set_flag: true,
      connected_google: false,
      email: faker.internet.email(),
      verified_email_flag: faker.datatype.boolean(),
      gmail: faker.internet.email(),
      display_name: faker.person.fullName(),
      about: faker.lorem.sentences(),
      social_links: [
        {
          _id: new mongoose.Types.ObjectId(),
          username: faker.internet.userName(),
          display_text: faker.lorem.words(),
          type: getRandomElement([
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
          ]),
          custom_url: faker.internet.url(),
        },
      ],
      profile_picture: faker.image.avatar(),
      banner_picture: faker.image.url(),
      profile_settings: {
        nsfw_flag: faker.datatype.boolean(),
        allow_followers: faker.datatype.boolean(),
        content_visibility: faker.datatype.boolean(),
        active_communities_visibility: faker.datatype.boolean(),
      },
      safety_and_privacy_settings: {
        blocked_users: [],
        muted_communities: [],
      },
      feed_settings: {
        Adult_content_flag: faker.datatype.boolean(),
        autoplay_media: faker.datatype.boolean(),
        communitiy_content_sort: {
          type: getRandomElement(["top", "hot", "new", "rising"]),
          duration: getRandomElement([
            "now",
            "today",
            "this_week",
            "this_month",
            "this_year",
            "all_time",
          ]),
          sort_remember_per_community: false,
        },
        global_content: {
          global_content_view: getRandomElement([
            "card",
            "classical",
            "compact",
          ]),
          global_remember_per_community: false,
        },
        Open_posts_in_new_tab: faker.datatype.boolean(),
        community_themes: faker.datatype.boolean(),
      },
      notifications_settings: {
        mentions: faker.datatype.boolean(),
        comments: faker.datatype.boolean(),
        upvotes_posts: faker.datatype.boolean(),
        upvotes_comments: faker.datatype.boolean(),
        replies: faker.datatype.boolean(),
        new_followers: faker.datatype.boolean(),
        invitations: faker.datatype.boolean(),
        posts: faker.datatype.boolean(),
        private_messages: faker.datatype.boolean(),
        chat_messages: faker.datatype.boolean(),
        chat_requests: faker.datatype.boolean(),
      },
      chat_and_messaging_settings: {
        who_send_chat_requests_flag: getRandomElement([
          "Everyone",
          "Accounts Older than 30 days",
          "Nobody",
        ]),
        who_send_private_messages_flag: getRandomElement([
          "Everyone",
          "Accounts Older than 30 days",
          "Nobody",
        ]),
      },
      email_settings: {
        new_follower_email: faker.datatype.boolean(),
        chat_request_email: faker.datatype.boolean(),
        unsubscribe_from_all_emails: faker.datatype.boolean(),
      },

      followed_posts_ids: [],
      saved_posts_ids: [],
      hidden_and_reported_posts_ids: [],
      history_posts_ids: [],
      upvotes_posts_ids: [],
      downvotes_posts_ids: [],
      reported_comments_ids: [],
      saved_comments_ids: [],
      saved_categories_ids: [],
      country: faker.location.country(),
      gender: getRandomElement(["Male", "Female"]),
      followers_ids: [],
      following_ids: [],
      communities: [],
      moderated_communities: [],
      reported_users: [],
      user_mentions: [], //TODO: This should be seeded with real users because its referenced in messages , I need an extra attribute: unread
    };

    const salt = await bcrypt.genSalt(10);
    fakeUser.password = await bcrypt.hash(fakeUser.password, salt);

    users.push(fakeUser);
  }

  return users;
}

// export async function completeUserSeed(users) {
//   const blocked_users = users.slice(0, 10);
//   for (let i = 0; i < users.length; i++) {
//     const user = users[i];
//     for (let j = 0; j < blocked_users.length; j++) {
//       if (i == j) continue;
//       user.safety_and_privacy_settings,
//         blocked_users.push({
//           id: user[j]._id,
//           blocked_date: faker.date.past(),
//         });
//       break;
//     }

//     const blockedUserIds = user.safety_and_privacy_settings.blocked_users.map(
//       (user) => user.id
//     );

//     for (let j = 0; j < 5; j++) {
//       let randomIndex;
//       do {
//         randomIndex = Math.floor(Math.random() * users.length);
//       } while (
//         randomIndex == i ||
//         blockedUserIds.includes(users[randomIndex].id)
//       );

//       const randomUser = users[randomIndex];
//       user.following_ids.push(randomUser._id);
//       const blockedUsersFollower =
//         randomUser.safety_and_privacy_settings.blocked_users.map(
//           (user) => user.id
//         );
//       if (!blockedUsersFollower.includes(user._id))
//         user.followers_ids.push(randomUser._id);
//     }
//   }
//   return users;
// }

export async function seedUsers() {
  // await User.deleteMany({});
  const users = await generateRandomUsers();
  const options = { timeout: 30000 };
  const usersInserted = await User.insertMany(users, options);
  // const editedUsers = await completeUserSeed(usersInserted);
  // const finalUsers = await User.updateMany(editedUsers, options);
  return usersInserted;
}
