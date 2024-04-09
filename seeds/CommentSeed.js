import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Comment } from "../src/db/models/Comment.js";
import {
  getRandomBool,
  getRandomNumber,
  getRandomUserId,
  getRandomElement,
} from "./seedHelpers.js";

const COMMENTS_COUNT = 20;

async function generateRandomComments(posts, users) {
  const comments = [];
  for (let i = 0; i < COMMENTS_COUNT; i++) {
    const randomPost = getRandomElement(posts);
    const randomUser = getRandomElement(users);

    const fakeComment = {
      post_id: randomPost._id,
      user_id: randomUser._id,
      username: randomUser.username,
      parent_id: null,
      replies_comments_ids: [],
      created_at: faker.date.past(),
      edited_at: null,
      deleted_at: null,
      approved: getRandomBool(),
      deleted: false,
      description: faker.lorem.sentences(),
      upvotes_count: getRandomNumber(0, 10),
      downvotes_count: getRandomNumber(0, 10),
      allowreplies_flag: getRandomBool(),
      spam_flag: getRandomBool(),
      locked_flag: getRandomBool(),
      show_comment_flag: true,
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
    };

    comments.push(fakeComment);
  }

  return comments;
}

export async function seedComments(posts, users) {
  await Comment.deleteMany({});
  const comments = await generateRandomComments(posts, users);
  const options = { timeout: 30000 }; // 30 seconds timeout
  const commentsInserted = await Comment.insertMany(comments, options);
  return commentsInserted;
}
