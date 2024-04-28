import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Comment } from "../src/db/models/Comment.js";
import { Community } from "../src/db/models/Community.js";
import { User } from "../src/db/models/User.js";
import {
  getRandomBool,
  getRandomNumber,
  getRandomUserId,
  getRandomElement,
} from "./seedHelpers.js";

const COMMENTS_COUNT = 20;

async function generateRandomComments(posts, users) {
  const comments = [];
  const community = await Community.findOne();
  const moderator = await User.findOne();

  for (let i = 0; i < COMMENTS_COUNT; i++) {
    const randomPost = getRandomElement(posts);
    const randomUser = getRandomElement(users);

    const fakeComment = {
      post_id: randomPost._id,
      post_title: randomPost.title,
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

      // TODO:Comment from community & moderation: we interact with posts using community_name, so If you don't use the community_id you can delete it. I will populate the community_name.
      community_id: null,
      community_name: community.name,

      moderator_details: {
        approved_flag: faker.datatype.boolean(),
        approved_by: moderator._id,
        approved_date: faker.date.past(),
        approved_count: 0,
       
        removed_flag: faker.datatype.boolean(),
        removed_by: moderator._id,
        removed_date: faker.date.past(),
        removed_removal_reason: faker.lorem.sentence(),
        removed_count: 0,
       
        spammed_flag: faker.datatype.boolean(),
        spammed_by: moderator._id,
        spammed_type: faker.lorem.word(),
        spammed_date: faker.date.past(),
        spammed_removal_reason: faker.lorem.sentence(),
       
        reported_flag: faker.datatype.boolean(),
        reported_by: moderator._id,
        reported_type: faker.lorem.word(),
        reported_date: faker.date.past(),
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
