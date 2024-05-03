import { faker } from "@faker-js/faker";
import { User } from "../../src/db/models/User.js";
import { getRandomElement } from "../helpers/seedHelpers.js";

async function generateRandomMutedUsers(users) {
  const muted_users = [];
  for (let i = 4; i < 6; i++) {
    const fakeMutedUser = {
      username: getRandomElement(users).username,
      muted_by_username: getRandomElement(users).username,
      mute_date: faker.date.recent(),
      mute_reason: faker.lorem.sentence(),
    };

    muted_users.push(fakeMutedUser);
  }
  return muted_users;
}
export default generateRandomMutedUsers;
