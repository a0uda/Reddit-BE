import { faker } from "@faker-js/faker";
import { Rule } from "../../src/db/models/Rule.js";
import { getRandomElement } from "../helpers/seedHelpers.js";

const RULE_COUNT = 20;
async function generateRandomRules() {
  const rules = [];

  for (let i = 0; i < RULE_COUNT; i++) {
    const fakeRule = {
      rule_title: faker.lorem.word(),
      rule_order: faker.number.int({ min: 1 }),
      applies_to: getRandomElement([
        "posts_and_comments",
        "posts_only",
        "comments_only",
      ]),
      report_reason: faker.lorem.word(),
      full_description: faker.lorem.sentences(),
    };

    rules.push(fakeRule);
  }
  return rules;
}

export async function seedRules() {
  const rules = await generateRandomRules();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const rulesInserted = await Rule.insertMany(rules, options);
  return rulesInserted;
}
