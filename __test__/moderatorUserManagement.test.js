import { approveUser, getApprovedUsers, muteUser, getMutedUsers } from '../src/services/communityUserManagement';
import { User } from '../src/db/models/User';
import { communityNameExists, isUserAlreadyApproved, getApprovedUserView } from '../src/utils/communities';
import { verifyAuthToken } from '../src/controller/userAuth';
jest.mock("../src/utils/communities");
jest.mock("../src/db/models/User");
jest.mock("../src/controller/userAuth");

describe('approveUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should approve user successfully', async () => {
        // Mock request body
        const requestBody = {
            username: 'existingUsername',
            community_name: 'existingCommunityName'
        };
        const mockCommunity = {
            save: jest.fn(),
            approved_users: ['userId']
        };
        const mockUser = {
            profile_picture: 'profilePicture',
            username: 'existingUsername',
            approved_at: new Date()
        };
        // Mock user found in database
        User.findOne.mockResolvedValueOnce({ _id: 'userId' });
        getApprovedUserView.mockResolvedValueOnce(mockUser);
        // Mock community exists
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        // Mock user is not already approved
        isUserAlreadyApproved.mockReturnValueOnce(false);
        // Call the function and assert the result
        const result = await approveUser(requestBody);
        expect(result).toEqual({ success: true });

        // Ensure User.findOne was called with correct parameters
        expect(User.findOne).toHaveBeenCalledWith({ username: 'existingUsername' });

        // Ensure communityNameExists was called with correct parameters
        expect(communityNameExists).toHaveBeenCalledWith('existingCommunityName');

        // Ensure community.save was called
        expect(mockCommunity.save).toHaveBeenCalled();
    });
    it('should return error if username does not exist', async () => {
        // Mock request body
        const requestBody = {
            username: 'nonExistingUsername',
            community_name: 'existingCommunityName'
        };
        // Mock user not found in database
        User.findOne.mockResolvedValueOnce(null);

        // Call the function and assert the result
        const result = await approveUser(requestBody);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Username not found.\s*$/),
            },
        });

        // Ensure User.findOne was called with correct parameters
        expect(User.findOne).toHaveBeenCalledWith({ username: 'nonExistingUsername' });
    });
});
describe('getApprovedUsers', () => {
    it('should return approved users', async () => {
        // Mock request body
        const requestBody = {
            community_name: 'existingCommunityName'
        };
        const mockCommunity = {
            save: jest.fn(),
            approved_users: [{
                profile_picture: 'profilePicture',
                username: 'existingUsername',

            }]
        };
        const mockUser = {
            profile_picture: 'profilePicture',
            username: 'existingUsername',
        };
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        getApprovedUserView.mockResolvedValueOnce(mockUser);
        const result = await getApprovedUsers(requestBody);
        expect(communityNameExists).toHaveBeenCalledWith({ community_name: 'existingCommunityName' });
    });

    it('should return 500 and err message if community does not exist', async () => {
        // Mock request body
        const requestBody = {
            community_name: 'nonExistingCommunityName'
        };
        // Mock community does not exist
        communityNameExists.mockResolvedValueOnce(null);
        // Call the function and assert the result
        const result = await getApprovedUsers(requestBody);
        expect(result).toEqual({
            err: {
                status: 500,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });

        // Ensure communityNameExists was called with correct parameters
        expect(communityNameExists).toHaveBeenCalledWith({ community_name: 'nonExistingCommunityName' });
    });
});

describe("Mute and unmute users", () => {
    it("should mute user successfully", async () => {
        // Mock request body
        const request = {
            body: {
                username: 'existingUsername',
                community_name: 'existingCommunityName',
                reason: 'reason',
                action: 'mute'
            }

        }
        const mockCommunity = {
            save: jest.fn(),
            approved_users: []
        };
        const date = new Date();
        const mockUser = {
            profile_picture: 'profilePicture',
            username: 'existingUsername',

        };
        const mutingUser = {
            username: 'mutingUsername'
        }
        const verifyAuthTokenMockReturn = {
            success: true,
            user: mutingUser
        }
        verifyAuthToken.mockReturnValueOnce(verifyAuthTokenMockReturn)
        User.findOne.mockResolvedValueOnce(mockUser);
        communityNameExists.mockResolvedValueOnce(mockCommunity);

        // Call the function and assert the result
        const result = await muteUser(request);
        expect(result).toEqual({ success: true });

        // Ensure User.findOne was called with correct parameters
        expect(User.findOne).toHaveBeenCalledWith({ username: 'existingUsername' });

        // Ensure communityNameExists was called with correct parameters
        expect(communityNameExists).toHaveBeenCalledWith('existingCommunityName');

        // Ensure community.save was called
        expect(mockCommunity.save).toHaveBeenCalled();
    });
    it("should return errorr 400 username not found when entering wrong username ", async () => {
        const request = {
            body: {
                username: 'nonExistingUsername',
                community_name: 'existingCommunityName',
                reason: 'reason',
                action: 'mute'
            }
        }
        const mutingUser = {
            username: 'mutingUsername'
        }
        const verifyAuthTokenMockReturn = {
            success: true,
            user: mutingUser
        }
        communityNameExists.mockResolvedValueOnce(true);
        verifyAuthToken.mockReturnValueOnce(verifyAuthTokenMockReturn)
        User.findOne.mockResolvedValueOnce(null);
        const result = await muteUser(request);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Username not found.\s*$/),
            },
        });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'nonExistingUsername' });

    })
    it("should return errorr 400 community not found when entering wrong community name ", async () => {
        const request = {
            body: {
                username: 'ExistingUsername',
                community_name: 'nonexistingCommunityName',
                reason: 'reason',
                action: 'mute'
            }
        }
        const mutingUser = {
            username: 'mutingUsername'
        }
        const verifyAuthTokenMockReturn = {
            success: true,
            user: mutingUser
        }
        communityNameExists.mockResolvedValueOnce(null);
        verifyAuthToken.mockReturnValueOnce(verifyAuthTokenMockReturn)
        User.findOne.mockResolvedValueOnce(null);
        const result = await muteUser(request);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });
    });

    it("should unmute user successfully", async () => {
        //reset the mock
        jest.resetAllMocks();

        // Mock request body
        const request = {
            body: {
                username: 'existingUsername',
                community_name: 'existingCommunityName',
                reason: 'reason',
                action: 'unmute'
            }

        }
        const mockCommunity = {
            save: jest.fn(),
            muted_users: [
                {
                    username: 'existingUsername',
                    mute_reason: 'reason',
                    profile_picture: 'profilePicture',
                    mute_date: new Date(),
                    muted_by_username: 'mutingUsername'
                }
            ]
        };

        const mockUser = {
            profile_picture: 'profilePicture',
            username: 'existingUsername',

        };
        const mutingUser = {
            username: 'mutingUsername'
        }
        const verifyAuthTokenMockReturn = {
            success: true,
            user: mutingUser
        }
        verifyAuthToken.mockReturnValueOnce(verifyAuthTokenMockReturn)
        User.findOne.mockResolvedValueOnce(mockUser);
        communityNameExists.mockResolvedValueOnce(mockCommunity);

        // Call the function and assert the result
        const result = await muteUser(request);
        expect(result).toEqual({ success: true });

        // Ensure User.findOne was called with correct parameters
        expect(User.findOne).toHaveBeenCalledWith({ username: 'existingUsername' });

        // Ensure communityNameExists was called with correct parameters
        expect(communityNameExists).toHaveBeenCalledWith('existingCommunityName');
        expect(mockCommunity.muted_users).toEqual([]);
        // Ensure community.save was called
        expect(mockCommunity.save).toHaveBeenCalled();
    });
    it("should return all muted users", async () => {
        const request = {
            body: {
                community_name: 'existingCommunityName',
            }
        }
        const date = new Date()
        const mockCommunity = {

            muted_users: [
                {
                    username: 'existingUsername',
                    mute_reason: 'reason',
                    profile_picture: 'profilePicture',
                    mute_date: date,
                    muted_by_username: 'mutingUsername'
                }
            ]
        };
        communityNameExists.mockResolvedValueOnce(mockCommunity);
        const result = await getMutedUsers(request);
        expect(result).toEqual({ users: mockCommunity.muted_users });

    })


})