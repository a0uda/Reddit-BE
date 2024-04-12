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
/**
 * 
 * @param {Object} requestBody 
 * @param {String} requestBody.username
 * @param {String} requestBody.community_name
 * @param {String} requestBody.action
 * @param {String} requestBody.reason_for_ban
 * @param {String} requestBody.mod_note
 * @param {Boolean} requestBody.permanent_flag
 * @param {String} requestBody.note_for_ban_message
 * @param {Date} requestBody.banned_until
 * 
 * @returns
 * {err: {status: 400, message: "Invalid action."}}
 * {err: {status: 400, message: "Username , community name , action are required."}}
 * {err: {status: 400, message: "Community not found."}}
 * {err: {status: 400, message: "User not found."}}
 * {success:true}
 *@example
 * Input:
 * banUser({
 *  username: "user1",
 * community_name: "community1",
 * action: "ban",
 * reason_for_ban: "spam",
 * })
 * Output:
 * {success:true}
 */
const banUser = async (requestBody) => {
    try {

        var reason_for_ban = undefined, mod_note = undefined, permanent_flag = undefined, note_for_ban_message = undefined, banned_until = undefined;
        const { username, community_name, action } = requestBody;

        if (requestBody.reason_for_ban) {
            reason_for_ban = requestBody.reason_for_ban;
        }
        if (requestBody.mod_note) {
            mod_note = requestBody.mod_note;
        }
        if (requestBody.permanent_flag) {
            permanent_flag = requestBody.permanent_flag;
        }
        if (requestBody.note_for_ban_message) {
            note_for_ban_message = requestBody.note_for_ban_message;
        }
        if (requestBody.banned_until) {
            banned_until = requestBody.banned_until;
        }
        if (action != "ban" && action != "unban") {
            return { err: { status: 400, message: "Invalid action." } };

        }
        if (!username || !community_name || !action) {
            return { err: { status: 400, message: "Username , community name , action are required." } };
        }
        console.log("community name: ", community_name);
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
            community.banned_users.push(
                {
                    username: user.username,
                    banned_date: new Date(),
                    reason_for_ban: reason_for_ban,
                    mod_note: mod_note,
                    permanent_flag: permanent_flag,
                    banned_until: banned_until,
                    note_for_ban_message: note_for_ban_message,
                    profile_picture: user.profile_picture
                }
            );
            await community.save();
            console.log("community banned: ", community.banned_users);
        }
        else if (action == "unban") {
            community.banned_users = community.banned_users.filter((bannedUser) => bannedUser.username !== user.username);
            await community.save();
            console.log("community banned: ", community.banned_users);
        }

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}
/**
 * @param {String} community_name
 * @returns
 * {users: community.banned_users}
 * {err: {status: 400, message: "Community not found."}}
 * {err: {status: 500, message: error.message}}
 * @example
 * Input:
 * getBannedUsers("community1")
 * Output:
 * {users: community.banned_users}
 */
const getBannedUsers = async (community_name) => {
    try {

        const community = await communityNameExists(community_name);

        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        return { users: community.banned_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

//////////////////////////////////////////////////////////////////////// Muted /////////////////////////////////////////////////////////////////////////
/**
 * 
 * @param {Object} request 
 * @property {String} community_name
 * @property {String} action
 * @property {String} reason
 * @property {String} username
 * @returns
 * {success: true}
 * or
 * {err: {status: 400, message: "Community not found."}}
 * or
 * {err: {status: 400, message: "Username not found."}}
 * or
 * {err: {status: 400, message: "Invalid action."}}
 * or
 * {err: {status: 500, message: error.message}}
 * @example
 * input: 
 * const request = {
 *    body: {
 *       community_name: "community1",
 *       action: "mute",
 *       reason: "Spamming",
 *       username: "user1"
 * }
 * }
 
 */
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


/**
 * 
 * @param {String} community_name 
 * @returns
 * {users: muted_users}
 * or
 * {err: {status: 400, message: "Community not found."}}
 * or
 * {err: {status: 500, message: error.message}}
 * @example
 * input: "community1"
 * output:
 * {
 *   users: [
 *    {
 *     username: "user1",
 *     muted_by_username: "user2",
 *     mute_date: "2021-08-01T00:00:00.000Z",
 *     mute_reason: "Spamming",
 *     profile_picture: "none"
 * }
 * ]
 * }
 * 
 * @returns 
 */

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
        // Check if user username  already exists in the approved_users array of the community
        const isAlreadyApproved = isUserAlreadyApproved(community, user.username);
        if (isAlreadyApproved) {
            return {
                err: {
                    status: 400,
                    message: "User is already approved in this community.",
                },
            };
        }

        community.approved_users.push({ username: user.username, approved_at: new Date(), profile_picture: user.profile_picture });
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
        const approved_users = community.approved_users;
        return { users: approved_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////////////////////////////////////////////// Moderators //////////////////////////////////////////////////////////////
/**
 * @param {Object} requestBody 
 * @property {String} community_name
 * @property {String} username
 * @property {Object} has_access
 * @property {Boolean} has_access.post
 * @property {Boolean} has_access.everything
 * @property {Boolean} has_access.manage_users
 * @property {Boolean} has_access.manage_settings
 * @property {Boolean} has_access.manage_posts_and_comments
 * @returns
 * {success: true}
 * or
 * {err: {status: 400, message: "Community not found."}}
 * or
 * {err: {status: 400, message: "User not found."}}
 * or
 * {err: {status: 400, message: "User is already a moderator of the community."}}
 * or
 * {err: {status: 500, message: error.message}}
 * @returns 
 */
const addModerator = async (requestBody) => {
    //TODO: INVITATION EMAIL SHOULD BE SENT TO THE USER
    try {
        const { community_name, username, has_access } = requestBody;

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
        const isModerator = community.moderators.some((moderator) => moderator.username === username);
        if (isModerator) {
            return { err: { status: 400, message: "User is already a moderator of the community." } };
        }

        // Add the user as a moderator to the community
        community.moderators.push({
            username: user.username,
            profile_picture: user.profile_picture,
            moderator_since: new Date(),
            has_access: {
                everything: has_access.everything,
                manage_users: has_access.manage_users,
                manage_settings: has_access.manage_settings,
                manage_posts_and_comments: has_access.manage_posts_and_comments,
            },
        });
        // Save the updated community
        await community.save();
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
/**
 * 
 * @param {String} community_name 
 * @returns
 * {moderators: [
 * {username: "user1", profile_picture: "profile_picture1", moderator_since: "2021-09-01T00:00:00.000Z"},
 * {username: "user2", profile_picture: "profile_picture2", moderator_since: "2021-09-01T00:00:00.000Z"},
 * ]}
 * or
 * {err: {status: 500, message: error.message}}
 * or
 * {err: {status: 500, message: "Community not found."}}
 * @example
 * input:
 * const community_name = "community1"
 * @example
 * Output:
 * {
 * moderators: [
 * {username: "user1", profile_picture: "profile_picture1", moderator_since: "2021-09-01T00:00:00.000Z"},
 * {username: "user2", profile_picture: "profile_picture2", moderator_since: "2021-09-01T00:00:00.000Z"},
 * ]
 */
const getModerators = async (community_name) => {

    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "Community not found." },
            };
        }
        const moderators = [];
        community.moderators.forEach((moderator) => {
            moderators.push({
                username: moderator.username,
                profile_picture: moderator.profile_picture,
                moderator_since: moderator.moderator_since,
            });
        });
        return { moderators };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
/**
 * @param {Object} requestBody
 * @property {String} community_name
 * @property {String} username
 * @returns
 * {success: true}
 * or
 * {err: {status: 400, message: "Community not found."}}
 * or
 * {err: {status: 400, message: "User not found."}}
 * or
 * {err: {status: 400, message: "User is not a moderator of the community."}}
 * or
 * {err: {status: 500, message: error.message}}
 * @example
 * input:
 * const requestBody = {
 * community_name: "community1",
 * username: "user1"
 * }
 * @example
 * Output:
 * {success: true}
 * 
*/
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
        const moderatorIndex = community.moderators.findIndex(moderator => moderator.username == (user.username));
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
/**
 * @param {Object} request
 * @property {Object} request.body
 * @property {String} request.body.community_name
 * @returns
 * {success: true}
 * or
 * {err: {status: 400, message: "Community not found."}}
 * or
 * {err: {status: 400, message: "User is not a moderator of the community."}}
 * or
 * {err: {status: 500, message: error.message}}
 * @example
 * input:
 * const request = {
 * body: {
 * community_name: "community1"
 * }
 * }
 * @example
 * Output:
 * {success: true}

 */
const moderatorLeaveCommunity = async (request) => {
    //use verify token to get the username
    console.log(request)
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
        //return error in auth token
        return { err: { status: status, message: msg } };
    }
    const { community_name } = request.body;
    console.log("community_name")
    console.log(community_name);
    const { username } = user;
    try {
        const community = await Community.findOne({ name: community_name });
        if (!community) {
            return { err: { status: 404, message: "Community not found." } };
        }
        const moderatorIndex = community.moderators.findIndex(moderator => moderator.username == (username));
        if (moderatorIndex === -1) {
            return { err: { status: 400, message: "User is not a moderator of the community." } };
        }
        community.moderators.splice(moderatorIndex, 1);
        await community.save();
        return { success: true };
    }
    catch (error) {
        return { err: { status: 500, message: error.message } };
    }



}

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
    moderatorLeaveCommunity,

    getAllUsers,
};