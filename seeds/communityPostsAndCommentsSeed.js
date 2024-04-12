import { faker } from "@faker-js/faker";
import { CommunityPostsAndComments } from "../src/db/models/communityPostsAndComments.js";
import { getRandomElement } from "./seedHelpers.js";

const POSTS_AND_COMMENTS_COUNT = 20;

async function generateRandomPostsAndComments() {
  const postsAndComments = [];

  for (let i = 0; i < POSTS_AND_COMMENTS_COUNT; i++) {

    const fakePostAndComment = {
      posts: {
        post_type_options: getRandomElement(["Any", "Links Only", "Text Posts Only"]),
        allow_crossposting_of_posts: faker.datatype.boolean(),
        archive_posts: faker.datatype.boolean(),
        enable_spoiler_tag: faker.datatype.boolean(),
        allow_image_uploads_and_links_to_image_hosting_sites: faker.datatype.boolean(),
        allow_multiple_images_per_post: faker.datatype.boolean(),
        allow_polls: faker.datatype.boolean(),
        allow_videos: faker.datatype.boolean(),
        spam_filter_strength: {
          posts: getRandomElement(["Low", "High (default)", "All"]),
          links: getRandomElement(["Low", "High (default)", "All"]),
          comments: getRandomElement(["Low (default)", "High", "All"]),
        },
      },
      comments: {
        suggested_sort: getRandomElement([
          "None (Recommended)",
          "Best",
          "Old",
          "Top",
          "Q&A",
          "Live (Beta)",
          "Controversial",
          "New",
        ]),
        collapse_deleted_and_removed_comments: faker.datatype.boolean(),
        minutes_to_hide_comment_scores: faker.number.int({min: 0, max: 60}),
        media_in_comments: {
          gifs_from_giphy: faker.datatype.boolean(),
          collectible_expressions: faker.datatype.boolean(),
          images: faker.datatype.boolean(),
          gifs: faker.datatype.boolean(),
        },
      },
    };

    postsAndComments.push(fakePostAndComment);
  }

  return postsAndComments;
}

export async function seedPostsAndComments() {
  const postsAndComments = await generateRandomPostsAndComments();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const postsAndCommentsInserted = await CommunityPostsAndComments.insertMany(postsAndComments, options);
  return postsAndCommentsInserted;
}