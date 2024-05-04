import { faker } from "@faker-js/faker";
import { getRandomElement } from "../helpers/seedHelpers.js";
const APPROVED_USERS_COUNT = 6;

async function generateRandomApprovedUsers(users) {
  const approved_users = [];
  for (let i = 8; i < 10; i++) {
    const fakeApprovedUser = {
      // get random user
      username: getRandomElement(users).username,
      approved_at: faker.date.recent(),
    };
    approved_users.push(fakeApprovedUser);
  }
  return approved_users;
}
export default generateRandomApprovedUsers;
