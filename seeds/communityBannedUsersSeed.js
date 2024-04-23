import { faker } from "@faker-js/faker";
import { getRandomElement } from "./seedHelpers.js";
import { User } from "../src/db/models/User.js";


const BANNED_USERS_COUNT = 6;

async function generateRandomBannedUsers() {
    const banned_users = [];
    const users = await User.find();

    for (let i = 0; i < BANNED_USERS_COUNT; i++) {
        const permanentFlag = faker.datatype.boolean();
        const banned_until = permanentFlag ? null : faker.date.future();

        const fakeBannedUser = {
            username: getRandomElement(users).username,
            banned_date: faker.date.recent(),
            reason_for_ban: getRandomElement(["none", "rule", "spam", "personal", "threat", "others"]),
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
