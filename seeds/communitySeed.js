import { faker } from "@faker-js/faker";
import { getRandomElement } from "./seedHelpers.js";

import { seedGeneralSettings } from './communityGeneralSettingsSeed.js';
import { seedContentControls } from './communityContentControlsSeed.js';
import { seedPostsAndComments } from './communityPostsAndCommentsSeed.js';
import { seedAppearances } from './communityAppearanceSeed.js';

import { seedRules } from './communityRulesSeed.js';
import generateRandomMutedUsers from './communityMutedUsersSeed.js';
import generateRandomBannedUsers from "./communityBannedUsersSeed.js";
import generateRandomApprovedUsers from "./communityApprovedUsersSeed.js";

import { CommunityGeneralSettings } from '../src/db/models/communityGeneralSettings.js';
import { CommunityContentControls } from '../src/db/models/communityContentControls.js';
import { CommunityPostsAndComments } from '../src/db/models/communityPostsAndComments.js';
import { CommunityAppearance } from '../src/db/models/communityAppearance.js';
import { Rule } from '../src/db/models/Rule.js';
import { User } from '../src/db/models/User.js';



import { Community } from '../src/db/models/Community.js';

const COMMUNITY_COUNT = 20;

async function generateRandomCommunities() {
    // Seed the subdocuments and get the IDs
    await seedGeneralSettings();
    await seedContentControls();
    await seedPostsAndComments();
    await seedAppearances();
    await seedRules();

    const generalSettingsIds = (await CommunityGeneralSettings.find()).map(doc => doc._id);
    const contentControlsIds = (await CommunityContentControls.find()).map(doc => doc._id);
    const postsAndCommentsIds = (await CommunityPostsAndComments.find()).map(doc => doc._id);
    const appearanceIds = (await CommunityAppearance.find()).map(doc => doc._id);
    const rulesIds = (await Rule.find()).map(doc => doc._id);


    const communities = [];
    const users_ids = (await User.find()).map(doc => doc._id);

    for (let i = 0; i < COMMUNITY_COUNT; i++) {
        // Randomly select multiple rule IDs for each community
        const numberOfRules = faker.number.int({ min: 1, max: 5 }); // Adjust the maximum number of rules as needed
        const selectedRules = faker.helpers.shuffle(rulesIds).slice(0, numberOfRules);
        const muted_users = await generateRandomMutedUsers();
        const banned_users = await generateRandomBannedUsers();
        const approved_users = await generateRandomApprovedUsers();
        const users = await User.find();
        const moderators = users.slice(0, 3); // Select first 3 users as moderators
        const invitedModerators = users.slice(3, 6);

        const fakeCommunity = {
            created_at: Date.now(),
            name: faker.company.name().replace(/[^a-zA-Z0-9]/g, '_'),
            category:getRandomElement([
                'Technology', 'Science', 'Music', 'Sports', 'Gaming', 'News', 'Movies', 'Books', 'Fashion', 'Food', 'Travel', 'Health', 'Art', 'Photography', 'Education', 'Business', 'Finance', 'Politics', 'Religion', 'DIY', 'Pets', 'Environment', 'Humor', 'Personal'
            ]),
            nsfw_flag: faker.datatype.boolean(),
            members_count: faker.number.int({ min: 0, max: 1000 }),

            general_settings: getRandomElement(generalSettingsIds),
            content_controls: getRandomElement(contentControlsIds),
            posts_and_comments: getRandomElement(postsAndCommentsIds),
            appearance: getRandomElement(appearanceIds),
            rules_ids: selectedRules,
            muted_users: muted_users,
            banned_users: banned_users,
            approved_users: approved_users,
            moderators: moderators.map(user => ({
                _id: user._id,
                moderator_since: faker.date.recent()
            })),
            invited_moderators: invitedModerators.map(user => user._id)
        };
        communities.push(fakeCommunity);
    }

    return communities;
}

export async function seedCommunities() {
    const communities = await generateRandomCommunities();
    const options = { timeout: 30000 }; // 30 seconds timeout
    const communitiesInserted = await Community.insertMany(communities, options);
    return communitiesInserted;
} 