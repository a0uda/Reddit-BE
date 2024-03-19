import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { verifyAuthToken } from "./userAuth.js";
import { getSafetySettingsFormat } from "../utils/userSettings.js";
import { encodeXText } from "nodemailer/lib/shared/index.js";
import { followUserHelper } from "../services/users.js";
export async function blockUser(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }
    console.log(request.body.blocked_username);
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
      (blockedUser) => blockedUser._id.toString() == userToBlock._id.toString()
    );
    console.log(index);
    let operation = "";
    if (index !== -1) {
      userBlockedList.splice(index, 1);
      console.log("User removed from blocked users.");
      operation = "unblocked";
    } else {
      userBlockedList.push(userToBlock._id);
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
    console.error("Error:", error);
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
    console.log(request.body.reported_username);
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
    console.error("Error:", error);
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
      user.profile_settings[pictureField] = request.body[pictureField];
      await user.save();
      return {
        success: true,
        status: 200,
        msg: `User ${pictureField} added successfully`,
      };
    } else {
      user.profile_settings[pictureField] = "";
      await user.save();
      return {
        success: true,
        status: 200,
        msg: `User ${pictureField} removed successfully`,
      };
    }
  } catch (error) {
    console.error("Error:", error);
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

    const index = userMutedList.indexOf(communityToMute._id);
    let operation = "";
    if (index !== -1) {
      userMutedList.splice(index, 1);
      console.log("Community removed from muted communities.");
      operation = "unmuted";
    } else {
      userMutedList.push(communityToMute._id);
      console.log("Community added to muted communities.");
      operation = "muted";
    }
    user.safety_and_privacy_settings.muted_communities = userMutedList;
    await user.save();
    return {
      success: true,
      status: 200,
      msg: `Communiy ${operation} successfully.`,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    };
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
    }

    // user.following_ids = userFollowingList;
    // await user.save();

    return {
      success: true,
      status: 200,
      msg: `User ${operation} successfully.`,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while following/unfollowing user.",
    };
  }
}

export async function joinCommunity(request, leave = false) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return { success, err, status, user, msg };
    }

    const community = await Community.findOne({
      name: request.body.community_name,
    });
    if (!community) {
      return {
        success: false,
        err: `Community ${request.community_name} Not Found`,
        status: 404,
      };
    }

    if (leave) {
      const index = community.approved_users.indexOf(user._id);
      if (index !== -1) {
        community.approved_users.splice(index, 1);
        await community.save();
      }

      const communityIndex = user.communities.findIndex(
        (c) => c.id.toString() === community._id.toString()
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
      if (!community.banned_users.includes(user._id)) {
        if (!community.approved_users.includes(user._id)) {
          community.approved_users.push(user._id);
          await community.save();
        }

        if (
          !user.communities.some(
            (c) => c.id.toString() === community._id.toString()
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
      } else {
        return {
          success: false,
          status: 400,
          msg: `User ${user.username} is banned from community ${community.name} .`,
        };
      }
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

export async function clearHistory(req) {
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
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while clearing history.",
    };
  }
}
