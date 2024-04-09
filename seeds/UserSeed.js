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
} from "./seedHelpers.js";

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
      token: "",
      password: faker.internet.password(8),
      is_password_set_flag: false,
      connected_google: false,
      email: faker.internet.email(),
      verified_email_flag: false,
      gmail: faker.internet.email(),
      facebook_email: faker.internet.email(),
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
        nsfw_flag: false,
        allow_followers: true,
        content_visibility: true,
        active_communities_visibility: true,
      },
      safety_and_privacy_settings: {
        blocked_users: [],
        muted_communities: [],
      },
      feed_settings: {
        Adult_content_flag: false,
        autoplay_media: true,
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
        Open_posts_in_new_tab: false,
        community_themes: true,
      },
      notifications_settings: {
        mentions: true,
        comments: true,
        upvotes_posts: true,
        upvotes_comments: true,
        replies: true,
        new_followers: true,
        invitations: true,
        posts: true,
        private_messages: true,
        chat_messages: true,
        chat_requests: true,
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
        new_follower_email: true,
        chat_request_email: true,
        unsubscribe_from_all_emails: false,
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
      notifications_ids: [],
      unread_notifications_count: 0,
      communities: [],
      moderated_communities: [],
      reported_users: [],
      user_mentions: [],
      tickets_ids: [],
    };

    const salt = await bcrypt.genSalt(10);
    fakeUser.password = await bcrypt.hash(fakeUser.password, salt);

    users.push(fakeUser);
  }

  return users;
}

export async function seedUsers() {
  const users = await generateRandomUsers();
  const options = { timeout: 30000 };
  const usersInserted = await User.insertMany(users, options);
  return usersInserted;
}
