import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Post } from "../src/db/models/Post.js";

import {
  getRandomBool,
  getRandomElement,
  getRandomNumber,
  getRandomUserId,
} from "./helpers/seedHelpers.js";

const POSTS_COUNT = 20;

async function generateRandomPosts(communities, users) {
  const posts = [];
  const randomUser = getRandomElement(users);
  // const community = await Community.findOne();
  // const moderator = await User.findOne();

  for (let i = 0; i < POSTS_COUNT; i++) {
    const randomUserId = getRandomUserId(users);
    const community = getRandomElement(communities);
    const moderator = getRandomElement(community.moderators);
    const fakePost = {
      user_id: randomUserId._id,
      username: randomUserId.username,
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
        "reposted",
      ]),
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
      post_in_community_flag: getRandomBool(),
      community_id: post_in_community_flag ? community._id : null,
      community_name: post_in_community_flag ? community.name : null,

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

      scheduled_flag: false,

      moderator_details: {
        approved_flag: faker.datatype.boolean(),
        approved_by: approved_flag ? moderator._id : null,
        approved_date: approved_flag ? faker.date.past() : null,

        removed_flag: !approved_flag ? faker.datatype.boolean() : null,
        removed_by: removed_flag ? moderator._id : null,
        removed_date: removed_flag ? faker.date.past() : null,
        removed_removal_reason: removed_flag ? faker.lorem.sentence() : null,

        spammed_flag: faker.datatype.boolean(),
        spammed_type: spammed_flag ? faker.lorem.word() : null,
        spammed_date: spammed_flag ? faker.date.past() : null,
        spammed_removal_reason: spammed_flag ? faker.lorem.sentence() : null,
        spammed_by: spammed_flag ? moderator._id : null,

        reported_flag: faker.datatype.boolean(),
        reported_by: reported_flag ? moderator._id : null,
        reported_type: reported_flag ? faker.lorem.word() : null,
        reported_date: reported_flag ? faker.date.past() : null,
      },
      is_reposted_flag: false,
      user_details: {
        total_views: views_count,
        upvote_rate: upvotes_count / (upvotes_count + downvotes_count),
        total_shares: shares_count,
      },
    };

    posts.push(fakePost);
  }

  return posts;
}

export async function seedPosts(communities, users) {
  // await Post.deleteMany({});
  const posts = await generateRandomPosts(communities, users);
  const options = { timeout: 30000 }; // 30 seconds timeout
  for (let i = 0; i < posts.length; i++) {
    let post = posts[i];
    for (let j = 0; j < post.upvotes_count; j++) {
      const user = users.getRandomElement(users);
      user.upvotes_posts_ids.push(post._id);
    }
    for (let j = 0; j < post.downvotes_count; j++) {
      let user;
      do {
        user = users.getRandomElement(users);
      } while (user.upvotes_posts_ids.includes(post._id));
      user.downvotes_posts_ids.push(post._id);
    }
  }
  const postsInserted = await Post.insertMany(posts, options);
  return postsInserted;
}
