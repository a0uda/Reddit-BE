import { Community } from "../db/models/Community.js";
import { User } from "../db/models/User.js";
import { Rule } from "../db/models/Rule.js";

async function communityNameExists(communityName) {
  return await Community.findOne({ name: communityName });
}

async function getRuleByTitle(communityName, ruleTitle) {
  //find community by name where rule_title exists and return the community

  return await Community.findOne({
    name: communityName,
    "rules.rule_title": ruleTitle,
  });
}

const getRuleById = async (id) => {
  try {
    console.log(id);
    return await Rule.findById(id);
  } catch (error) {
    return {
      err: { status: 500, message: error.message },
    };
  }
};
const getRemovalReasonById = async (id) => {

  try {
    const community = await Community.findOne({ "removal_reasons._id": id });
    console.log("this one buddered");
    return community.removal_reasons;
  }
  catch (error) {
    return {
      err: { status: 500, message: error.message },
    };
  }
}
const getUsersByIds = async (userIds) => {
  try {
    const users = await User.find({ _id: { $in: userIds } });
    const filteredUsers = users.filter((user) => user !== null);
    return { users: filteredUsers };
  } catch (error) {
    return {
      err: { status: 500, message: error.message },
    };
  }
};

const deleteRule = async (ruleId) => {
  try {
    const deletedRule = await Rule.findByIdAndDelete(ruleId);

    if (!deletedRule) {
      return {
        err: { status: 500, message: "not found" },
      };
    }
    return { success: true };
  } catch (error) {
    return { error: { status: 500, message: error.message } };
  }
};

const getApprovedUserView = async ({ id, approved_at }) => {
  try {
    // Find the user by user ID
    const user = await User.findById(id);

    if (!user) return { error: { status: 400, message: "user not found " } };

    // Extract profile picture and username from the user
    let { profile_picture, username } = user;
    profile_picture = profile_picture || "none";
    return { profile_picture, username, approved_at };
  } catch (error) {
    return { error: { status: 500, message: error.message } };
  }
};

const isUserAlreadyApproved = (community, username) => {
  // Check if the user is already approved where the community :{approved_users:{username,approved_at,picture}
  const approvedUser = community.approved_users.find(
    (user) => user.username === username
  );
  return approvedUser;

};

export {
  isUserAlreadyApproved,
  communityNameExists,
  getRuleByTitle,
  getUsersByIds,
  getRuleById,
  deleteRule,
  getApprovedUserView,
  getRemovalReasonById
};
