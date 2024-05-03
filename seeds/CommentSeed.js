import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Comment } from "../src/db/models/Comment.js";

import {
  getRandomBool,
  getRandomNumber,
  getRandomUserId,
  getRandomElement,
} from "./helpers/seedHelpers.js";

const COMMENTS_COUNT = 20;

async function generateRandomComments(communities, posts, users) {
  const comments = [];

  for (let i = 0; i < COMMENTS_COUNT; i++) {
    const community = getRandomElement(communities);
    const moderator = getRandomElement(community.moderators);
    let randomPost= getRandomElement(posts);
    // do {
    //   randomPost = getRandomElement(posts);
    // } while (randomPost.locked_flag);
    const randomUser = getRandomElement(users);

    const comment_in_community_flag = getRandomBool();
    const approved_flag = faker.datatype.boolean();
    const removed_flag = !approved_flag ? faker.datatype.boolean() : null;
    const spammed_flag = faker.datatype.boolean();
    const reported_flag = faker.datatype.boolean();

    const fakeComment = {
      post_id: randomPost._id,
      post_title: randomPost.title,
      user_id: randomUser._id,
      username: randomUser.username,
      is_reply: false,
      parent_id: null,
      replies_comments_ids: [],
      created_at: faker.date.past(),
      edited_at: null,
      deleted_at: null,
      deleted: false,
      comment_in_community_flag,
      description: faker.lorem.sentences(),
      upvotes_count: getRandomNumber(0, 10),
      downvotes_count: getRandomNumber(0, 10),
      allowreplies_flag: getRandomBool(),
      spoiler_flag: getRandomBool(),
      spam_flag: getRandomBool(),
      locked_flag: getRandomBool(),
      show_comment_flag: true,

      community_id: comment_in_community_flag ? community._id : null,
      community_name: comment_in_community_flag ? community.name : null,

      moderator_details: {
        approved_flag,
        approved_by: approved_flag ? moderator._id : null,
        approved_date: approved_flag ? faker.date.past() : null,

        removed_flag,
        removed_by: removed_flag ? moderator._id : null,
        removed_date: removed_flag ? faker.date.past() : null,
        removed_removal_reason: removed_flag ? faker.lorem.sentence() : null,

        spammed_flag,
        spammed_type: spammed_flag ? faker.lorem.word() : null,
        spammed_date: spammed_flag ? faker.date.past() : null,
        spammed_removal_reason: spammed_flag ? faker.lorem.sentence() : null,
        spammed_by: spammed_flag ? moderator._id : null,

        reported_flag,
        reported_by: reported_flag ? moderator._id : null,
        reported_type: reported_flag ? faker.lorem.word() : null,
        reported_date: reported_flag ? faker.date.past() : null,
      },
      upvote_users: [],
      downvote_users: [],
    };

    comments.push(fakeComment);
  }

  return comments;
}

export async function seedComments(communities, posts, users) {
  await Comment.deleteMany({});
  const comments = await generateRandomComments(communities, posts, users);
  const options = { timeout: 30000 }; // 30 seconds timeout
  for (let i = 0; i < comments.length; i++) {
    let comment = comments[i];
    let upvoteUsers = users.slice(0, 10);
    for (let j = 0; j < comment.upvotes_count; j++) {
      const user = getRandomElement(upvoteUsers);
      comment.upvote_users.push(user._id);
    }
    let downvoteUsers = users.slice(10, 20);
    for (let j = 0; j < comment.downvotes_count; j++) {
      const user = getRandomElement(downvoteUsers);
      comment.downvote_users.push(user._id);
    }
  }
  const commentsInserted = await Comment.insertMany(comments, options);
  return commentsInserted;
}
