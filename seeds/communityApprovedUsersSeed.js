
import { faker } from "@faker-js/faker";

import { getRandomElement } from "./seedHelpers.js";

const APPROVED_USERS_COUNT = 6;

async function generateRandomApprovedUsers() {
    const approved_users = [];
    for (let i = 0; i < APPROVED_USERS_COUNT; i++) {
        const fakeApprovedUser = {
            username: faker.internet.userName(),
            approved_at: faker.date.recent(),
            profile_picture: faker.image.avatar()
        };
        approved_users.push(fakeApprovedUser);
    }
    return approved_users;
}
export default generateRandomApprovedUsers;
