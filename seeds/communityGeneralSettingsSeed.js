import { faker } from "@faker-js/faker";
import { CommunityGeneralSettings } from "../src/db/models/communityGeneralSettings.js";
import { getRandomBool, getRandomElement } from "./seedHelpers.js";

const GENERAL_SETTINGS_COUNT = 20;

async function generateRandomSettings() {
  const generalSettings = [];

  for (let i = 0; i < GENERAL_SETTINGS_COUNT; i++) {

    const fakeSetting = {
      description: faker.lorem.sentences(),
      welcome_message: {
        send_welcome_message_flag: getRandomBool(),
        message: faker.lorem.sentences(),
      },
      language: getRandomElement(["English", "Frensh", "Spanish", "German", "Italian", "Russian", "Chinese", "Japanese", "Korean", "Arabic"]),
      region: faker.location.country(),
      visibility: getRandomElement(["Public", "Private", "Restricted"]),
      nsfw_flag: getRandomBool(),
    };

    generalSettings.push(fakeSetting);
  }

  return generalSettings;
}

export async function seedGeneralSettings() {
  const generalSettings = await generateRandomSettings();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const settingsInserted = await CommunityGeneralSettings.insertMany(generalSettings, options);
  return settingsInserted;
}