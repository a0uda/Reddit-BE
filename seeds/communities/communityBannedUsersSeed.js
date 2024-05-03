import { faker } from "@faker-js/faker";
import { getRandomElement } from "../helpers/seedHelpers.js";
import { User } from "../../src/db/models/User.js";

async function generateRandomBannedUsers(users) {
  const banned_users = [];

  for (let i = 6; i < 8; i++) {
    const permanentFlag = faker.datatype.boolean();
    const banned_until = permanentFlag ? null : faker.number.between(1, 30);

    const fakeBannedUser = {
      username: getRandomElement(users).username,
      banned_date: faker.date.recent(),
      reason_for_ban: getRandomElement([
        "none",
        "rule",
        "spam",
        "personal",
        "threat",
        "others",
      ]),
      mod_note: faker.lorem.sentence(),
      permanent_flag: permanentFlag,
      banned_until: banned_until,
      note_for_ban_message: faker.lorem.sentence(),
    };

    banned_users.push(fakeBannedUser);
  }
  return banned_users;
}
export default generateRandomBannedUsers;
