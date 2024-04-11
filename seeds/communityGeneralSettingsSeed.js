import { faker } from "@faker-js/faker";
import { CommunityGeneralSettings } from "../src/db/models/communityGeneralSettings.js";
import { getRandomElement } from "./seedHelpers.js";

const GENERAL_SETTINGS_COUNT = 20;

async function generateRandomGeneralSettings() {
  const generalSettings = [];

  for (let i = 0; i < GENERAL_SETTINGS_COUNT; i++) {

    const fakeSetting = {
      title: faker.company.buzzPhrase(),
      description: faker.lorem.sentences(),
      welcome_message: {
        send_welcome_message_flag: faker.datatype.boolean(),
      },
      type: getRandomElement(["Public", "Private", "Restricted"]),
      nsfw_flag: faker.datatype.boolean(),
      approved_users_have_the_ability_to: getRandomElement(["Post Only (Default)", "Comment Only", "Post and Comment"]),
      accepting_new_requests_to_post: faker.datatype.boolean(),
      accepting_requests_to_join: faker.datatype.boolean(),
    };

    // If send_welcome_message_flag is true, generate a message. Otherwise, set message to an empty string.
    fakeSetting.welcome_message.message = fakeSetting.welcome_message.send_welcome_message_flag ? faker.lorem.sentences() : '';

    generalSettings.push(fakeSetting);
  }

  return generalSettings;
}

export async function seedGeneralSettings() {
  const generalSettings = await generateRandomGeneralSettings();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const settingsInserted = await CommunityGeneralSettings.insertMany(generalSettings, options);
  return settingsInserted;
}