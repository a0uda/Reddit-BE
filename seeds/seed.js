import mongoose from "mongoose";
import { seedUsers } from "./UserSeed.js";
import { seedPosts } from "./PostSeed.js";
import { seedComments } from "./CommentSeed.js";
import { seedGeneralSettings } from "./communityGeneralSettingsSeed.js";
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

  const communityGeneralSettings = await seedGeneralSettings();

  console.log("✅ Seeds executed successfully");
  mongoose.connection.close();
})();
