import { faker } from "@faker-js/faker";
import { CommunityAppearance } from "../src/db/models/communityAppearance.js";

const APPEARANCE_COUNT = 20;

function generateRandomColor() {
  return {
    hue: faker.number.int({ min: 0, max: 360 }),
    saturation: faker.number.int({ min: 0, max: 100 }),
    hex: faker.internet.color(),
  };
}

function generateRandomImage() {
  return {
    url: faker.image.url(),    
    alt: faker.lorem.sentence(),
  };
}

async function generateRandomAppearances() {
  const appearances = [];

  for (let i = 0; i < APPEARANCE_COUNT; i++) {

    const fakeAppearance = {
      avatar: generateRandomImage(),
      banner: generateRandomImage(),
      key_color: generateRandomColor(),
      base_color: generateRandomColor(),
      sticky_post_color: generateRandomColor(),
      dark_mode: faker.datatype.boolean(),
    };

    appearances.push(fakeAppearance);
  }

  return appearances;
}

export async function seedAppearances() {
  const appearances = await generateRandomAppearances();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const appearancesInserted = await CommunityAppearance.insertMany(appearances, options);
  return appearancesInserted;
}