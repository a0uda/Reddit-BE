import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { verifyAuthToken } from "./userAuth.js";
import { getSafetySettingsFormat } from "../utils/userSettings.js";
import { encodeXText } from "nodemailer/lib/shared/index.js";
import { followUserHelper } from "../services/users.js";
import bcrypt from "bcryptjs";
import { Post } from "../db/models/Post.js";
import { getPost } from "./posts.js";
import { generateResponse } from "../utils/generalUtils.js";
import { communityNameExists } from "../utils/communities.js";
import { pushNotification } from "./notifications.js";
import { newFollowerFormatEmail } from "../templates/email.js";
import { sendEmail } from "../utils/emailSending.js";

export async function blockUser(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }
    const userToBlock = await User.findOne({
      username: request.body.blocked_username,
    });
    if (!userToBlock) {
      return {
        success: false,
        err: "User Not Found",
        status: 404,
      };
    }
    const userBlockedList = user.safety_and_privacy_settings.blocked_users;

    const index = user.safety_and_privacy_settings.blocked_users.findIndex(
      (blockedUser) => blockedUser.id.toString() == userToBlock._id.toString()
    );
    let operation = "";
    if (index !== -1) {
      userBlockedList.splice(index, 1);
      console.log("User removed from blocked users.");
      operation = "unblocked";
    } else {
      const newBlockedUser = {
        id: userToBlock._id,
        blocked_date: new Date(),
      };
      userBlockedList.push(newBlockedUser);
      console.log("User added to blocked users.");
      operation = "blocked";
      await followUserHelper(user, userToBlock, false);
      await followUserHelper(userToBlock, user, false);
    }
    user.safety_and_privacy_settings.blocked_users = userBlockedList;
    await user.save();
    return {
      success: true,
      status: 200,
      msg: `User ${operation} successfully.`,
    };
  } catch (error) {
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while blocking/unblocking user.",
    };
  }
}

export async function reportUser(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }
    const userToReport = await User.findOne({
      username: request.body.reported_username,
    });
    if (!userToReport) {
      return {
        success: false,
        err: "User Not Found",
        status: 404,
      };
    }
    const userReportedList = user.reported_users;
    const index = userReportedList.indexOf(userToReport._id);
    if (index !== -1) {
      console.log("User already reported.");
    } else {
      userReportedList.push(userToReport._id);
      console.log("User added to reported users.");
    }
    user.reported_users = userReportedList;
    await user.save();
    return {
      success: true,
      status: 200,
      msg: "User reported successfully.",
    };
  } catch (error) {
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while reporting user.",
    };
  }
}

export async function addOrRemovePicture(
  request,
  pictureField,
  remove = false
) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }
    if (!remove) {
      user[pictureField] = request.body[pictureField];
      await user.save();
      return {
        success: true,
        status: 200,
        msg: `User ${pictureField} added successfully`,
      };
    } else {
      user[pictureField] = "";
      await user.save();
      return {
        success: true,
        status: 200,
        msg: `User ${pictureField} removed successfully`,
      };
    }
  } catch (error) {
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    };
  }
}

export async function muteCommunity(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }
    const communityToMute = await Community.findOne({
      name: request.body.community_name,
    });
    if (!communityToMute) {
      return {
        success: false,
        err: "Community Not Found",
        status: 404,
      };
    }
    const userMutedList = user.safety_and_privacy_settings.muted_communities;

    const index = userMutedList.findIndex(
      (mutedCommunity) =>
        mutedCommunity.id.toString() === communityToMute._id.toString()
    );
    let operation = "";
    if (index !== -1) {
      userMutedList.splice(index, 1);
      console.log("Community removed from muted communities.");
      operation = "unmuted";
    } else {
      const newMutedCommunity = {
        id: communityToMute._id,
        muted_date: new Date(),
      };
      userMutedList.push(newMutedCommunity);
      console.log("Community added to muted communities.");
      operation = "muted";
    }
    user.safety_and_privacy_settings.muted_communities = userMutedList;
    await user.save();
    return {
      success: true,
      status: 200,
      msg: `Community ${operation} successfully.`,
    };
  } catch (error) {
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    };
  }
}
export async function favoriteCommunity(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }
    const community_name = request.body.community_name;
    if (!community_name) {
      return generateResponse(false, 400, "Missing community_name");
    }
    const communityToFav = await Community.findOne({
      name: request.body.community_name,
    });
    if (!communityToFav) {
      return generateResponse(false, 404, "Community not found");
    }
    const userCommunities = user.communities;

    const index = userCommunities.findIndex(
      (community) => community.id.toString() === communityToFav._id.toString()
    );
    if (index !== -1) {
      userCommunities[index].favorite_flag =
        !userCommunities[index].favorite_flag;
      user.markModified("communities");
      await user.save();
      return generateResponse(true, null, "Community modified successfully.");
    }

    const userModCommunities = user.moderated_communities;

    const index2 = userModCommunities.findIndex(
      (community) => community.id.toString() === communityToFav._id.toString()
    );
    if (index2 !== -1) {
      userModCommunities[index2].favorite_flag =
        !userModCommunities[index2].favorite_flag;
      user.markModified("moderated_communities");
      await user.save();
      return generateResponse(
        true,
        null,
        "Moderated community modified successfully."
      );
    }

    return generateResponse(
      false,
      404,
      "Community not found in user communities"
    );
  } catch (error) {
    generateResponse(false, 500, "Internal Server error");
  }
}

export async function followUser(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }

    const userToFollow = await User.findOne({
      username: request.body.other_username,
    });
    if (!userToFollow) {
      return {
        success: false,
        err: "User Not Found",
        status: 404,
      };
    }

    const userFollowingList = user.following_ids;
    const index = userFollowingList.indexOf(userToFollow._id);
    let operation = "";

    if (index !== -1) {
      await followUserHelper(user, userToFollow, false);

      // userFollowingList.splice(index, 1);
      // console.log("User unfollowed.");
      operation = "unfollowed";

      // // Remove current user from followed user's followers list
      // const followedUserFollowersList = userToFollow.followers_ids;
      // const followerIndex = followedUserFollowersList.indexOf(user._id);

      // if (followerIndex !== -1) {
      //   followedUserFollowersList.splice(followerIndex, 1);
      //   userToFollow.followers_ids = followedUserFollowersList;
      //   await userToFollow.save();
      // }
    } else {
      await followUserHelper(user, userToFollow, true);
      // userFollowingList.push(userToFollow._id);
      // console.log("User followed.");
      operation = "followed";

      // // Add current user to followed user's followers list
      // const followedUserFollowersList = userToFollow.followers_ids;
      // const followerIndex = followedUserFollowersList.indexOf(user._id);

      // if (followerIndex === -1) {
      //   userToFollow.followers_ids.push(user._id);
      //   await userToFollow.save();
      // }

      //send email
      console.log(userToFollow.email_settings.new_follower_email);
      console.log(userToFollow.email_settings.unsubscribe_from_all_emails);
      if (userToFollow.email_settings.new_follower_email) {
        if (!userToFollow.email_settings.unsubscribe_from_all_emails) {
          let message = newFollowerFormatEmail(
            userToFollow.email,
            user.username
          );
          sendEmail(message);
          console.log("New follower email sent");
        }
      }

      //send notif
      console.log(userToFollow);
      const { success: succesNotif, error: errorNotif } =
        await pushNotification(
          userToFollow,
          user.username,
          null,
          null,
          "new_followers"
        );
      if (!succesNotif) console.log(errorNotif);
    }

    // user.following_ids = userFollowingList;
    // await user.save();

    return {
      success: true,
      status: 200,
      msg: `User ${operation} successfully.`,
    };
  } catch (error) {
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while following/unfollowing user.",
    };
  }
}
/*
 joined_users: {
    type: mongoose.Schema.Types.String,
    ref: "User",

  },
 */
export async function joinCommunity(request, leave = false) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }
    const community = await communityNameExists(request.body.community_name);

    if (!community) {
      return {
        success: false,
        err: `Community ${request.community_name} Not Found`,
        status: 404,
      };
    }

    if (leave) {
      
      // console.log(joinCommunity)
      const index = community.joined_users.findIndex(
        (userObj) => userObj._id.toString() == user._id.toString()
      );
      console.log(index, "here");
      if (index !== -1) {
        community.joined_users.splice(index, 1);
        community.members_count--;
        console.log(community.members_count)
        await community.save();
      } else {
        return {
          success: false,
          status: 400,
          msg: `User ${user.username} already left community ${community.name} .`,
        };
      }

      const communityIndex = user.communities.findIndex(
        (c) => c.id.toString() == community._id.toString()
      );
      if (communityIndex !== -1) {
        user.communities.splice(communityIndex, 1);
        await user.save();
      }
      return {
        success: true,
        status: 200,
        msg: `User ${user.username} left community ${community.name} successfully.`,
      };
    } else {
      // Join the community

      if (community.banned_users.includes(user.username)) {
        return {
          success: false,
          status: 400,
          msg: `User ${user.username} is banned from community ${community.name} .`,
        };
      }

      console.log(
        community.joined_users.some(
          (userObj) =>
            userObj._id && userObj._id.toString() == user._id.toString()
        )
      );
      console.log("testtt join community :", request.body.community_name);

      console.log(community.joined_users);
      if (
        community.joined_users.some(
          (userObj) =>
            userObj._id && userObj._id.toString() == user._id.toString()
        )
      ) {
        return {
          success: false,
          status: 400,
          msg: `User ${user.username} already joined community ${community.name} .`,
        };
      }
      console.log("hii");
      community.joined_users.push({ _id: user._id });
      community.members_count++;
      await community.save();
      if (
        !user.communities.some(
          (c) => c.id.toString() == community._id.toString()
        )
      ) {
        user.communities.push({
          id: community._id,
          favorite_flag: false,
          disable_updates: false,
        });
        await user.save();
      }

      return {
        success: true,
        status: 200,
        msg: `User ${user.username} joined community ${community.name} successfully.`,
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while joining or leaving the community.",
    };
  }
}

export async function clearHistory(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }

    user.history_posts_ids = [];

    await user.save();

    return {
      success: true,
      status: 200,
      msg: "History cleared successfully.",
    };
  } catch (error) {
    // //console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while clearing history.",
    };
  }
}

export async function deleteAccount(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }

    const username = user.username;
    if (username != request.body.username) {
      return generateResponse(false, 400, "Incorrect Username");
    }

    const result = await bcrypt.compare(request.body.password, user.password);
    if (!result) {
      return generateResponse(false, 400, "Incorrect Password");
    }

    if (user.deleted)
      return generateResponse(false, 400, "User already deleted");
    // user.username = "[deleted]";
    user.profile_picture = "";
    user.deleted = true;
    user.deleted_at = Date.now();

    await user.save();

    const deletedUserId = user._id;
    // Update blocked_users, followers_ids, following_ids for all users
    await User.updateMany(
      {
        $or: [
          { "safety_and_privacy_settings.blocked_users": deletedUserId },
          { followers_ids: deletedUserId },
          { following_ids: deletedUserId },
        ],
      },
      {
        $pull: {
          "safety_and_privacy_settings.blocked_users": deletedUserId,
          followers_ids: deletedUserId,
          following_ids: deletedUserId,
        },
      }
    );

    return generateResponse(true, 200, "Account deleted successfully.");
  } catch (error) {
    console.log("Error:", error);
    return generateResponse(false, 500, "Internal server error");
  }
}

export async function followPost(request) {
  try {
    const { success, error, post, user, message } = await getPost(
      request,
      true
    );
    if (!success) {
      return { success, error };
    }

    if (!user.followed_posts_ids.includes(post._id)) {
      user.followed_posts_ids.push(post._id);
      await user.save();
      return {
        success: true,
        error: {},
        message: "User has followed post sucessfully",
      };
    } else {
      const indexToRemove = user.followed_posts_ids.indexOf(post._id);
      console.log(indexToRemove);
      user.followed_posts_ids.splice(indexToRemove, 1);
      await user.save();
      return {
        success: true,
        post,
        message: "User has unfollowed post sucessfully",
      };
    }
  } catch (e) {
    return {
      success: false,
      error: { status: 500, message: e },
    };
  }
}

export async function hidePost(request) {
  const { success, error, post, user, message } = await getPost(request, true);
  if (!success) {
    return { success, error };
  }

  if (!user.hidden_and_reported_posts_ids.includes(post._id)) {
    user.hidden_and_reported_posts_ids.push(post._id);
    await user.save();
    return {
      success: true,
      error: {},
      message: "Post hidden sucessfully",
    };
  } else {
    const indexToRemove = user.hidden_and_reported_posts_ids.indexOf(post._id);
    user.hidden_and_reported_posts_ids.splice(indexToRemove, 1);
    await user.save();
    return {
      success: true,
      post,
      message: "Post unhidden sucessfully",
    };
  }
}
