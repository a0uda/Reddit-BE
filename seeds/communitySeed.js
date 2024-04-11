import { faker } from "@faker-js/faker";
import { getRandomElement } from "./seedHelpers.js";

import { seedGeneralSettings } from './communityGeneralSettingsSeed.js';
import { seedContentControls } from './communityContentControlsSeed.js';
import { seedPostsAndComments } from './communityPostsAndCommentsSeed.js';
import { seedAppearances } from './communityAppearanceSeed.js';

import { CommunityGeneralSettings } from '../src/db/models/communityGeneralSettings.js';
import { CommunityContentControls } from '../src/db/models/communityContentControls.js';
import { CommunityPostsAndComments } from '../src/db/models/communityPostsAndComments.js';
import { CommunityAppearance } from '../src/db/models/communityAppearance.js';

import { Community } from '../src/db/models/Community.js';

const COMMUNITY_COUNT = 20;

async function generateRandomCommunities() {
    // Seed the subdocuments and get the IDs
    await seedGeneralSettings();
    await seedContentControls();
    await seedPostsAndComments();
    await seedAppearances();

    // This line fetches all documents from the CommunityGeneralSettings collection, extracts their IDs, 
    // and stores these IDs in the generalSettingsIds constant.
    const generalSettingsIds = (await CommunityGeneralSettings.find()).map(doc => doc._id);
    const contentControlsIds = (await CommunityContentControls.find()).map(doc => doc._id);
    const postsAndCommentsIds = (await CommunityPostsAndComments.find()).map(doc => doc._id);
    const appearanceIds = (await CommunityAppearance.find()).map(doc => doc._id);

    const communities = [];

    for (let i = 0; i < COMMUNITY_COUNT; i++) {
        const fakeCommunity = {
            created_at: Date.now(),
            name: faker.company.name(),
            category:getRandomElement([
                'Technology', 'Science', 'Music', 'Sports', 'Gaming', 'News', 'Movies', 'Books', 'Fashion', 'Food', 'Travel', 'Health', 'Art', 'Photography', 'Education', 'Business', 'Finance', 'Politics', 'Religion', 'DIY', 'Pets', 'Environment', 'Humor', 'Personal'
            ]),
            nsfw_flag: faker.datatype.boolean(),
            members_count: faker.number.int({ min: 0, max: 1000 }),

            general_settings: generalSettingsIds[i],
            content_controls: contentControlsIds[i],
            posts_and_comments: postsAndCommentsIds[i],
            appearance: appearanceIds[i],
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