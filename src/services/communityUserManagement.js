// Mod Tools --> Overview --> User Management --> (Banned, Muted, Approved, Moderators) Users

import { verifyAuthToken } from "../controller/userAuth.js";
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

const muteUser = async (request) => {
    try {
        // Verify auth token and get mutingUser
        const { success, err, status, user: mutingUser, msg } = await verifyAuthToken(request);
        if (!mutingUser) {
            return { success, err, status, mutingUser, msg };
        }
        // Extract request parameters
        const { community_name, action, reason, username } = request.body;
        // Check if the action is mute or unmute
        if (action === "mute" || action === "unmute") {
            // Find the community
            const community = await communityNameExists(community_name);
            if (!community) {
                return { err: { status: 400, message: "Community not found." } };
            }
            // Find the user to mute/unmute
            const user = await User.findOne({ username: username });
            if (!user) {
                return { err: { status: 400, message: "Username not found." } };
            }
            // Perform mute or unmute action
            if (action === "mute") {
                if (!community.muted_users) {
                    community.muted_users = [];
                }
                // Push muting user's ID, mute date, and reason to muted_users array
                community.muted_users.push({
                    username: user.username,
                    muted_by_username: mutingUser.username,
                    mute_date: new Date(),
                    mute_reason: reason,
                    profile_picture: user.profile_picture || "none"
                });

            } else if (action === "unmute") {
                // Filter out the user ID from muted_users array
                community.muted_users = community.muted_users.filter(mutedUser => mutedUser.username != user.username);
            }

            // Save the updated community
            await community.save();
            // console.log(community.muted_users)
            return { success: true };
        } else {
            return { err: { status: 400, message: "Invalid action." } };
        }
    } catch (error) {
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
        console.log("this is muted users:")
        console.log(community.muted_users)
        const muted_users = community.muted_users;

        return { users: muted_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

//////////////////////////////////////////////////////////////////////// Approved /////////////////////////////////////////////////////////////////////////
// TODO: Validation - User already approved.
/**
 * 
 * @param {Object} requestBody
 * @property {String} username
 * @property {String} community_name
 * @returns
 * {success: true}
 * or
 * {err: {status: 400, message: "Username not found."}}
 * or 
 * {err: {status: 400, message: "Community not found."}}
 * @example 
 * input:
 * const requestBody = {
 * username: "user1",
 * community_name: "community1"
 * }
 * @example
 * Output:
 * {success: true}
 */
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

/**
 * 
 * @param {String} community_name 
 * @returns {Object} 
 * @property {Array} users
 * @example
 * input:
 * const community_name = "community1"
 * @example
 * Output:
 * {
 * users: [
 * {username: "user1", approved_at: "2021-09-01T00:00:00.000Z"},
 * {username: "user2", approved_at: "2021-09-01T00:00:00.000Z"},
 * ]
 * }
 */
const getApprovedUsers = async (community_name) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "Community not found." },
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