import { faker } from "@faker-js/faker";
import { CommunityContentControls } from "../src/db/models/communityContentControls.js";
import { getRandomBool, getRandomElement } from "./seedHelpers.js";

const CONTENT_CONTROLS_COUNT = 20;

async function generateRandomContentControls() {
  const contentControls = [];

  for (let i = 0; i < CONTENT_CONTROLS_COUNT; i++) {

    const fakeContentControl = {
      providing_members_with_posting_guidlines: {
        flag: getRandomBool(),
        guidline_text: faker.lorem.sentences(),
      },
      require_words_in_post_title: {
        flag: getRandomBool(),
        add_required_words: Array.from({length: 5}, () => faker.lorem.word()),
      },
      ban_words_from_post_title: {
        flag: getRandomBool(),
        add_banned_words: Array.from({length: 5}, () => faker.lorem.word()),
      },
      ban_words_from_post_body: {
        flag: getRandomBool(),
        add_banned_words: faker.lorem.word(),
      },
      require_or_ban_links_from_specific_domains: {
        flag: getRandomBool(),
        restriction_type: getRandomElement(["Required domains", "Blocked domains"]),
        require_or_block_link_posts_with_these_domains: faker.internet.domainName(),
      },
      restrict_how_often_the_same_link_can_be_posted: {
        flag: getRandomBool(),
        number_of_days: faker.number.int({min: 0, max: 365}),
      },
    };

    contentControls.push(fakeContentControl);
  }

  return contentControls;
}

export async function seedContentControls() {
  const contentControls = await generateRandomContentControls();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const controlsInserted = await CommunityContentControls.insertMany(contentControls, options);
  return controlsInserted;
}