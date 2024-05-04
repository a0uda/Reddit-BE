import { faker } from "@faker-js/faker";
import { getRandomElement } from "./helpers/seedHelpers.js";

import { Community } from "../src/db/models/Community.js";

///////////////////////////////////////////////// Subdocuments - Part 1//////////////////////////////////////////////////
import { CommunityGeneralSettings } from "../src/db/models/communityGeneralSettings.js";
import { CommunityContentControls } from "../src/db/models/communityContentControls.js";
import { CommunityPostsAndComments } from "../src/db/models/communityPostsAndComments.js";

import { seedGeneralSettings } from "./communities/communityGeneralSettingsSeed.js";
import { seedContentControls } from "./communities/communityContentControlsSeed.js";
import { seedPostsAndComments } from "./communities/communityPostsAndCommentsSeed.js";

///////////////////////////////////////////////// Subdocuments - Part 2//////////////////////////////////////////////////
import { Rule } from "../src/db/models/Rule.js";
import { User } from "../src/db/models/User.js";

import { seedRules } from "./communities/communityRulesSeed.js";
import generateRandomMutedUsers from "./communities/communityMutedUsersSeed.js";
import generateRandomBannedUsers from "./communities/communityBannedUsersSeed.js";
import generateRandomApprovedUsers from "./communities/communityApprovedUsersSeed.js";
//add pending_flag to moderator

const COMMUNITY_COUNT = 20;

async function generateRandomCommunities(users) {
  // Seed the subdocuments and get the IDs
  await seedGeneralSettings();
  await seedContentControls();
  await seedPostsAndComments();
  await seedRules();

  const generalSettingsIds = (await CommunityGeneralSettings.find()).map(
    (doc) => doc._id
  );
  const contentControlsIds = (await CommunityContentControls.find()).map(
    (doc) => doc._id
  );
  const postsAndCommentsIds = (await CommunityPostsAndComments.find()).map(
    (doc) => doc._id
  );
  const rulesIds = (await Rule.find()).map((doc) => doc._id);
  const rulesCount = rulesIds.length;

  const communities = [];

  //each community have 15 member , element 0 is the owner, 0 to 4 are moderators
  // 5 to 7 are approved users, 8 to 9 are muted users, 10 to 11 are banned users
  //the rest are just joined users
  //no pending moderators in the seed
  //community type , restricted , public , private ?
  for (let i = 0; i < COMMUNITY_COUNT; i++) {
    var joined_users = users.slice(0, 5);

    const owner = joined_users[0];
    const moderators = users.slice(0, 4); // Select first 5 users as moderators including the owner
    moderators.push(users[17]);
    const selectedRules = faker.helpers.shuffle(rulesIds).slice(0, 3);
    const numberOfRules = selectedRules.length;
    const muted_users = await generateRandomMutedUsers(
      joined_users,
      moderators
    );
    const banned_users = await generateRandomBannedUsers(joined_users);
    const approved_users = await generateRandomApprovedUsers(joined_users);

    joined_users.map((user) => user._id);
    const fakeCommunity = {
      // Basic Attributes.
      created_at: faker.date.past(),
      name: faker.company.name().replace(/[^a-zA-Z0-9]/g, "_"),
      category: getRandomElement([
        "Technology",
        "Science",
        "Music",
        "Sports",
        "Gaming",
        "News",
        "Movies",
        "Books",
        "Fashion",
        "Food",
        "Travel",
        "Health",
        "Art",
        "Photography",
        "Education",
        "Business",
        "Finance",
        "Politics",
        "Religion",
        "DIY",
        "Pets",
        "Environment",
        "Humor",
        "Personal",
      ]),
      members_count: joined_users.length,
      owner: owner._id,

      // Part 1 of embedded documents.
      general_settings: generalSettingsIds[i],
      content_controls: contentControlsIds[i],
      posts_and_comments: postsAndCommentsIds[i],

      // Part 2 of embedded documents.
      joined_users,
      approved_users: approved_users,
      muted_users: muted_users,
      banned_users: banned_users,
      moderators: moderators.map((user) => ({
        username: user.username,
        moderator_since: faker.date.recent(),
        has_access: {
          everything: true,
          manage_users: true,
          manage_settings: true,
          manage_posts_and_comments: true,
        },
        pending_flag: false,
      })),

      rules_ids: selectedRules,
      removal_reasons: [
        { removal_reason_title: "Spam", reason_message: "This post is spam" },
      ],

      profile_picture: faker.image.avatar(),
      banner_picture: faker.image.avatar(),

      members_nickname: faker.company.name(),
      currently_viewing_nickname: faker.company.name(),
    };

    communities.push(fakeCommunity);
  }

  return communities;
}

export async function seedCommunities(users) {
  await Rule.deleteMany({});
  await Community.deleteMany({});
  const communities = await generateRandomCommunities(users);
  const options = { timeout: 30000 }; // 30 seconds timeout

  const communitiesInserted = await Community.insertMany(communities, options);

  //for each community , find its owner and moderators and add the community to their moderated_communities
  for (let i = 0; i < communitiesInserted.length; i++) {
    const community = communitiesInserted[i];
    for (let j = 0; j < community.moderators.length; j++) {
      const moderator = users.find(
        (user) => user.username == community.moderators[j].username
      );
      moderator.moderated_communities.push({
        id: community._id,
        favorite_flag: false,
      });
      await moderator.save();
    }
    for (let j = 0; j < community.joined_users.length; j++) {
      const user = users.find(
        (user) => user._id.toString() == community.joined_users[j]._id
      );
      // console.log(community);
      user.communities.push({
        id: community._id,
        favorite_flag: faker.datatype.boolean(),
        disable_updates: faker.datatype.boolean(),
      });
      await user.save();
    }
  }
  return communitiesInserted;
}
