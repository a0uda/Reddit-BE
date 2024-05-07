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


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// According to the flags in the moderation_details attribute in the post model,
// determine whether or not the post should be visible to anyone
// regardless of the usual listing rules that depend on the relation between users and the community settings.

// If the flag is true in (reported, spammed, removed) then it will not be visible

// moderator_details: {
//   unmoderated: {
//     approved: {
//       flag: { type: Boolean, default: false },
//       by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       date: { type: Date },
//     },

//     any_action_taken: { type: Boolean, default: false },
//   },

//   reported: {
//     flag: { type: Boolean, default: false },
//     by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     date: { type: Date },
//     type: { type: String, default: null },

//     confirmed: { type: Boolean, default: false },
//   },

//   spammed: {
//     flag: { type: Boolean, default: false },
//     by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     date: { type: Date },
//     type: { type: String, default: null },

//     confirmed: { type: Boolean, default: false },
//   },

//   removed: {
//     flag: { type: Boolean, default: false },
//     by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     date: { type: Date, default: null },
//     type: { type: String, default: null },

//     confirmed: { type: Boolean, default: false },
//   },

//   edit_history: [
//     {
//       edited_at: { type: Date, default: null},
//       approved_edit_flag: { type: Boolean, default: false },
//       removed_edit_flag: { type: Boolean, default: false },
//     },
//   ],
// },

const isCommunityPostVisible = (community, post) => {
  
}

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
