// Mod Tools --> Overview --> User Management --> (Banned, Muted, Approved, Moderators) Users

import { Community } from "../db/models/Community.js";
import { User } from "../db/models/User.js"; //delete this line

import {
  isUserAlreadyApproved,
  communityNameExists,
  getUsersByIds,
  getApprovedUserView,
} from "../utils/communities.js";

//////////////////////////////////////////////////////////////////////// Banned /////////////////////////////////////////////////////////////////////////
const banUser = async (requestBody) => {
    try {
        const { username, community_name, action } = requestBody;
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const user = await User.findOne({ username: username });
        if (!user) {
            return { err: { status: 400, message: "Username not found." } };
        }
        if (action == "ban") {
            if (!community.banned_users) {
                community.banned_users = [];
            }
            community.banned_users.push(user._id);
            await community.save();
        }
        else if (action == "unban") {
            console.log(user._id.toString())
            console.log(community.banned_users[0]._id.toString())
            community.banned_users = community.banned_users.filter((id) => id.toString() !== user._id.toString());
            await community.save();
        }
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

const getBannedUsers = async (community_name) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const banned_users_ids = community.banned_users;
        const banned_users = await getUsersByIds(banned_users_ids);
        return { users: banned_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

//////////////////////////////////////////////////////////////////////// Muted /////////////////////////////////////////////////////////////////////////
const muteUser = async (requestBody) => {
    try {
        const { username, community_name, action } = requestBody;
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const user = await User.findOne({ username: username });
        if (!user) {
            return { err: { status: 400, message: "Username not found." } };
        }

        if (action == "mute") {
            if (!community.muted_users) {
                community.muted_users = [];
            }
            community.muted_users.push(user._id);
            await community.save();

        }
        else if (action == "unmute") {
            console.log("before filter")
            console.log(community.muted_users);
            //delete from muted users id where username is equal to the username in the request body
            community.muted_users = community.muted_users.filter((id) => id.toString() !== user._id.toString());
            await community.save();
            console.log("after filter")
            console.log(community.muted_users);
        }
        return { success: true };
    }
    catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

// TODO: I cant find this feature in reddit , i dont know what is the exact attributes we need to return here
const getMutedUsers = async (community_name) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        console.log(community)
        const muted_users_ids = community.muted_users;
        const muted_users = await getUsersByIds(muted_users_ids);
        console.log(muted_users);
        return { users: muted_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

//////////////////////////////////////////////////////////////////////// Approved /////////////////////////////////////////////////////////////////////////
// TODO: Validation - User already approved.
const approveUser = async (requestBody) => {
    try {
        const { username, community_name } = requestBody;
        console.log(username, community_name);

        const user = await User.findOne({ username: username });
        if (!user) {
            return { err: { status: 400, message: "Username not found." } };
        }

        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        console.log(community);
        // Check if user ID already exists in the approved_users array of the community
        const isAlreadyApproved = isUserAlreadyApproved(community, user._id);
        if (isAlreadyApproved) {
            return {
                err: {
                    status: 400,
                    message: "User is already approved in this community.",
                },
            };
        }

        community.approved_users.push({ id: user._id, approved_at: new Date() });
        await community.save();
        console.log(community.approved_users);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//Profile picture is not showing
const getApprovedUsers = async (community_name) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }

        // Fetch user views for each approved user
        const users = await Promise.all(
            community.approved_users.map(async (userObj) => {
                const userView = await getApprovedUserView({
                    id: userObj.id,
                    approved_at: userObj.approved_at,
                });
                return userView;
            })
        );

        console.log(users);

        return { users }; // Return the users array
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////////////////////////////////////////////// Moderators //////////////////////////////////////////////////////////////
const addModerator = async (requestBody) => {
    try {
        const { community_name, username } = requestBody;

        // Find the community by name
        const community = await Community.findOne({ name: community_name });
        if (!community) {
            return { err: { status: 404, message: "Community not found." } };
        }

        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return { err: { status: 404, message: "User not found." } };
        }

        // Check if the user is already a moderator of the community
        const isModerator = community.moderators.some(moderator => moderator._id.equals(user._id));
        if (isModerator) {
            return { err: { status: 400, message: "User is already a moderator of the community." } };
        }

        // Add the user as a moderator to the community
        community.moderators.push({
            _id: user._id,
            moderator_since: new Date() // Set the moderator_since date to current date
        });

        // Save the updated community
        await community.save();

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const getModerators = async (community_name) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "Community not found." },
            };
        }
        const moderators = [];
        // Iterate over the moderators array
        for (const moderator of community.moderators) {
            // Retrieve the moderator user from the User schema
            const user = await User.findById(moderator._id);
            if (user) {
                // Extract desired fields from the user object
                const { profile_picture, username } = user;
                const moderated_since = moderator.moderator_since;
                // Add moderator data to the moderators array
                moderators.push({ profile_picture, username, moderated_since });
            }
        }
        return { moderators };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//delete moderator
const deleteModerator = async (requestBody) => {
    try {
        const { community_name, username } = requestBody;

        // Find the community by name
        const community = await Community.findOne({ name: community_name });
        if (!community) {
            return { err: { status: 404, message: "Community not found." } };
        }

        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return { err: { status: 404, message: "User not found." } };
        }

        // Check if the user is a moderator of the community
        const moderatorIndex = community.moderators.findIndex(moderator => moderator._id.equals(user._id));
        if (moderatorIndex === -1) {
            return { err: { status: 400, message: "User is not a moderator of the community." } };
        }

        // Remove the user from the moderators array
        community.moderators.splice(moderatorIndex, 1);

        // Save the updated community
        await community.save();

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};


//////////////////////////////////////////////////////////////////////// Get All Users //////////////////////////////////////////////////////////////
const getAllUsers = async () => {
    try {
        const users = await User.find({});
        return { users: users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

export {
    banUser,
    getBannedUsers,

    muteUser,
    getMutedUsers,

    approveUser,
    getApprovedUsers,

    addModerator,
    getModerators,
    deleteModerator,

    getAllUsers,
};