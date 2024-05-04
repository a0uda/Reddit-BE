// Mod Tools --> Overview --> User Management --> (Banned, Muted, Approved, Moderators) Users

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
            username,
            community_name,
            newDetails,
        } = request.body;

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
        const { username, community_name } = request.body;
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

        const community = await communityNameExists(community_name);
        console.log("community: ", community);
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
        console.log(community.approved_users);
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
        //console.log("community.moderators", moderators);
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
const addModerator = async (request) => {
    //TODO: INVITATION EMAIL SHOULD BE SENT TO THE USER
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
        console.log("moderator: ", moderator);
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
        console.log("invitation: ", invitation);
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
        community.joined_users.push({ _id: acceptingModerator._id })
        await acceptingModerator.save();


        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}
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

    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 400, message: "Community not found." },
            };
        }
        const moderators = community.moderators;
        //filter moderator to get only who have flag pending_flag = false  
        const filtered_moderators = moderators.filter((moderator) => !moderator.pending_flag);
        //console.log("community.moderators", moderators);
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
        //filter pending moderators 
        const filtered_moderators = moderators.filter((moderator) => !moderator.pending_flag);
        //sort the moderators array by moderator_since date
        filtered_moderators.sort((a, b) => {
            return new Date(b.moderator_since) - new Date(a.moderator_since);
        }
        );
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

const getEditableModerators = async (request) => {
    try {
        console.log("inside getEditableModerators")
        const { success, err, status, user, msg } = await verifyAuthToken(request);
        if (!user) {
            return { err: { status: status, message: msg } };
        }
        console.log("authentication passed")
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
        const moderators = community.moderators;
        //  filter to have moderators who pendinq_flag is false
        const filtered_moderators = moderators.filter((moderator) => !moderator.pending_flag);

        for (let i = 0; i < filtered_moderators.length; i++) {
            //get the user object from the user collection where username is the moderator's username
            const user = await User.findOne({
                username: filtered_moderators[i].username,
            });
            if (filtered_moderators[i].moderator_since > moderator.moderator_since) {
                editableModerators.push({
                    username: filtered_moderators[i].username,
                    profile_picture: user.profile_picture,
                    moderator_since: filtered_moderators[i].moderator_since,
                    has_access: filtered_moderators[i].has_access,
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
        user.moderated_communities = user.moderated_communities.filter(
            (moderated_community) => (moderated_community.id).toString() != community._id.toString()
        )
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
    getAllUsers,
    editBannedUser,
    acceptModeratorInvitation,
    getInvitedModerators
};