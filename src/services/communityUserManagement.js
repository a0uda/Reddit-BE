// Mod Tools --> Overview --> User Management --> (Banned, Muted, Approved, Moderators) Users
/**
 * @module community/services/communityUserManagement
 */
import { verifyAuthToken } from "../controller/userAuth.js";
import { Community } from "../db/models/Community.js";
import { Message } from "../db/models/Message.js";
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
 * @returns {Object}
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
            success,
            err,
            status,
            user: banningUser,
            msg,
        } = await verifyAuthToken(request);


        if (!banningUser) {
            return { success, err, status, banningUser, msg };
        }
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
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const user = await User.findOne({ username: username });
        if (!user) {
            return { err: { status: 400, message: "Username not found." } };
        }
        const moderators = community.moderators;

        // search if  mutingUser username exists in moderators .username
        const isModerator = moderators.some(
            (moderator) => moderator.username === banningUser.username
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
            //check if user is already banned
            const isUserAlreadyBanned = community.banned_users.some(
                (bannedUser) => bannedUser.username === user.username
            );
            if (isUserAlreadyBanned) {
                return {
                    err: {
                        status: 400,
                        message: "User is already banned in this community",
                    },
                };
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
            let string_message = `You have been banned from r/${community_name} for ${reason_for_ban} for ${banned_until} days`;
            await community.save();

            const message = new Message({
                sender_id: banningUser._id,
                sender_via_id: community._id,
                sender_type: "moderator",
                receiver_id: user._id,
                receiver_type: "user",
                message: string_message,
                subject: "You are banned from /r/ " + community_name,

            });
            await message.save();

        } else if (action == "unban") {
            community.banned_users = community.banned_users.filter(
                (bannedUser) => bannedUser.username !== user.username
            );
            let string_message = `Congrats! You have been unbanned from r/${community_name}`;
            const message = new Message({
                sender_id: banningUser._id,
                sender_via_id: community._id,
                sender_type: "moderator",
                receiver_id: user._id,
                receiver_type: "user",
                message: string_message,
                subject: "You are unbanned from /r/ " + community_name,
            });
            await community.save();
            await message.save();
        }

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const editBannedUser = async (request) => {
    try {
        const {
            success,
            err,
            status,
            user: editingUser,
            msg,
        } = await verifyAuthToken(request);
        if (!editingUser) {
            return { success, err, status, editingUser, msg };
        }
        const {
            username,
            community_name,
            newDetails,
        } = request.body;



        const community = await communityNameExists(community_name);

        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        const moderators = community.moderators;

        const isModerator = moderators.some(
            (moderator) => moderator.username === editingUser.username
        );

        if (!isModerator) {
            return {
                err: {
                    status: 400,
                    message: "You are not a moderator in this community",
                },
            };
        }

        const moderator = community.moderators.find(
            (moderator) => moderator.username === editingUser.username
        );

        if (
            !moderator.has_access.everything &&
            !moderator.has_access.manage_users
        ) {
            return {
                err: {
                    status: 400,
                    message: "You are not allowed to edit banned users. Permission denied",
                },
            };
        }

        const user = await User.findOne({ username: username });

        if (!user) {
            return { err: { status: 400, message: "Username not found." } };
        }

        const bannedUserIndex = community.banned_users.findIndex(
            (bannedUser) => bannedUser.username === user.username
        );

        if (bannedUserIndex === -1) {
            return {
                err: {
                    status: 400,
                    message: "User is not banned in this community",
                },
            };
        }

        // Update the banned user details
        Object.assign(community.banned_users[bannedUserIndex], newDetails);
        await community.save();

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

/**
 * @param {String} community_name
 * @returns {Object}
 * {users: community.banned_users}
 * {err: {status: 400, message: "Community not found."}}
 * {err: {status: 500, message: error.message}}
 * @example
 * Input:
 * getBannedUsers("community1")
 * Output:
 * {users: community.banned_users}
 */
const getBannedUsers = async (community_name, pageNumber = 1, pageSizeNumber = 100) => {
    try {
        const community = await communityNameExists(community_name);

        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        const banned_users = community.banned_users;

        // Calculate pagination offsets
        const startIndex = (pageNumber - 1) * pageSizeNumber;
        let endIndex = pageNumber * pageSizeNumber;

        // Adjust endIndex if it exceeds the length of the banned_users array
        if (endIndex > banned_users.length) {
            endIndex = banned_users.length;
        }


        // Slice the banned users array based on pagination parameters
        const paginatedBannedUsers = banned_users.slice(startIndex, endIndex);
        const returned_banned_users = [];
        for (let i = 0; i < paginatedBannedUsers.length; i++) {
            const user = await User.findOne({ username: paginatedBannedUsers[i].username });
            if (user) {
                returned_banned_users.push({
                    username: user.username,
                    banned_date: paginatedBannedUsers[i].banned_date,
                    reason_for_ban: paginatedBannedUsers[i].reason_for_ban,
                    mod_note: paginatedBannedUsers[i].mod_note,
                    permanent_flag: paginatedBannedUsers[i].permanent_flag,
                    banned_until: paginatedBannedUsers[i].banned_until,
                    note_for_ban_message: paginatedBannedUsers[i].note_for_ban_message,
                    profile_picture: user.profile_picture,
                });
            }
        }
        return { users: returned_banned_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

// const getBannedUsers = async (community_name, pageNumber, pageSizeNumber) => {
//     try {
//         const community = await communityNameExists(community_name);

//         if (!community) {
//             return { err: { status: 400, message: "Community not found." } };
//         }

//         const banned_users = community.banned_users;

//         // Calculate pagination offsets
//         const startIndex = (pageNumber - 1) * pageSizeNumber;
//         const endIndex = pageNumber * pageSizeNumber;

//         // Slice the banned users array based on pagination parameters
//         const paginatedBannedUsers = banned_users.slice(startIndex, endIndex);

//         const returned_banned_users = [];
//         for (let i = 0; i < paginatedBannedUsers.length; i++) {
//             const user = await User.findOne({ username: paginatedBannedUsers[i].username });
//             if (user) {
//                 returned_banned_users.push({
//                     username: user.username,
//                     banned_date: paginatedBannedUsers[i].banned_date,
//                     reason_for_ban: paginatedBannedUsers[i].reason_for_ban,
//                     mod_note: paginatedBannedUsers[i].mod_note,
//                     permanent_flag: paginatedBannedUsers[i].permanent_flag,
//                     banned_until: paginatedBannedUsers[i].banned_until,
//                     note_for_ban_message: paginatedBannedUsers[i].note_for_ban_message,
//                     profile_picture: user.profile_picture,
//                 });
//             }
//         }
//         return { users: returned_banned_users };
//     } catch (error) {
//         return { err: { status: 500, message: error.message } };
//     }
// };

//////////////////////////////////////////////////////////////////////// Muted /////////////////////////////////////////////////////////////////////////
/**
 * 
 * @param {Object} request 
 * @property {String} community_name
 * @property {String} action
 * @property {String} reason
 * @property {String} username
 * @returns {Object}
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

            // search if  mutingUser username exists in moderators .username
            const isModerator = moderators.some(
                (moderator) => moderator.username === mutingUser.username
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

                // Push muting user's ID, mute date, and reason to muted_users array
                community.muted_users.push({
                    username: user.username,
                    muted_by_username: mutingUser.username,
                    mute_date: new Date(),
                    mute_reason: reason,
                });
                const message = new Message({
                    sender_id: mutingUser._id,
                    sender_via_id: community._id,
                    sender_type: "moderator",
                    receiver_id: user._id,
                    receiver_type: "user",
                    message: "you have been muted temporarily from  r/" + community_name + " .you will not be able to messasge the moderators of r/" + community_name + " for 3 days.",
                    subject: "You have been muted from /r/ " + community_name,
                });
            } else if (action === "unmute") {
                // Filter out the user ID from muted_users array
                community.muted_users = community.muted_users.filter(
                    (mutedUser) => mutedUser.username != user.username
                );
            }

            // Save the updated community
            await community.save();
            const message = new Message({
                sender_id: mutingUser._id,
                sender_via_id: community._id,
                sender_type: "moderator",
                receiver_id: user._id,
                receiver_type: "user",
                message: "you have been unmuted from r/" + community_name + ". you can now message the moderators of r/" + community_name + " .",
                subject: "Congrats ! You have been unmuted from /r/ " + community_name,


            });
            await message.save();

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
 * @returns {Object}
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
 * @returns {Object}
 */
const getMutedUsers = async (community_name, pageNumber, pageSizeNumber) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        const muted_users = community.muted_users;

        // Calculate pagination offsets
        const startIndex = (pageNumber - 1) * pageSizeNumber;
        const endIndex = pageNumber * pageSizeNumber;

        // Slice the muted users array based on pagination parameters
        const paginatedMutedUsers = muted_users.slice(startIndex, endIndex);

        const returned_muted_users = [];
        for (let i = 0; i < paginatedMutedUsers.length; i++) {
            const user = await User.findOne({ username: paginatedMutedUsers[i].username });
            if (user) {
                returned_muted_users.push({
                    username: user.username,
                    muted_by_username: paginatedMutedUsers[i].muted_by_username,
                    mute_date: paginatedMutedUsers[i].mute_date,
                    mute_reason: paginatedMutedUsers[i].mute_reason,
                    profile_picture: user.profile_picture,
                });
            }
        }

        return { users: returned_muted_users };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};


//////////////////////////////////////////////////////////////////////// Approved /////////////////////////////////////////////////////////////////////////

/**
 *
 * @param {Object} requestBody
 * @property {String} username
 * @property {String} community_name
 * @returns {Object}
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

        const { username, community_name } = request.body;
        const user_to_be_approved = await User.findOne({ username: username });
        if (!user_to_be_approved) {
            return { err: { status: 400, message: "Username not found." } };
        }

        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const moderators = community.moderators;
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
        const message = new Message({
            sender_id: approvingUser._id,
            sender_via_id: community._id,
            sender_type: "moderator",
            receiver_id: user_to_be_approved._id,
            receiver_type: "user",
            message: "You are approved by the moderator " + approvingUser.username + " in the subreddit  r/" + community_name,
            subject: "You are approved in the subreddit  /r/ " + community_name,
        });
        await message.save();

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//unapprove user
const unapproveUser = async (request) => {
    try {
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

        const { username, community_name } = request.body;
        const user_to_be_unapproved = await User.findOne({ username: username });
        if (!user_to_be_unapproved) {
            return { err: { status: 400, message: "Username not found." } };
        }

        const community = await communityNameExists(community_name);

        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }
        const moderators = community.moderators;
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
        const message = new Message({
            sender_id: approvingUser._id,
            sender_via_id: community._id,
            sender_type: "moderator",
            receiver_id: approved_user._id,
            receiver_type: "user",
            message: "You are unapproved by the moderator " + approvingUser.username + " in the subreddit  r/" + community_name,
            subject: "You are unapproved in the subreddit  /r/ " + community_name,
        });
        await message.save();

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
const getInvitedModerators = async (community_name) => {

    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 400, message: "Community not found." },
            };
        }
        const moderators = community.moderators;
        //filter moderator to get only who have flag pending_flag = false  
        const filtered_moderators = moderators.filter((moderator) => moderator.pending_flag);

        const returned_moderators = [];

        for (let i = 0; i < filtered_moderators.length; i++) {
            //get the user object from the user collection where username is the moderator's username
            const user = await User.findOne({ username: filtered_moderators[i].username });

            returned_moderators.push({
                username: filtered_moderators[i].username,
                profile_picture: user.profile_picture,
                moderator_since: filtered_moderators[i].moderator_since,
                has_access: filtered_moderators[i].has_access,
            })
        }


        return { returned_moderators };
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

const getApprovedUsers = async (community_name, pageNumber, pageSizeNumber) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 400, message: "Community not found." },
            };
        }

        // Check if pageSizeNumber is provided and use it, otherwise default to 10
        const pageSize = pageSizeNumber || 100;

        const approved_users = community.approved_users;

        // Calculate pagination offsets
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = pageNumber * pageSize;

        // Slice the approved users array based on pagination parameters
        const paginatedApprovedUsers = approved_users.slice(startIndex, endIndex);

        const returned_approved_users = [];
        for (let i = 0; i < paginatedApprovedUsers.length; i++) {
            const user = await User.findOne({ username: paginatedApprovedUsers[i].username });
            if (user) {
                returned_approved_users.push({
                    username: user.username,
                    approved_at: paginatedApprovedUsers[i].approved_at,
                    profile_picture: user.profile_picture
                });
            }
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
 * @returns {Object}
 * {success: true}
 * or
 * {err: {status: 400, message: "Community not found."}}
 * or
 * {err: {status: 400, message: "User not found."}}
 * or
 * {err: {status: 400, message: "User is already a moderator of the community."}}
 * or
 * {err: {status: 500, message: error.message}}
 * @returns {Object}
 */
const addModerator = async (request) => {

    try {

        const { success, err, status, user: invitingModerator, msg } = await verifyAuthToken(request);

        if (!invitingModerator) {
            return { err: { status: status, message: msg } };
        }
        const { community_name, username, has_access } = request.body;

        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return { err: { status: 400, message: "User not found." } };
        }

        // Check if the user is already a moderator of the community and get the moderator object
        const moderator = community.moderators.find(
            (moderator) => moderator.username === user.username
        );

        if (moderator) {
            if (!moderator.pending_flag)
                return {
                    err: {
                        status: 400,
                        message: "User is already a moderator of the community.",
                    },
                };
            else
                return {
                    err: {
                        status: 400,
                        message: "An invitation was already sent to this user .",
                    },
                };
        }
        const invitation = new Message({
            sender_id: invitingModerator._id,
            sender_via_id: community._id,
            sender_type: "moderator",
            receiver_id: user._id,
            receiver_type: "user",
            message: "gadzooks! You are invited to become a moderator of r/" + community_name,
            subject: "invitation to moderate/r/ " + community_name,
            is_invitation: true,
        });

        await invitation.save();
        community.moderators.push({
            username: user.username,
            moderator_since: new Date(),
            has_access: {
                everything: has_access.everything,
                manage_users: has_access.manage_users,
                manage_settings: has_access.manage_settings,
                manage_posts_and_comments: has_access.manage_posts_and_comments,
            },
            pending_flag: true
        });
        //community.joined_users.push({ _id: user._id })

        // Save the updated community

        await community.save();


        await user.save();

        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//accept invitation of moderator 
const acceptModeratorInvitation = async (request) => {
    try {
        const { success, err, status, user: acceptingModerator, msg } = await verifyAuthToken(request);
        if (!acceptingModerator) {
            return { err: { status: status, message: msg } };
        }
        const { _id: message_id } = request.body;
        const invitation = await Message.findOne({
            _id: message_id
        })

        if (!invitation) {
            return { err: { status: 400, message: "Invitation with this id not found." } };

        }

        const community = await Community.findOne({
            _id: invitation.sender_via_id
        })
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        const index = community.moderators.findIndex((moderator) => moderator.username === acceptingModerator.username);
        if (index === -1) {
            return { err: { status: 400, message: "error ,can't accept invitation , could find the invitation in the db " } };
        }
        community.moderators[index].pending_flag = false;
        await community.save();
        acceptingModerator.moderated_communities.push({
            id: community._id,
            favorite_flag: false,
        });
        await acceptingModerator.save();


        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}
/**
 *
 * @param {String} community_name
 * @returns {Object}
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

const getModerators = async (community_name, pageNumber = 1, pageSizeNumber = 100) => {
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        const moderators = community.moderators;
        // Filter moderators to get only those with pending_flag = false
        const filteredModerators = moderators.filter(moderator => !moderator.pending_flag);

        // Apply pagination
        const startIndex = (pageNumber - 1) * pageSizeNumber;
        const endIndex = pageNumber * pageSizeNumber;
        const paginatedModerators = filteredModerators.slice(startIndex, endIndex);

        const returned_moderators = [];
        for (let i = 0; i < paginatedModerators.length; i++) {
            const user = await User.findOne({ username: paginatedModerators[i].username });
            if (user) {
                returned_moderators.push({
                    username: paginatedModerators[i].username,
                    profile_picture: user.profile_picture,
                    moderator_since: paginatedModerators[i].moderator_since,
                    has_access: paginatedModerators[i].has_access,
                });
            }
        }

        return { returned_moderators };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};


const getModeratorsSortedByDate = async (request, pageNumber = 1, pageSizeNumber = 100) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user) {


            return { err: { status: status, message: msg } };
        }

        const community = await communityNameExists(request.params.community_name);
        if (!community) {


            return { err: { status: 400, message: "Community not found." } };
        }

        const moderator = community.moderators.find((moderator) => moderator.username === user.username);
        if (!moderator) {

            return { err: { status: 400, message: "User is not a moderator of the community." } };
        }

        const moderators = community.moderators.filter((moderator) => !moderator.pending_flag);

        // Sort the moderators array by moderator_since date
        moderators.sort((a, b) => new Date(b.moderator_since) - new Date(a.moderator_since));

        // Calculate pagination offsets
        const startIndex = (pageNumber - 1) * pageSizeNumber;
        const endIndex = pageNumber * pageSizeNumber;

        // Slice the sorted moderators array based on pagination parameters
        const paginatedModerators = moderators.slice(startIndex, endIndex);

        const returned_moderators = [];

        for (let i = 0; i < paginatedModerators.length; i++) {
            const user = await User.findOne({ username: paginatedModerators[i].username });
            returned_moderators.push({
                username: paginatedModerators[i].username,
                profile_picture: user.profile_picture,
                moderator_since: paginatedModerators[i].moderator_since,
                has_access: paginatedModerators[i].has_access,
            });
        }

        return { returned_moderators };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};



const getEditableModerators = async (request, pageNumber, pageSizeNumber) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user) {
            return { err: { status: status, message: msg } };
        }

        const community = await communityNameExists(request.params.community_name);
        if (!community) {
            return { err: { status: 400, message: "Community not found." } };
        }

        const moderator = community.moderators.find((moderator) => moderator.username === user.username);
        if (!moderator) {
            return { err: { status: 400, message: "User is not a moderator of the community." } };
        }

        const moderators = community.moderators.filter((moderator) => !moderator.pending_flag);

        // Calculate pagination offsets
        const startIndex = (pageNumber - 1) * pageSizeNumber;
        const endIndex = pageNumber * pageSizeNumber;

        // Slice the moderators array based on pagination parameters
        const paginatedModerators = moderators.slice(startIndex, endIndex);

        const editableModerators = [];

        for (let i = 0; i < paginatedModerators.length; i++) {
            const user = await User.findOne({ username: paginatedModerators[i].username });
            if (user && paginatedModerators[i].moderator_since > moderator.moderator_since) {
                editableModerators.push({
                    username: paginatedModerators[i].username,
                    profile_picture: user.profile_picture,
                    moderator_since: paginatedModerators[i].moderator_since,
                    has_access: paginatedModerators[i].has_access,
                });
            }
        }

        return { editableModerators };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

/**
 * @param {Object} requestBody
 * @property {String} community_name
 * @property {String} username
 * @returns {Object}
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

        user.moderated_communities = user.moderated_communities.filter(
            (moderated_community) => (moderated_community.id).toString() != community._id.toString()
        )
        await user.save();

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
 * @returns {Object}
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
        user.moderated_communities = user.moderated_communities.filter(
            (moderated_community) => (moderated_community.id).toString() != community._id.toString()
        )
        user.save();
        return { success: true };
    }
    catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

//////////////////////////////////////////////////////////////////////// Get All Users //////////////////////////////////////////////////////////////


export {
    banUser,//done
    getBannedUsers,//done
    muteUser,//done
    getMutedUsers,//done
    approveUser,//done
    getApprovedUsers,//done
    addModerator,
    getModerators,//done
    deleteModerator,
    moderatorLeaveCommunity,
    getEditableModerators, //done 
    getModeratorsSortedByDate,//done
    unapproveUser,

    editBannedUser,
    acceptModeratorInvitation,
    getInvitedModerators //done
};