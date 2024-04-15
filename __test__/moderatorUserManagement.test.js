import { approveUser, getApprovedUsers, muteUser, getMutedUsers, banUser, getBannedUsers, getModerators, getEditableModerators, moderatorLeaveCommunity, addModerator, deleteModerator } from '../src/services/communityUserManagement';
import { User } from '../src/db/models/User';
import { communityNameExists, isUserAlreadyApproved, getApprovedUserView } from '../src/utils/communities';
import { verifyAuthToken } from '../src/controller/userAuth';
jest.mock("../src/utils/communities");
jest.mock("../src/db/models/User");
jest.mock("../src/controller/userAuth");
//TODOS
//1. Test the approveUser function
//2. Test the getApprovedUsers function
//3. Test the muteUser function (mute and unmute user)
//4. Test the getMutedUsers function
//5. Test the unmuteUser function


//7. Test the banUser function (ban and unban user)
//8. Test the getBannedUsers function
//9. Test the getModerators function
//10. Test the getEditableModerators function
//11. Test the moderatorLeaveCommunity function
//12. Test the addModerator function
//13. Test the removeModerator function

describe('approveUser', () => {
    it('should return success if user is approved', async () => {
        // Mock request body
        const requestBody = {
            body: {
                username: 'existingUsername',
                community_name: 'existingCommunityName'
            }
        };
        // Mock user found in database
        const user_to_be_approved = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        //Mock muting user
        const approvingUser = {
            username: 'approvingUser',
        }
        //mock community 
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'approvingUser', has_access: { everything: true, manage_users: true } }],
            save: jest.fn(),
            approved_users: []
        }
        // Mock User.findOne
        User.findOne.mockResolvedValueOnce(user_to_be_approved);
        // Mock verifyAuthToken
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: approvingUser });
        //mock community name exists
        communityNameExists.mockResolvedValueOnce(community);
        //mock moderators.some 
        community.moderators.some = jest.fn().mockReturnValueOnce(true);
        //mock community.moderators.find
        community.moderators.find = jest.fn().mockReturnValueOnce({ has_access: { everything: true, manage_users: true } });
        //mock isuseralreadyapproved
        isUserAlreadyApproved.mockReturnValueOnce(false);
        //excpect the array to be updated
        const result = await approveUser(requestBody);
        expect(result).toEqual({ success: true });
        //excpect the length of the array to be 1
        expect(community.approved_users.length).toBe(1);
    });
    it('should return error if the user is not found', async () => {
        // Mock request body
        const requestBody = {
            body: {
                username: 'existingUsername',
                community_name: 'existingCommunityName'
            }
        };
        // Mock user found in database
        const user_to_be_approved = {
            username: 'nonexistingUsername',
            profile_picture: 'profilePicture',
        };
        //Mock muting user
        const approvingUser = {
            username: 'approvingUser',
        }
        //mock community 
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'approvingUser', has_access: { everything: true, manage_users: true } }],
            save: jest.fn(),
            approved_users: []
        }
        // Mock User.findOne
        User.findOne.mockResolvedValueOnce(undefined);
        // Mock verifyAuthToken
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: approvingUser });
        //mock community name exists
        communityNameExists.mockResolvedValueOnce(community);
        //mock moderators.some 
        community.moderators.some = jest.fn().mockReturnValueOnce(true);
        //mock community.moderators.find
        community.moderators.find = jest.fn().mockReturnValueOnce({ has_access: { everything: true, manage_users: true } });
        //mock isuseralreadyapproved
        isUserAlreadyApproved.mockReturnValueOnce(false);
        //excpect the array to be updated
        const result = await approveUser(requestBody);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Username not found.\s*$/),
            },
        });
    })
    it('should return error if the community is not found', async () => {
        jest.resetAllMocks();
        // Mock request body
        const requestBody = {
            body: {
                username: 'existingUsername',
                community_name: 'existingCommunityName'
            }
        };
        // Mock user found in database
        const user_to_be_approved = {
            username: 'nonexistingUsername',
            profile_picture: 'profilePicture',
        };
        //Mock muting user
        const approvingUser = {
            username: 'approvingUser',
        }
        //mock community 
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'approvingUser', has_access: { everything: true, manage_users: true } }],
            save: jest.fn(),
            approved_users: []
        }
        // Mock User.findOne
        User.findOne.mockResolvedValueOnce(user_to_be_approved);
        // Mock verifyAuthToken
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: approvingUser });
        //mock community name exists
        communityNameExists.mockResolvedValueOnce(undefined);
        //mock moderators.some 
        community.moderators.some = jest.fn().mockReturnValueOnce(true);
        //mock community.moderators.find
        community.moderators.find = jest.fn().mockReturnValueOnce({ has_access: { everything: true, manage_users: true } });
        //mock isuseralreadyapproved
        isUserAlreadyApproved.mockReturnValueOnce(false);
        //excpect the array to be updated
        const result = await approveUser(requestBody);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });
    })

})

describe('getApprovedUsers', () => {
    it('should return the approved users of a community', async () => {
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            approved_users: [{ username: 'existingUsername', approved_at: '2021-05-10T14:48:00.000Z' }],
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        const returned_approved_users = [{
            username: 'existingUsername',
            approved_at: '2021-05-10T14:48:00.000Z',
            profile_picture: 'profilePicture',
        }];
        communityNameExists.mockResolvedValueOnce(community);
        User.findOne.mockResolvedValueOnce(user);
        const result = await getApprovedUsers(community_name);
        expect(result).toEqual({ users: returned_approved_users });

    })
    it('should return error if the community is not found', async () => {
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            approved_users: [{ username: 'existingUsername', approved_at: '2021-05-10T14:48:00.000Z' }],
        };
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await getApprovedUsers(community_name);
        expect(result).toEqual({
            err: {
                status: 500,
                message: "Community not found.",
            },
        });

    })

})

describe("muteUser", () => {
    it("should mute a user", async () => {
        const requestBody = {
            body: {
                community_name: 'existingCommunityName',
                action: 'mute',
                reason: 'reason',
                username: 'existingUsername'
            }
        };
        const mutingUser = {
            username: 'mutingUser',
        };
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'mutingUser', has_access: { everything: true, manage_users: true } }],
            save: jest.fn(),
            muted_users: []
        };
        const user = {
            username: 'existingUsername',
        };
        User.findOne.mockResolvedValueOnce(user);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mutingUser });
        communityNameExists.mockResolvedValueOnce(community);
        const result = await muteUser(requestBody);
        expect(result).toEqual({ success: true });
        expect(community.muted_users).toEqual([{
            username: 'existingUsername',
            muted_by_username: 'mutingUser',
            mute_date: expect.any(Date),
            mute_reason: 'reason',
        }]);
    });
    it("should unmute a user", async () => {
        const requestBody = {
            body: {
                community_name: 'existingCommunityName',
                action: 'unmute',
                username: 'existingUsername'
            }
        };
        const mutingUser = {
            username: 'mutingUser',
        };
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'mutingUser', has_access: { everything: true, manage_users: true } }],
            save: jest.fn(),
            muted_users: [{ username: 'existingUsername' }]
        };
        const user = {
            username: 'existingUsername',
        };
        User.findOne.mockResolvedValueOnce(user);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mutingUser });
        communityNameExists.mockResolvedValueOnce(community);
        const result = await muteUser(requestBody);
        expect(result).toEqual({ success: true });
        expect(community.muted_users).toEqual([]);
    });
    it("should return error if the action is invalid", async () => {
        const requestBody = {
            body: {
                community_name: 'existingCommunityName',
                action: 'invalid',
                username: 'existingUsername'
            }
        };
        const mutingUser = {
            username: 'mutingUser',
        };
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'mutingUser', has_access: { everything: true, manage_users: true } }],
            save: jest.fn(),
            muted_users: [{ username: 'existingUsername' }]
        };
        const user = {
            username: 'existingUsername',
        };
        User.findOne.mockResolvedValueOnce(user);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mutingUser });
        communityNameExists.mockResolvedValueOnce(community);
        const result = await muteUser(requestBody);
        expect(result).toEqual({ err: { status: 400, message: "Invalid action." } });
    });



})
describe('getMutedUsers', () => {
    it('should return the muted users of a community', async () => {
        //reset the mock
        jest.resetAllMocks();
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            muted_users: [{
                username: 'existingUsername',
                muted_by_username: 'mutingUser',
                mute_date: '2021-05-10T14:48:00.000Z',
                mute_reason: 'reason'
            }],
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        User.findOne.mockResolvedValueOnce(user);
        communityNameExists.mockResolvedValueOnce(community);
        const result = await getMutedUsers(community_name);
        expect(result).toEqual({
            users: [{
                username: 'existingUsername',
                muted_by_username: 'mutingUser',
                mute_date: '2021-05-10T14:48:00.000Z',
                mute_reason: 'reason',
                profile_picture: 'profilePicture',

            }],
        })

    })
    it('should return error if the community is not found', async () => {
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            muted_users: [{ username: 'existingUsername', muted_by_username: 'mutingUser', mute_date: '2021-05-10T14:48:00.000Z', mute_reason: 'reason' }],
        };
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await getMutedUsers(community_name);
        expect(result).toEqual({
            err: {
                status: 400,
                message: "Community not found.",
            },
        });

    })


})