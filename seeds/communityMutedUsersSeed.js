import { faker } from "@faker-js/faker";

const MUTED_USERS_COUNT = 6;

async function generateRandomMutedUsers() {
    const muted_users = [];

    for (let i = 0; i < MUTED_USERS_COUNT; i++) {
        const fakeMutedUser = {
            username: faker.internet.userName(),
            muted_by_username: faker.internet.userName(),
            mute_date: faker.date.recent(),
            mute_reason: faker.lorem.sentence(),
            profile_picture: faker.image.avatar()
        };

        muted_users.push(fakeMutedUser);
    }
    return muted_users;
}
export default generateRandomMutedUsers;
