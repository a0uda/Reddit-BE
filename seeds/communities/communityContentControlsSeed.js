import { faker } from "@faker-js/faker";
import { CommunityContentControls } from "../../src/db/models/communityContentControls.js";
import { getRandomElement } from "../helpers/seedHelpers.js";

const CONTENT_CONTROLS_COUNT = 20;

async function generateRandomContentControls() {
  const contentControls = [];

  for (let i = 0; i < CONTENT_CONTROLS_COUNT; i++) {
    const fakeContentControl = {
      providing_members_with_posting_guidlines: {
        flag: faker.datatype.boolean(),
      },
      require_words_in_post_title: {
        flag: faker.datatype.boolean(),
      },
      ban_words_from_post_title: {
        flag: faker.datatype.boolean(),
      },
      ban_words_from_post_body: {
        flag: faker.datatype.boolean(),
      },
      require_or_ban_links_from_specific_domains: {
        flag: faker.datatype.boolean(),
      },
      restrict_how_often_the_same_link_can_be_posted: {
        flag: faker.datatype.boolean(),
      },
    };

    fakeContentControl.providing_members_with_posting_guidlines.guidline_text =
      fakeContentControl.providing_members_with_posting_guidlines.flag
        ? faker.lorem.sentences()
        : "";

    fakeContentControl.require_words_in_post_title.add_required_words =
      fakeContentControl.require_words_in_post_title.flag
        ? Array.from({ length: 5 }, () => faker.lorem.word())
        : [];

    fakeContentControl.ban_words_from_post_title.add_banned_words =
      fakeContentControl.ban_words_from_post_title.flag
        ? Array.from({ length: 5 }, () => faker.lorem.word())
        : [];

    fakeContentControl.ban_words_from_post_body.add_banned_words =
      fakeContentControl.ban_words_from_post_body.flag
        ? Array.from({ length: 5 }, () => faker.lorem.word())
        : [];

    fakeContentControl.require_or_ban_links_from_specific_domains.restriction_type =
      fakeContentControl.require_or_ban_links_from_specific_domains.flag
        ? getRandomElement(["Required domains", "Blocked domains"])
        : "Required domains";
    fakeContentControl.require_or_ban_links_from_specific_domains.require_or_block_link_posts_with_these_domains =
      fakeContentControl.require_or_ban_links_from_specific_domains.flag
        ? Array.from({ length: 5 }, () => faker.internet.domainName())
        : [];
    fakeContentControl.restrict_how_often_the_same_link_can_be_posted.number_of_days =
      fakeContentControl.restrict_how_often_the_same_link_can_be_posted.flag
        ? faker.number.int({ min: 0, max: 365 })
        : 0;

    contentControls.push(fakeContentControl);
  }

  return contentControls;
}

export async function seedContentControls() {
  const contentControls = await generateRandomContentControls();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const controlsInserted = await CommunityContentControls.insertMany(
    contentControls,
    options
  );
  return controlsInserted;
}
