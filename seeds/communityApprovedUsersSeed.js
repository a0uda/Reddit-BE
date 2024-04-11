
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

const APPROVED_USERS_COUNT = 6;

async function generateRandomApprovedUsers() {
    const approved_users = [];

    for (let i = 0; i < APPROVED_USERS_COUNT; i++) {
        const fakeApprovedUser = {
            id: new mongoose.Types.ObjectId(),
            approved_at: faker.date.recent(),

        };
        approved_users.push(fakeApprovedUser);

    }
    return approved_users;
}
export default generateRandomApprovedUsers;
