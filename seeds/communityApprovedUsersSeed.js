
import { faker } from "@faker-js/faker";
import { User } from "../src/db/models/User.js";

import { getRandomElement } from "./seedHelpers.js";
const APPROVED_USERS_COUNT = 6;

async function generateRandomApprovedUsers() {
    const approved_users = [];
    const users = await User.find();
    for (let i = 0; i < APPROVED_USERS_COUNT; i++) {
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
