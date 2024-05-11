
import {
    approveUser,
    getApprovedUsers,
    muteUser,
    getMutedUsers,
    banUser,
    getBannedUsers,
    getModerators,
    getEditableModerators,
    moderatorLeaveCommunity,
    addModerator,
    deleteModerator,
    editBannedUser,
    getInvitedModerators,
    getModeratorsSortedByDate,
    unapproveUser,
    acceptModeratorInvitation
} from '../../src/services/communityUserManagement';
import { User } from '../../src/db/models/User';
import { communityNameExists, isUserAlreadyApproved } from '../../src/utils/communities';
import { verifyAuthToken } from '../../src/controller/userAuth';
import { Message } from '../../src/db/models/Message';
import { Community } from '../../src/db/models/Community';
jest.mock("../../src/controller/userAuth");
jest.mock("../../src/utils/communities");
jest.mock("../../src/db/models/User");
jest.mock("../../src/db/models/Message");
jest.mock("../../src/db/models/Community");
//todos : unapprove , should return the editable moderators commented 

describe("banUser", () => {
    it('should return an error if the community name doesnt exist', async () => {
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: { username: "user1" }, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(null);
        const result = await banUser(request);
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
        //reset the mocks 
        jest.resetAllMocks();

    });
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await banUser(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockRejectedValueOnce(new Error("An error occurred"));

        // Execute the function and capture the result
        const result = await banUser(request);


        expect(result.err.status).toBe(500);

    })
    it('should return an error if the user is not found ', async () => {
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(null);

        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });

        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await banUser(request);
        expect(result).toEqual({ err: { status: 400, message: "Username not found." } });


    })
    it('should return an error if the user is not a moderator', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(false);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await banUser(request);
        expect(result).toEqual({ err: { status: 400, message: "You are not a moderator in this community" } });

    })
    it('should return an error if the moderator has no permission to take action', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: false,
                manage_users: false,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);

        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await banUser(request);
        expect(result).toEqual({ err: { status: 400, message: "You are not allowed to ban/unban  users. permission denied" } });

    })
    it("should return arror if the user is already banned ", async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                },

            }],
            name: "community1",
            banned_users: [{
                username: "user3",
                reason: "reason",
            }]

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user3" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.banned_users.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);

        const result = await banUser(request);
        expect(result).toEqual({ err: { status: 400, message: "User is already banned in this community" } });

    })
    it("should ban a user successfully ", async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                },

            }],
            name: "community1",
            banned_users: [],
            save: jest.fn(),
            _id: "663e83c5e8fa844c9f146298"

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        const bannedUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        //mock message.save to return a message object 

        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.banned_users.some = jest.fn().mockReturnValue(false);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        Message.prototype.save = jest.fn();


        const result = await banUser(request);
        expect(result).toEqual({ success: true });

    })
    it("should unban a user successfully ", async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "unban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                },

            }],
            name: "community1",
            banned_users: [{ username: "user3" }],
            save: jest.fn(),
            _id: "663e83c5e8fa844c9f146298"

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        const bannedUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        //mock message.save to return a message object 

        User.findOne.mockResolvedValueOnce(bannedUser);
        // mockCommunity.banned_users.some = jest.fn().mockReturnValue(false);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        Message.prototype.save = jest.fn();


        const result = await banUser(request);
        expect(result).toEqual({ success: true });

    })
})
describe("editBannedUser", () => {
    it('should return an error if the community name doesnt exist', async () => {
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: { username: "user1" }, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(null);
        const result = await editBannedUser(request);
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
        //reset the mocks 
        jest.resetAllMocks();

    });

    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await editBannedUser(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockRejectedValueOnce(new Error("An error occurred"));

        // Execute the function and capture the result
        const result = await editBannedUser(request);


        expect(result.err.status).toBe(500);

    })
    it('should return an error if the user is not a moderator', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(false);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await editBannedUser(request);
        expect(result).toEqual({ err: { status: 400, message: "You are not a moderator in this community" } });

    })
    it('should return an error if the user is not banned ', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                newDetails: {
                    reason_for_ban: "reason",
                    mod_note: "note",
                    permanent_flag: "flag",
                    note_for_ban_message: "message",
                    banned_until: "until"

                }


            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",
            banned_users: []

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);

        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.banned_users.findIndex = jest.fn().mockReturnValue(-1);
        const result = await editBannedUser(request);
        expect(result).toEqual({ err: { status: 400, message: "User is not banned in this community" } });

    })
    it('should return success ', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                newDetails: {
                    reason_for_ban: "reason",
                    mod_note: "note",
                    permanent_flag: "flag",
                    note_for_ban_message: "message",
                    banned_until: "until"

                }


            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",
            banned_users: [],
            save: jest.fn()

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);

        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.banned_users.findIndex = jest.fn().mockReturnValue(1);
        //        Object.assign(community.banned_users[bannedUserIndex], newDetails);
        //mock object.assign 
        Object.assign = jest.fn();

        const result = await editBannedUser(request);
        expect(result).toEqual({ success: true });

    })
    it('should error user not found ', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                newDetails: {
                    reason_for_ban: "reason",
                    mod_note: "note",
                    permanent_flag: "flag",
                    note_for_ban_message: "message",
                    banned_until: "until"

                }


            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",
            banned_users: [],
            save: jest.fn()

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(null);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);

        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.banned_users.findIndex = jest.fn().mockReturnValue(1);
        //        Object.assign(community.banned_users[bannedUserIndex], newDetails);
        //mock object.assign 
        Object.assign = jest.fn();

        const result = await editBannedUser(request);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe("Username not found.");

    })


})

describe('getBannedUsers', () => {
    it('should return an error if the community name doesnt exist', async () => {
        jest.resetAllMocks();

        communityNameExists.mockResolvedValueOnce(null);
        const result = await getBannedUsers("community1");
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
        //reset the mocks 
        jest.resetAllMocks();

    });
    //internal server error 500 
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        communityNameExists.mockRejectedValueOnce(new Error("An error occurred"));
        const result = await getBannedUsers("community1");
        expect(result.err.status).toBe(500);
    });
    it('should return an array of banned users', async () => {
        jest.resetAllMocks();
        const mockCommunity = {
            banned_users: [
                {
                    username: "user1",
                    banned_date: "date",
                    reason_for_ban: "reason",
                    mod_note: "note",
                    permanent_flag: "flag",
                    banned_until: "until",
                    note_for_ban_message: "message"
                }
            ]
        }
        const user = {
            username: "user1",
            profile_picture: "picture"
        }
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        User.findOne.mockResolvedValueOnce(user);
        const result = await getBannedUsers("community1");
        expect(result.users).toEqual([{
            username: "user1",
            banned_date: "date",
            reason_for_ban: "reason",
            mod_note: "note",
            permanent_flag: "flag",
            banned_until: "until",
            note_for_ban_message: "message",
            profile_picture: "picture"
        }]);
    })

})

describe('muteUser', () => {

    it('should return an error if the community name doesnt exist', async () => {
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "mute",
                reason: "reason"

            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: { username: "user1" }, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(null);
        const result = await muteUser(request);
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
        //reset the mocks 
        jest.resetAllMocks();

    });
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await muteUser(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockRejectedValueOnce(new Error("An error occurred"));

        // Execute the function and capture the result
        const result = await muteUser(request);


        expect(result.err.status).toBe(500);

    })
    it('should return an error if the user is not a moderator', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(false);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await banUser(request);
        expect(result).toEqual({ err: { status: 400, message: "You are not a moderator in this community" } });

    })
    it('should return an error if the moderator has no permission to take action', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "ban",
                reason_for_ban: "reason",
                mod_note: "note",
                permanent_flag: "flag",
                note_for_ban_message: "message",
                banned_until: "until"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: false,
                manage_users: false,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);

        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await banUser(request);
        expect(result).toEqual({ err: { status: 400, message: "You are not allowed to ban/unban  users. permission denied" } });

    })
    it('should return an error if the user is not found', async () => {
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "mute",
                reason: "reason"

            }
        }
        const mockCommunity = {
            moderators: [],
            name: "community1",
            muted_users: []
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: { username: "user1" }, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        User.findOne.mockResolvedValueOnce(null);
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await muteUser(request);
        expect(result).toEqual({ err: { status: 400, message: "Username not found." } });
        //reset the mocks 
        jest.resetAllMocks();

    });
    it("should mute a user successfully ", async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "mute",
                reason: "reason"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                },

            }],
            name: "community1",
            muted_users: [],
            save: jest.fn(),
            _id: "663e83c5e8fa844c9f146298"

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        const bannedUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        //mock message.save to return a message object 

        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.muted_users.some = jest.fn().mockReturnValue(false);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        Message.prototype.save = jest.fn();


        const result = await muteUser(request);
        expect(result).toEqual({ success: true });

    })
    //if action is unmute  
    it("should unmute a user successfully ", async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",
                action: "unmute",
                reason: "reason"

            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                },

            }],
            name: "community1",
            muted_users: [{ username: "user3" }],
            save: jest.fn(),
            _id: "663e83c5e8fa844c9f146298"

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        const bannedUser = {
            username: "user3",
            _id: "663e83c5e8fa844c9f146298"
        }
        //mock message.save to return a message object 

        User.findOne.mockResolvedValueOnce(bannedUser);
        // mockCommunity.banned_users.some = jest.fn().mockReturnValue(false);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        Message.prototype.save = jest.fn();


        const result = await muteUser(request);
        expect(result).toEqual({ success: true });

    })
    //invalid action 
    it("should return an error if the action is invalid ", async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' },
            body: {
                username: "user3",
                community_name: "community1",
                action: "invalid",
                reason: "reason"
            }
        }

        verifyAuthToken.mockResolvedValueOnce({ success: true, user: { username: "user1" }, status: 200, msg: 'error' });
        const result = await muteUser(request);
        expect(result.err).toEqual({ status: 400, message: "Invalid action." });
    })
})

describe("getMutedUsers", () => {
    it("should return an error if the community does not exist", async () => {
        jest.resetAllMocks();
        const community_name = "community1";
        const pageNumber = 1;
        const pageSizeNumber = 10;

        communityNameExists.mockResolvedValueOnce(null);

        const result = await getMutedUsers(community_name, pageNumber, pageSizeNumber);
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
    });

    it("should return an array of muted users", async () => {
        jest.resetAllMocks();
        const community_name = "community1";
        const pageNumber = 1;
        const pageSizeNumber = 10;

        const mockCommunity = {
            muted_users: [
                {
                    username: "user1",
                    muted_by_username: "moderator1",
                    mute_date: "2021-04-20T00:00:00.000Z",
                    mute_reason: "reason1",
                },
                {
                    username: "user2",
                    muted_by_username: "moderator2",
                    mute_date: "2021-04-21T00:00:00.000Z",
                    mute_reason: "reason2",
                },
            ],
        };

        const mockUser1 = {
            username: "user1",
            profile_picture: "profile_picture1",
        };

        const mockUser2 = {
            username: "user2",
            profile_picture: "profile_picture2",
        };

        const expectedUsers = [
            {
                username: "user1",
                muted_by_username: "moderator1",
                mute_date: "2021-04-20T00:00:00.000Z",
                mute_reason: "reason1",
                profile_picture: "profile_picture1",
            },
            {
                username: "user2",
                muted_by_username: "moderator2",
                mute_date: "2021-04-21T00:00:00.000Z",
                mute_reason: "reason2",
                profile_picture: "profile_picture2",
            },
        ];

        communityNameExists.mockResolvedValueOnce(mockCommunity);
        User.findOne.mockResolvedValueOnce(mockUser1);
        User.findOne.mockResolvedValueOnce(mockUser2);

        const result = await getMutedUsers(community_name, pageNumber, pageSizeNumber);
        expect(result).toEqual({ users: expectedUsers });
    });
    //internal server error 
    it("should return an error if an internal server error occurs", async () => {
        jest.resetAllMocks();
        const community_name = "community1";
        const pageNumber = 1;
        const pageSizeNumber = 10;

        communityNameExists.mockRejectedValueOnce(new Error("Internal server error."));

        const result = await getMutedUsers(community_name, pageNumber, pageSizeNumber);
        expect(result).toEqual({ err: { status: 500, message: "Internal server error." } });
    });
})

describe("approveUser", () => {
    it('should return an error if the username  doesnt exist', async () => {
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",


            }
        }
        User.findOne.mockResolvedValueOnce(null);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: { username: "user1" }, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(null);
        const result = await approveUser(request);
        expect(result).toEqual({ err: { status: 400, message: "Username not found." } });
        //reset the mocks 
        jest.resetAllMocks();

    });
    it('should return an error if the community name doesnt exist', async () => {
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",


            }
        }
        User.findOne.mockResolvedValueOnce({ username: "user3" });
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: { username: "user1" }, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(null);
        const result = await approveUser(request);
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
        //reset the mocks 
        jest.resetAllMocks();

    });
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error', err: 'error' });
        const result = await approveUser(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockRejectedValueOnce(new Error("An error occurred"));

        // Execute the function and capture the result
        const result = await approveUser(request);


        expect(result.err.status).toBe(500);

    })
    it('should return an error if the user is not a moderator', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",


            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(false);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await approveUser(request);
        expect(result).toEqual({ err: { status: 400, message: "You are not a moderator in this community" } });

    })
    it('should return an error if the moderator has no permission to take action', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",


            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: false,
                manage_users: false,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user5" }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        User.findOne.mockResolvedValueOnce(bannedUser);
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);

        const result = await approveUser(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("You are not allowed to approve users. permission denied");

    })
    it("should return arror if the user is already approved ", async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token'
            },
            body: {
                username: "user3",
                community_name: "community1",


            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                has_access: {
                    everything: false,
                    manage_users: false,

                },

            }],
            name: "community1",
            approved_users: [{
                username: "user3",
                reason: "reason",
            }]

        }
        const moderator =
        {
            username: "user1",
            has_access: {
                everything: true,
                manage_users: true,
            }
        }
        const banningUser = { username: "user3" }
        const bannedUser = { username: "user3" }
        User.findOne.mockResolvedValueOnce(bannedUser);
        mockCommunity.approved_users.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.some = jest.fn().mockReturnValue(true);
        mockCommunity.moderators.find = jest.fn().mockReturnValue(moderator);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser, status: 200, msg: 'error' });
        // Mock communityNameExists to return an object with moderators
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        isUserAlreadyApproved.mockResolvedValueOnce(true);
        const result = await approveUser(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is already approved in this community.");

    })

})


describe('getInvitedModerators', () => {
    it('should return an error if the community does not exist', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        communityNameExists.mockResolvedValueOnce(null);
        const result = await getInvitedModerators(request);
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
    })
    it('should return the invited moderators', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [{
                username: "user1",
                pending_flag: false,
                moderator_since: "2021-10-10",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            },
            {
                username: "user2",
                pending_flag: true,
                moderator_since: "2021-10-10",
                has_access: {
                    everything: false,
                    manage_users: false,

                }
            }],
            name: "community1",
        }
        const user1 = {
            profile_picture: "profile_picture1",
            username: "user1"
        }
        const user2 = {
            profile_picture: "profile_picture2",
            username: "user2"
        }
        User.findOne.mockResolvedValueOnce(user1);
        User.findOne.mockResolvedValueOnce(user2);
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.moderators.filter = jest.fn().mockReturnValue([
            {
                username: "user2",
                profile_picture: "profile_picture2",
                moderator_since: "2021-10-10",
                has_access: {
                    everything: false,
                    manage_users: false,
                }
            }

        ]);
        const result = await getInvitedModerators("community1");
        expect(result.returned_moderators).toEqual([
            {
                username: 'user2',
                profile_picture: 'profile_picture1',
                moderator_since: '2021-10-10',
                has_access: { everything: false, manage_users: false }
            }
        ]);

        //server error 

    })
    it('should return an error if there is a server error', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        communityNameExists.mockRejectedValueOnce(new Error('error'));
        const result = await getInvitedModerators(request);
        expect(result).toEqual({ err: { status: 500, message: "error" } });
    })
})

describe('getApprovedUsers', () => {
    it('should return an error if the community does not exist', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        communityNameExists.mockResolvedValueOnce(null);
        const result = await getApprovedUsers(request);
        expect(result).toEqual({ err: { status: 400, message: "Community not found." } });
    })
    it('should return the approved users', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        const mockCommunity = {
            approved_users: [{
                username: "user1",
                approved_at: "2021-10-10"
            },
            {
                username: "user2",
                approved_at: "2021-10-10"
            }],
            name: "community1",
        }
        const user1 = {
            profile_picture: "profile_picture1",
            username: "user1"
        }
        const user2 = {
            profile_picture: "profile_picture2",
            username: "user2"
        }
        User.findOne.mockResolvedValueOnce(user1);
        User.findOne.mockResolvedValueOnce(user2);
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.approved_users.slice = jest.fn().mockReturnValue([
            { username: "user1", approved_at: "2021-10-10" },
            { username: "user2", approved_at: "2021-10-10" }
        ]);
        const result = await getApprovedUsers("community1");
        expect(result).toEqual(
            {
                users:
                    [
                        {
                            username: 'user1',
                            approved_at: '2021-10-10',
                            profile_picture: 'profile_picture1'
                        },
                        {
                            username: 'user2',
                            approved_at: '2021-10-10',
                            profile_picture: 'profile_picture2'
                        }
                    ]
            }
        );
    })
    it('should return an error if there is a server error', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        communityNameExists.mockRejectedValueOnce(new Error('error'));
        const result = await getApprovedUsers(request);
        expect(result.err.status).toEqual(500);
    })
})




/*const getModeratorsSortedByDate = async (request, pageNumber, pageSizeNumber) => {
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
 */
describe('getModeratorsSortedByDate', () => {
    it('should return an error if the user is not authenticated', async () => {
        //reset the mocks 
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: false, err: "error", status: 401, user: null });
        const result = await getModeratorsSortedByDate(request, 1, 1);
        expect(result.err.status).toEqual(401);
    })
    it('should return an error if the community does not exist', async () => {

        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        communityNameExists.mockResolvedValueOnce(null);
        const result = await getModeratorsSortedByDate(request, 1, 1);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })
    it('should return an error if the user is not a moderator of the community', async () => {

        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "user1",
                    moderator_since: "2021-10-10",
                    has_access: {
                        everything: false,
                        manage_users: false,
                    }
                },
                {
                    username: "user2",
                    moderator_since: "2021-10-10",
                    has_access: {
                        everything: false,
                        manage_users: false,
                    }
                }
            ]
        }
        const user = {
            username: "user3"

        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: user });

        communityNameExists.mockResolvedValueOnce(mockCommunity);

        mockCommunity.moderators.find = jest.fn().mockReturnValue(null);
        const result = await getModeratorsSortedByDate(request, 1, 1);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is not a moderator of the community.");
    })
    it('should return the moderators sorted by date', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "user1",
                    moderator_since: "2021-10-10",
                    has_access: {
                        everything: false,
                        manage_users: false,
                    }
                },
                {
                    username: "user2",
                    moderator_since: "2021-10-10",
                    has_access: {
                        everything: false,
                        manage_users: false,
                    }
                }
            ]
        }
        const user1 = {
            profile_picture: "profile_picture1",
            username: "user1"
        }
        const user2 = {
            profile_picture: "profile_picture2",
            username: "user2"
        }
        User.findOne.mockResolvedValueOnce(user1);
        User.findOne.mockResolvedValueOnce(user2);
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        mockCommunity.moderators.find = jest.fn().mockReturnValue({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await getModeratorsSortedByDate(request, 1, 1);
        expect(result).toEqual(
            {
                returned_moderators:
                    [
                        {
                            username: 'user1',
                            profile_picture: 'profile_picture1',
                            moderator_since: '2021-10-10',
                            has_access: { everything: false, manage_users: false }
                        }

                    ]
            })
    });
})
/*const getModerators = async (community_name, pageNumber, pageSizeNumber) => {
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
}; */
describe('getModerators', () => {
    it('should return an error if the community does not exist', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        communityNameExists.mockResolvedValueOnce(null);
        const result = await getModerators(request, 1, 1);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })
    it('should return the moderators', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "user1",
                    moderator_since: "2021-10-10",
                    has_access: {
                        everything: false,
                        manage_users: false,
                    }
                },
                {
                    username: "user2",
                    moderator_since: "2021-10-10",
                    has_access: {
                        everything: false,
                        manage_users: false,
                    }
                }
            ]
        }
        const user1 = {
            profile_picture: "profile_picture1",
            username: "user1"
        }
        const user2 = {
            profile_picture: "profile_picture2",
            username: "user2"
        }
        User.findOne.mockResolvedValueOnce(user1);
        User.findOne.mockResolvedValueOnce(user2);
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        mockCommunity.moderators.find = jest.fn().mockReturnValue({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await getModerators(request, 1, 1);
        expect(result).toEqual(
            {
                returned_moderators:
                    [
                        {
                            username: 'user1',
                            profile_picture: 'profile_picture1',
                            moderator_since: '2021-10-10',
                            has_access: { everything: false, manage_users: false }
                        }

                    ]
            })
    });
    //server error 
    it('should return a server error', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        communityNameExists.mockRejectedValueOnce(new Error("Server error"));
        const result = await getModerators(request, 1, 1);
        expect(result.err.status).toEqual(500);
        expect(result.err.message).toEqual("Server error");
    })
})

describe('getEditableModerators', () => {
    it('should return an error if the community does not exist', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        communityNameExists.mockResolvedValueOnce(null);
        const result = await getEditableModerators(request, 1, 1);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })
    it('should return an error if the user is not a moderator of the community', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "user2",
                    moderator_since: "2021-10-10",
                    has_access: {
                        everything: false,
                        manage_users: false,
                    }
                }
            ]
        }
        const user1 = {
            profile_picture: "profile_picture1",
            username: "user1"
        }
        const user2 = {
            profile_picture: "profile_picture2",
            username: "user2"
        }
        User.findOne.mockResolvedValueOnce(user1);
        User.findOne.mockResolvedValueOnce(user2);
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        mockCommunity.moderators.find = jest.fn().mockReturnValue(null);
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await getEditableModerators(request, 1, 1);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is not a moderator of the community.");
    })

    // it('should return the editable moderators', async () => {
    //     jest.resetAllMocks();
    //     const request = {
    //         params: {
    //             community_name: "community1"
    //         }
    //     }
    //     const mockCommunity = {
    //         moderators: [
    //             {
    //                 username: "user1",
    //                 moderator_since: "2021-10-10",
    //                 has_access: {
    //                     everything: false,
    //                     manage_users: false,
    //                 }
    //             },
    //             {
    //                 username: "user2",
    //                 moderator_since: "2021-10-10",
    //                 has_access: {
    //                     everything: false,
    //                     manage_users: false,
    //                 }
    //             }
    //         ]
    //     }
    //     const user1 = {
    //         profile_picture: "profile_picture1",
    //         username: "user1"
    //     }
    //     const user2 = {
    //         profile_picture: "profile_picture2",
    //         username: "user2"
    //     }
    //     User.findOne.mockResolvedValueOnce(user1);
    //     User.findOne.mockResolvedValueOnce(user2);
    //     mockCommunity.moderator.filter = jest.fn().mockReturnValue(mockCommunity.moderators);
    //     mockCommunity.moderators.slice = jest.fn().mockReturnValue(mockCommunity.moderators);
    //     verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
    //     mockCommunity.moderators.find = jest.fn().mockReturnValue({ username: "user1", moderator_since: "2021-10-10", has_access: { everything: false, manage_users: false } });
    //     communityNameExists.mockResolvedValueOnce(mockCommunity);
    //     const result = await getEditableModerators(request, 1, 1);
    //     expect(result).toEqual({
    //         editableModerators: [
    //             {
    //                 username: "user2",
    //                 profile_picture: "profile_picture2",
    //                 moderator_since: "2021-10-10",
    //                 has_access: {
    //                     everything: false,
    //                     manage_users: false,
    //                 }
    //             }
    //         ]
    //     });
    // })



})
//un approve user
/*const unapproveUser = async (request) => {
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
}; */
describe('unapproveUser', () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: false, err: { status: 400, message: "Invalid token." } });
        const result = await unapproveUser(request);
        expect(result).toEqual({ success: false, err: { status: 400, message: "Invalid token." } });
    })

    it('should return an error if the user to be unapproved is not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce(null);
        const result = await unapproveUser(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Username not found.");
    })

    it('should return an error if the community is not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(null);
        const result = await unapproveUser(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })

    it('should return an error if the user is not a moderator in the community', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "moderator2"
                }
            ]
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await unapproveUser(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("You are not a moderator in this community");
    })

    it('should return an error if the user is not allowed to unapprove users', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "moderator1",
                    has_access: {
                        everything: false,
                        manage_users: false
                    }
                }
            ]
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await unapproveUser(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("You are not allowed to unapprove users. permission denied");
    })
    it('should return an error if the user is not approved in the community', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "moderator1",
                    has_access: {
                        everything: true,
                        manage_users: true
                    }
                }
            ],
            approved_users: []
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await unapproveUser(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is not approved in this community.");
    })
    //server error 500 
    it('should return an error if there is a server error', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1"
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "moderator1",
                    has_access: {
                        everything: true,
                        manage_users: true
                    }
                }
            ],
            approved_users: [
                {
                    username: "user1"
                }
            ]
        }
        //verify auth token throw error 
        verifyAuthToken.mockImplementationOnce(() => {
            throw new Error('error');
        });
        const result = await unapproveUser(request);

        expect(result.err.status).toEqual(500);

    })
})

describe('addModerator', () => {

    it('should return an error if the user is already a moderator in the community', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1",
                has_access: {
                    everything: true,
                    manage_users: true,
                    manage_settings: true,
                    manage_posts_and_comments: true
                }
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "user1"
                }
            ]
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await addModerator(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is already a moderator of the community.");
    })

    it('should return an error if the user is not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1",
                has_access: {
                    everything: true,
                    manage_users: true,
                    manage_settings: true,
                    manage_posts_and_comments: true
                }
            }
        }
        communityNameExists.mockResolvedValueOnce({ moderators: [] });
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce(null);
        const result = await addModerator(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User not found.");
    })
    it('should return an error if the community is not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1",
                has_access: {
                    everything: true,
                    manage_users: true,
                    manage_settings: true,
                    manage_posts_and_comments: true
                }
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(null);
        const result = await addModerator(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })



    it('should return an error if the user is already a moderator in the community', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1",
                has_access: {
                    everything: true,
                    manage_users: true,
                    manage_settings: true,
                    manage_posts_and_comments: true
                }
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "user1"
                }
            ]
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.moderators.find = jest.fn().mockReturnValueOnce({ username: "user1", pending_flag: false });
        const result = await addModerator(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is already a moderator of the community.");
    })
    it('should return an error if the user is already invited to be a moderator in the community', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                username: "user1",
                community_name: "community1",
                has_access: {
                    everything: true,
                    manage_users: true,
                    manage_settings: true,
                    manage_posts_and_comments: true
                }
            }
        }
        const mockCommunity = {
            moderators: [
                {
                    username: "user2",
                    pending_flag: true
                }
            ]
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        mockCommunity.moderators.find = jest.fn().mockReturnValueOnce({ username: "user1", pending_flag: true });

        const result = await addModerator(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("An invitation was already sent to this user .");
    })
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockRejectedValueOnce(new Error("An error occurred"));

        // Execute the function and capture the result
        const result = await addModerator(request);


        expect(result.err.status).toBe(500);

    })



})
/*const acceptModeratorInvitation = async (request) => {
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
        await acceptingModerator.save();
 
 
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
} */
describe('acceptModeratorInvitation', () => {
    // Test case 1 return error 500 
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                _id: "message1"
            }
        }
        verifyAuthToken.mockRejectedValueOnce(new Error("An error occurred"));
        const result = await acceptModeratorInvitation(request);
        expect(result.err.status).toEqual(500);
    })
    // Test case 2 return error 400 if user not auth 
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                _id: "message1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: false, err: null, status: 401, msg: "User not authenticated" });
        const result = await acceptModeratorInvitation(request);
        expect(result.err.status).toEqual(401);
    })
    //test case 3 return error 400 if community not found 
    it('should return an error if the message not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                _id: "message1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        Message.findOne.mockResolvedValueOnce(null);
        const result = await acceptModeratorInvitation(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Invitation with this id not found.");
    })
    //test case 4 return error 400 if community not found 
    it('should return an error if the community not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                _id: "message1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "moderator1" } });
        Message.findOne.mockResolvedValueOnce({ sender_via_id: "community1" });
        Community.findOne.mockResolvedValueOnce(null);
        const result = await acceptModeratorInvitation(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })



})
/*const deleteModerator = async (requestBody) => {
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
}; */
describe('deleteModerator', () => {
    // Test case 1 return error 500 
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const requestBody = {
            community_name: "community1",
            username: "user1"
        }
        communityNameExists.mockRejectedValueOnce(new Error("An error occurred"));
        const result = await deleteModerator(requestBody);
        expect(result.err.status).toEqual(500);
    })
    // Test case 2 return error 400 if community not found 
    it('should return an error if the community not found', async () => {
        jest.resetAllMocks();
        const requestBody = {
            community_name: "community1",
            username: "user1"
        }
        communityNameExists.mockResolvedValueOnce(null);
        const result = await deleteModerator(requestBody);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })
    // Test case 3 return error 400 if user not found 
    it('should return an error if the user not found', async () => {
        jest.resetAllMocks();
        const requestBody = {
            community_name: "community1",
            username: "user1"
        }
        communityNameExists.mockResolvedValueOnce({ _id: "community1" });
        User.findOne.mockResolvedValueOnce(null);
        const result = await deleteModerator(requestBody);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User not found.");
    })
    // Test case 4 return error 400 if user is not a moderator 
    it('should return an error if the user is not a moderator of the community', async () => {
        jest.resetAllMocks();
        const requestBody = {
            community_name: "community1",
            username: "user1"
        }
        communityNameExists.mockResolvedValueOnce({ _id: "community1", moderators: [] });
        User.findOne.mockResolvedValueOnce({ username: "user1" });
        const result = await deleteModerator(requestBody);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is not a moderator of the community.");
    })

})
/*const moderatorLeaveCommunity = async (request) => {
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
  */
describe('moderatorLeaveCommunity', () => {
    // Test case 1 return error 400 if community not found 
    it('should return an error if the community not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        communityNameExists.mockResolvedValueOnce(null);
        const result = await moderatorLeaveCommunity(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("Community not found.");
    })
    //not authenticaed 
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: false, err: null, status: 401, user: null });
        const result = await moderatorLeaveCommunity(request);
        expect(result.err.status).toEqual(401);
    })
    // // Test case 2 return error 400 if user is not a moderator 
    it('should return an error if the user is not a moderator of the community', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                community_name: "community1"
            }
        }
        communityNameExists.mockResolvedValueOnce({ _id: "community1", moderators: [] });
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        const result = await moderatorLeaveCommunity(request);
        expect(result.err.status).toEqual(400);
        expect(result.err.message).toEqual("User is not a moderator of the community.");
    })
    // // Test case 3 return error 500 
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                community_name: "community1"
            }
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, err: null, status: 200, user: { username: "user1" } });
        communityNameExists.mockRejectedValueOnce(new Error("An error occurred"));
        const result = await moderatorLeaveCommunity(request);
        expect(result.err.status).toEqual(500);
    })

})