import mongoose from "mongoose";
import { seedUsers } from "./UserSeed.js";
import { seedPosts } from "./PostSeed.js";
import { seedComments } from "./CommentSeed.js";

import { seedGeneralSettings } from "./communityGeneralSettingsSeed.js";
import { seedContentControls } from "./communityContentControlsSeed.js";
import { seedPostsAndComments } from "./communityPostsAndCommentsSeed.js";

import { seedCommunities } from "./communitySeed.js";

import { connect_to_db } from "../src/db/mongoose.js";

(async function () {
  console.log("Entered");

  try {
    connect_to_db();
  } catch (err) {
    console.log("Error, couldn't connect to database");
  }

  // const users = await seedUsers();
  // const posts = await seedPosts(users);
  // const comments = await seedComments(posts, users);

  // const communityGeneralSettings = await seedGeneralSettings();
  // const communityContentControls = await seedContentControls();
  // const communityPostsAndComments = await seedPostsAndComments();
  // const communityAppearance = await seedAppearances();
  const communities = await seedCommunities();


  console.log("✅ Seeds executed successfully");
  mongoose.connection.close();
})();
