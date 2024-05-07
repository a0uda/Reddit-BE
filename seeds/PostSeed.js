import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Post } from "../src/db/models/Post.js";

import {
  getRandomBool,
  getRandomElement,
  getRandomNumber,
} from "./helpers/seedHelpers.js";

const POSTS_COUNT = 20;

async function generateRandomPosts(communities, users) {
  const posts = [];
  const randomUser = getRandomElement(users);
  // const community = await Community.findOne();
  // const moderator = await User.findOne();

  for (let i = 0; i < POSTS_COUNT; i++) {
    const randomUser = getRandomElement(users);
    const community = getRandomElement(communities);
    const moderator = getRandomElement(community.moderators);

    const type = getRandomElement([
      "image_and_videos",
      "polls",
      "url",
      "text",
      "hybrid",
      "reposted",
    ]);
    const post_in_community_flag = getRandomBool();
    const approved_flag = faker.datatype.boolean();
    const removed_flag = !approved_flag ? faker.datatype.boolean() : null;
    const spammed_flag = faker.datatype.boolean();
    const reported_flag = faker.datatype.boolean();
    const upvotes_count = getRandomNumber(1, 10);
    const downvotes_count = getRandomNumber(1, 10);

    const views_count = getRandomNumber(0, 100);
    const shares_count = getRandomNumber(0, 100);

    const fakePost = {
      user_id: randomUser._id,
      username: randomUser.username,
      title: faker.lorem.words(),
      description: faker.lorem.sentences(),
      created_at: faker.date.past(),
      edited_at: null,
      deleted_at: null,
      deleted: false,
      approved: getRandomBool(),
      type,
      link_url: type == "url" || type == "hybrid" ? faker.internet.url() : "",
      images:
        type == "image_and_videos" || type == "hybrid"
          ? [
            {
              path: faker.image.url(),
              caption: faker.lorem.words(),
              link: faker.internet.url(),
            },
          ]
          : [],
      videos:
        type == "image_and_videos" || type == "hybrid"
          ? [
            {
              path: faker.internet.url(),
              caption: faker.lorem.words(),
              link: faker.internet.url(),
            },
          ]
          : [],
      polls:
        type == "polls"
          ? [
            {
              options: faker.lorem.words(),
              votes: 7,
              users_ids: [randomUser],
            },
          ]
          : [],
      polls_voting_length: type == "polls" ? getRandomNumber(3, 10) : 3,
      polls_voting_is_expired_flag: type == "polls" ? getRandomBool() : false,

      // TODO:Comment from community & moderation: we interact with posts using
      // community_name, so If you don't use the community_id you can delete it.
      //I will populate the community_name.
      post_in_community_flag,
      community_id: post_in_community_flag ? community._id : null,
      community_name: post_in_community_flag ? community.name : null,

      followers_ids: [],
      comments_count: 0,
      views_count,
      shares_count,
      upvotes_count,
      downvotes_count,
      oc_flag: getRandomBool(),
      spoiler_flag: getRandomBool(),
      nsfw_flag: getRandomBool(),
      locked_flag: false,
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

      scheduled_flag: false,

      moderator_details: {
        approved_flag: false,
        approved_by: null,
        approved_date: null,

        removed_flag: false,
        removed_by: null,
        removed_date: null,
        removed_removal_reason: null,

        spammed_flag: false,
        spammed_by: null,
        spammed_type: null,
        spammed_date: null,
        spammed_removal_reason: null,

        reported_flag: false,
        reported_by: null,
        reported_type: null,
        reported_date: null,
        reported_removal_reason: null,

        edited_at: null,
      },

      community_moderator_details: {
        unmoderated: {
          approved: {
            flag: false,
            by: null,
            date: null,
          },

          any_action_taken: false,
        },

        reported: {
          flag: false,
          by: null,
          date: null,
          type: null,

          confirmed: false,
        },

        spammed: {
          flag: false,
          by: null,
          date: null,
          type: null,

          confirmed: false,
        },

        removed: {
          flag: false,
          by: null,
          date: null,
          type: null,

          confirmed: false,
        },

        edit_history: [
          {
            edited_at: null,
            approved_edit_flag: false,
            removed_edit_flag: false,
          },
        ],
      },
    };

    posts.push(fakePost);
  }

  return posts;
}

export async function seedPosts(communities, users) {
  await Post.deleteMany({});
  const posts = await generateRandomPosts(communities, users);
  const options = { timeout: 30000 }; // 30 seconds timeout
  const postsInserted = await Post.insertMany(posts, options);

  for (let i = 0; i < postsInserted.length; i++) {
    let post = postsInserted[i];
    let upvotePosts = postsInserted.slice(0, 10);
    for (let j = 0; j < post.upvotes_count; j++) {
      const user = getRandomElement(users);
      user.upvotes_posts_ids.push(upvotePosts[j]._id);
      await user.save();
    }
    let downvotePosts = postsInserted.slice(10, 20);
    for (let j = 0; j < post.downvotes_count; j++) {
      let user = getRandomElement(users);
      user.downvotes_posts_ids.push(downvotePosts[j]._id);
      await user.save();
    }
  }

  return postsInserted;
}
