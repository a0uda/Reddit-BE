// Mod Tools --> Overview --> User Management --> (Banned, Muted, Approved, Moderators) Users

import { verifyAuthToken } from "../controller/userAuth.js";
import { Community } from "../db/models/Community.js";
import { User } from "../db/models/User.js"; //delete this line

import {
    isUserAlreadyApproved,
    communityNameExists,
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
const banUser = async (request) => {
    try {
        const {
            username,
            community_name,
            action,
            reason_for_ban = undefined,
            mod_note = undefined,
            permanent_flag = undefined,
            note_for_ban_message = undefined,
            banned_until = undefined,
        } = request.body;
        const {
            success,
            err,
            status,
            user: banningUser,
            msg,
        } = await verifyAuthToken(request);
        console.log("banninguser: ", banningUser);

        if (!banningUser) {
            return { success, err, status, banningUser, msg };
        }
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const user = await User.findOne({ username: username });
        if (!user) {
            return { err: { status: 400, message: "Username not found." } };
        }
        const moderators = community.moderators;
        console.log("moderators: ", moderators);
        // search if  mutingUser username exists in moderators .username
        const isModerator = moderators.some(
            (moderator) => moderator.username === banningUser.username
        );
        console.log("isModerator: ", isModerator);

        if (!isModerator) {
            return {
                err: {
                    status: 400,
                    message: "You are not a moderator in this community",
                },
            };
        }
        //get the community.moderator object of the muting user
        const moderator = community.moderators.find(
            (moderator) => moderator.username === banningUser.username
        );
        //check if moderator object is allowed to mute

        if (
            !moderator.has_access.everything &&
            !moderator.has_access.manage_users
        ) {
            return {
                err: {
                    status: 400,
                    message: "You are not allowed to ban/unban  users. permission denied",
                },
            };
        }
        if (action == "ban") {
            if (!community.banned_users) {
                community.banned_users = [];
            }
            community.banned_users.push({
                username: user.username,
                banned_date: new Date(),
                reason_for_ban: reason_for_ban,
                mod_note: mod_note,
                permanent_flag: permanent_flag,
                banned_until: banned_until,
                note_for_ban_message: note_for_ban_message,
            });
            await community.save();
        } else if (action == "unban") {
            community.banned_users = community.banned_users.filter(
                (bannedUser) => bannedUser.username !== user.username
            );
            await community.save();
        }

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

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
        const returned_banned_users = [];
        for (let i = 0; i < community.banned_users.length; i++) {
            const user = await User.findOne({
                username: community.banned_users[i].username,
            });
            if (user) {
                returned_banned_users.push({
                    username: user.username,
                    banned_date: community.banned_users[i].banned_date,
                    reason_for_ban: community.banned_users[i].reason_for_ban,
                    mod_note: community.banned_users[i].mod_note,
                    permanent_flag: community.banned_users[i].permanent_flag,
                    banned_until: community.banned_users[i].banned_until,
                    note_for_ban_message: community.banned_users[i].note_for_ban_message,
                    profile_picture: user.profile_picture,
                });
            }
        }
        return { users: returned_banned_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
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
        const {
            success,
            err,
            status,
            user: mutingUser,
            msg,
        } = await verifyAuthToken(request);
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
            const moderators = community.moderators;
            console.log("moderators: ", moderators);
            // search if  mutingUser username exists in moderators .username
            const isModerator = moderators.some(
                (moderator) => moderator.username === mutingUser.username
            );
            console.log("isModerator: ", isModerator);
            if (!isModerator) {
                return {
                    err: {
                        status: 400,
                        message: "You are not a moderator in this community",
                    },
                };
            }

            //get the community.moderator object of the muting user
            const moderator = community.moderators.find(
                (moderator) => moderator.username === mutingUser.username
            );
            //check if moderator object is allowed to mute
            if (
                !moderator.has_access.everything && //modify permissions 
                !moderator.has_access.manage_users
            ) {
                return {
                    err: {
                        status: 400,
                        message:
                            "You are not allowed to mute/unmute  users. permission denied",
                    },
                };
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
                });
            } else if (action === "unmute") {
                // Filter out the user ID from muted_users array
                community.muted_users = community.muted_users.filter(
                    (mutedUser) => mutedUser.username != user.username
                );
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
};
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
        const muted_users = community.muted_users;
        const returned_muted_users = [];
        for (let i = 0; i < muted_users.length; i++) {
            const user = await User.findOne({ username: muted_users[i].username });
            returned_muted_users.push({
                username: user.username,
                muted_by_username: muted_users[i].muted_by_username,
                mute_date: muted_users[i].mute_date,
                mute_reason: muted_users[i].mute_reason,
                profile_picture: user.profile_picture,
            });
        }
        return { users: returned_muted_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

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
const approveUser = async (request) => {
    try {
        const { username, community_name } = request.body;
        //use auth token to verify user
        const {
            success,
            err,
            status,
            user: approvingUser,
            msg,
        } = await verifyAuthToken(request);
        if (!approvingUser) {
            return { success, err, status, approvingUser, msg };
        }

        const user_to_be_approved = await User.findOne({ username: username });
        if (!user_to_be_approved) {
            return { err: { status: 400, message: "Username not found." } };
        }
        console.log("community_name: ", community_name);

        const community = await communityNameExists(community_name);
        console.log("community: ", community);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const moderators = community.moderators;
        console.log("moderators: ", moderators);
        // search if  approvingUser username exists in moderators .username
        const isModerator = moderators.some(
            (moderator) => moderator.username === approvingUser.username
        );
        if (!isModerator) {
            return {
                err: {
                    status: 400,
                    message: "You are not a moderator in this community",
                },
            };
        }

        //get the community.moderator object of the muting user
        const moderator = community.moderators.find(
            (moderator) => moderator.username === approvingUser.username
        );
        console.log("moderator: ", moderator);
        //check if moderator object is allowed to mute
        if (
            !moderator.has_access.everything &&
            !moderator.has_access.manage_users
        ) {
            return {
                err: {
                    status: 400,
                    message: "You are not allowed to approve users. permission denied",
                },
            };
        }
        // Check if user username  already exists in the approved_users array of the community
        const isAlreadyApproved = isUserAlreadyApproved(
            community,
            user_to_be_approved.username
        );
        if (isAlreadyApproved) {
            return {
                err: {
                    status: 400,
                    message: "User is already approved in this community.",
                },
            };
        }
        community.approved_users.push({
            username: user_to_be_approved.username,
            approved_at: new Date(),
        });
        await community.save();
        console.log(community.approved_users);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//unapprove user
const unapproveUser = async (request) => {
    try {
        const { username, community_name } = request.body;
        //use auth token to verify user
        const {
            success,
            err,
            status,
            user: approvingUser,
            msg,
        } = await verifyAuthToken(request);
        if (!approvingUser) {
            return { success, err, status, approvingUser, msg };
        }

        const user_to_be_unapproved = await User.findOne({ username: username });
        if (!user_to_be_unapproved) {
            return { err: { status: 400, message: "Username not found." } };
        }
        console.log("community_name: ", community_name);

        const community = await communityNameExists(community_name);
        console.log("community: ", community);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const moderators = community.moderators;
        console.log("moderators: ", moderators);
        // search if  approvingUser username exists in moderators .username
        const isModerator = moderators.some(
            (moderator) => moderator.username === approvingUser.username
        );
        if (!isModerator) {
            return {
                err: {
                    status: 400,
                    message: "You are not a moderator in this community",
                },
            };
        }

        //get the community.moderator object of the muting user
        const moderator = community.moderators.find(
            (moderator) => moderator.username === approvingUser.username
        );
        console.log("moderator: ", moderator);
        //check if moderator object is allowed to mute
        if (
            !moderator.has_access.everything &&
            !moderator.has_access.manage_users
        ) {
            return {
                err: {
                    status: 400,
                    message: "You are not allowed to unapprove users. permission denied",
                },
            };
        }
        // Check if user username  already exists in the approved_users array of the community
        const isAlreadyApproved = isUserAlreadyApproved(
            community,
            user_to_be_unapproved.username
        );
        if (!isAlreadyApproved) {
            return {
                err: {
                    status: 400,
                    message: "User is not approved in this community.",
                },
            };
        }
        //get the approved_user object of the user to be unapproved
        const approved_user = community.approved_users.find(
            (user) => user.username === user_to_be_unapproved.username
        );
        //get the index of the approved_user object in the approved_users array
        const index = community.approved_users.indexOf(approved_user);
        //remove the approved_user object from the approved_users array
        community.approved_users.splice(index, 1);
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
                err: { status: 400, message: "Community not found." },
            };
        }
        const approved_users = community.approved_users;
        //loop through the approved_users array and get the user object of each user
        const returned_approved_users = [];
        for (let i = 0; i < approved_users.length; i++) {
            const user = await User.findOne({ username: approved_users[i].username });
            console.log(user)
            returned_approved_users.push({
                username: user.username,
                approved_at: approved_users[i].approved_at,
                profile_picture: user.profile_picture
            });


        }
        return { users: returned_approved_users };
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
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return { err: { status: 400, message: "User not found." } };
        }

        // Check if the user is already a moderator of the community
        const isModerator = community.moderators.some(
            (moderator) => moderator.username === username
        );
        if (isModerator) {
            return {
                err: {
                    status: 400,
                    message: "User is already a moderator of the community.",
                },
            };
        }
        community.moderators.push({
            username: user.username,
            moderator_since: new Date(),
            has_access: {
                everything: has_access.everything,
                manage_users: has_access.manage_users,
                manage_settings: has_access.manage_settings,
                manage_posts_and_comments: has_access.manage_posts_and_comments,
            },
        });

        // Save the updated community
        console.log("saving community");
        await community.save();
        console.log("saved")
        //add community id to user moderated communities
        user.moderated_communities.push({
            id: community._id,
            favorite_flag: false,
        });
        await user.save();

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
//all moderators
const getModerators = async (community_name) => {
    console.log("getModerators start");
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 400, message: "Community not found." },
            };
        }
        const moderators = community.moderators;
        //console.log("community.moderators", moderators);
        const returned_moderators = [];
        console.log("length")
        console.log(moderators.length)
        for (let i = 0; i < moderators.length; i++) {
            //get the user object from the user collection where username is the moderator's username
            const user = await User.findOne({ username: moderators[i].username });
            console.log("user", user);
            returned_moderators.push({
                username: moderators[i].username,
                profile_picture: user.profile_picture,
                moderator_since: moderators[i].moderator_since,
                has_access: moderators[i].has_access,
            })
        }
        console.log("getModerators end");
        return { returned_moderators };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
const getModeratorsSortedByDate = async (request) => {
    try {
        //verify the auth token
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user) {
            return { err: { status: status, message: msg } };
        }
        //check if the community exists
        const community = await communityNameExists(request.params.community_name);
        if (!community) {
            return {
                err: { status: 400, message: "Community not found." },
            };
        }
        //get the moderator element from moderators array where username is the user's username
        const moderator = community.moderators.find((moderator) => moderator.username === user.username);
        if (!moderator) {
            return {
                err: { status: 400, message: "User is not a moderator of the community." },
            };
        }
        const returned_moderators = [];
        //get the moderators array
        const moderators = community.moderators;
        //sort the moderators array by moderator_since date
        moderators.sort((a, b) => {
            return new Date(b.moderator_since) - new Date(a.moderator_since);
        }
        );
        for (let i = 0; i < moderators.length; i++) {
            //get the user object from the user collection where username is the moderator's username
            const user = await User.findOne({ username: moderators[i].username });
            returned_moderators.push({
                username: moderators[i].username,
                profile_picture: user.profile_picture,
                moderator_since: moderators[i].moderator_since,
                has_access: moderators[i].has_access,
            })
        }
        return { returned_moderators };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }

};

const getEditableModerators = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user) {
            return { err: { status: status, message: msg } };
        }
        const community = await communityNameExists(request.params.community_name);
        if (!community) {
            return {
                err: { status: 400, message: "Community not found." },
            };
        }
        //get the moderator element from moderators array where username is the user's username
        const moderator = community.moderators.find((moderator) => moderator.username === user.username);
        if (!moderator) {
            return {
                err: { status: 400, message: "User is not a moderator of the community." },
            };
        }
        const editableModerators = [];

        for (let i = 0; i < community.moderators.length; i++) {
            //get the user object from the user collection where username is the moderator's username
            const user = await User.findOne({
                username: community.moderators[i].username,
            });
            if (community.moderators[i].moderator_since > moderator.moderator_since) {
                editableModerators.push({
                    username: community.moderators[i].username,
                    profile_picture: user.profile_picture,
                    moderator_since: community.moderators[i].moderator_since,
                    has_access: community.moderators[i].has_access,
                });
            }
        }
        //remove has_access from each moderator
        return { editableModerators };
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
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return { err: { status: 400, message: "User not found." } };
        }

        // Check if the user is a moderator of the community
        const moderatorIndex = community.moderators.findIndex(
            (moderator) => moderator.username == user.username
        );
        if (moderatorIndex === -1) {
            return {
                err: {
                    status: 400,
                    message: "User is not a moderator of the community.",
                },
            };
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

    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
        //return error in auth token
        return { err: { status: status, message: msg } };
    }
    const { community_name } = request.body;

    const { username } = user;
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
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
    getEditableModerators,
    getModeratorsSortedByDate,
    unapproveUser,
    getAllUsers
};

