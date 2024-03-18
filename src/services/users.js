import { User } from "../db/models/User.js";

export async function followUserHelper(user1, user2, follow = true) {
  try {
    if (follow) {
      if (!user2.followers_ids.includes(user1._id)) {
        user2.followers_ids.push(user1._id);
        await user2.save();
      }

      if (!user1.following_ids.includes(user2._id)) {
        user1.following_ids.push(user2._id);
        await user1.save();
      }

      console.log(`User ${user1.username} follows user ${user2.username}.`);
    } else {
      const indexUserOne = user2.followers_ids.indexOf(user1._id);
      if (indexUserOne !== -1) {
        user2.followers_ids.splice(indexUserOne, 1);
        await user2.save();
      }

      const indexUserTwo = user1.following_ids.indexOf(user2._id);
      if (indexUserTwo !== -1) {
        user1.following_ids.splice(indexUserTwo, 1);
        await user1.save();
      }

      console.log(`User ${user1.username} unfollows user ${user2.username}.`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
