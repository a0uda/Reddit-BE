import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Post } from "../src/db/models/Post.js";
import {
  getRandomBool,
  getRandomElement,
  getRandomNumber,
  getRandomUserId,
} from "./seedHelpers.js";

const POSTS_COUNT = 20;

async function generateRandomPosts(users) {
  const posts = [];
  for (let i = 0; i < POSTS_COUNT; i++) {
    const randomUserId = getRandomUserId(users);

    const fakePost = {
      user_id: randomUserId,
      title: faker.lorem.words(),
      description: faker.lorem.sentences(),
      created_at: faker.date.past(),
      edited_at: null,
      deleted_at: null,
      deleted: false,
      approved: getRandomBool(),
      type: getRandomElement([
        "image_and_videos",
        "polls",
        "url",
        "text",
        "hybrid",
      ]),
      link_url: faker.internet.url(),
      images: [{ path: faker.image.url(), caption: "", link: "" }],
      videos: [{ path: faker.internet.url(), caption: "", link: "" }],
      poll: [{ options: faker.lorem.words(), votes: 7 }],
      community_id: null,
      followers_ids: [],
      comments_count: 0,
      views_count: getRandomNumber(0, 10),
      shares_count: getRandomNumber(0, 10),
      upvotes_count: getRandomNumber(0, 10),
      downvotes_count: getRandomNumber(0, 10),
      oc_flag: getRandomBool(),
      spoiler_flag: getRandomBool(),
      nsfw_flag: getRandomBool(),
      locked_flag: getRandomBool(),
      allowreplies_flag: getRandomBool(),
      set_suggested_sort: getRandomElement([
        "None (Recommended)",
        "Best",
        "Old",
        "Top",
        "Q&A",
        "Live (Beta)",
        "Controversial",
        "New",
      ]),
      scheduled_flag: getRandomBool(),
      moderator_details: {
        approved_by: null,
        approved_date: null,
        removed_by: null,
        removed_date: null,
        spammed_by: null,
        spammed_type: null,
        removed_flag: false,
        spammed_flag: false,
      },
      user_details: {
        total_views: getRandomNumber(0, 10),
        upvote_rate: getRandomNumber(0, 10),
        total_shares: getRandomNumber(0, 10),
      },
      reposted: [],
    };

    posts.push(fakePost);
  }

  return posts;
}

export async function seedPosts(users) {
  await Post.deleteMany({});
  const posts = await generateRandomPosts(users);
  const options = { timeout: 30000 }; // 30 seconds timeout
  const postsInserted = await Post.insertMany(posts, options);
  return postsInserted;
}
