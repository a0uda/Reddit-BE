import { faker } from "@faker-js/faker";
import { getRandomElement } from "./seedHelpers.js";

import { Community } from '../src/db/models/Community.js';

///////////////////////////////////////////////// Subdocuments - Part 1//////////////////////////////////////////////////
import { CommunityGeneralSettings } from '../src/db/models/communityGeneralSettings.js';
import { CommunityContentControls } from '../src/db/models/communityContentControls.js';
import { CommunityPostsAndComments } from '../src/db/models/communityPostsAndComments.js';

import { seedGeneralSettings } from './communityGeneralSettingsSeed.js';
import { seedContentControls } from './communityContentControlsSeed.js';
import { seedPostsAndComments } from './communityPostsAndCommentsSeed.js';

///////////////////////////////////////////////// Subdocuments - Part 2//////////////////////////////////////////////////
import { Rule } from '../src/db/models/Rule.js';
import { User } from '../src/db/models/User.js';

import { seedRules } from './communityRulesSeed.js';
import generateRandomMutedUsers from './communityMutedUsersSeed.js';
import generateRandomBannedUsers from "./communityBannedUsersSeed.js";
import generateRandomApprovedUsers from "./communityApprovedUsersSeed.js";


const COMMUNITY_COUNT = 20;

async function generateRandomCommunities() {
    // Seed the subdocuments and get the IDs
    await seedGeneralSettings();
    await seedContentControls();
    await seedPostsAndComments();
    await seedRules();

    const generalSettingsIds = (await CommunityGeneralSettings.find()).map(doc => doc._id);
    const contentControlsIds = (await CommunityContentControls.find()).map(doc => doc._id);
    const postsAndCommentsIds = (await CommunityPostsAndComments.find()).map(doc => doc._id);
    const rulesIds = (await Rule.find()).map(doc => doc._id);

    const communities = [];
    const users = await User.find();
    const owner = users[0]; // Set the first user as the owner of all communities.

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
        // Select a random user as the owner
        const owner = getRandomElement(moderators);
        const fakeCommunity = {
            // Basic Attributes.
            created_at: Date.now(),
            name: faker.company.name().replace(/[^a-zA-Z0-9]/g, '_'),
            category: getRandomElement([
                'Technology', 'Science', 'Music', 'Sports', 'Gaming', 'News', 'Movies', 'Books', 'Fashion', 'Food', 'Travel', 'Health', 'Art', 'Photography', 'Education', 'Business', 'Finance', 'Politics', 'Religion', 'DIY', 'Pets', 'Environment', 'Humor', 'Personal'
            ]),
            members_count: faker.number.int({ min: 0, max: 1000 }),
            owner: owner._id,

            // Part 1 of embedded documents.
            general_settings: generalSettingsIds[i],
            content_controls: contentControlsIds[i],
            posts_and_comments: postsAndCommentsIds[i],

            // Part 2 of embedded documents.
            approved_users: approved_users,
            muted_users: muted_users,
            banned_users: banned_users,

            moderators: moderators.map(user => ({
                username: user.username,
                moderator_since: faker.date.recent(),
                has_access: {
                    everything: faker.datatype.boolean(),
                    manage_users: faker.datatype.boolean(),
                    manage_settings: faker.datatype.boolean(),
                    manage_posts_and_comments: faker.datatype.boolean(),
                },
                profile_picture: user.profile_picture,



            })),
            profile_picture: faker.image.avatar(),
            banner_picture: faker.image.avatar(),
            members_nickname: faker.company.name(),
            currently_viewing_nickname: faker.company.name(),
            owner: moderators[0]._id,
            description: faker.company.catchPhrase(),

            rules_ids: selectedRules,
            removal_reasons: [
                { removal_reason_title: "Spam", reason_message: "This post is spam" },
            ],
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