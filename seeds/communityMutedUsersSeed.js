import { faker } from "@faker-js/faker";
import { User } from "../src/db/models/User.js";
import { getRandomElement } from "./seedHelpers.js";
const MUTED_USERS_COUNT = 6;

async function generateRandomMutedUsers() {
    const muted_users = [];
    const users = await User.find();
    for (let i = 0; i < MUTED_USERS_COUNT; i++) {
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
