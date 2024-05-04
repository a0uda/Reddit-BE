import { approveUser, getApprovedUsers, muteUser, getMutedUsers, banUser, getBannedUsers, getModerators, getEditableModerators, moderatorLeaveCommunity, addModerator, deleteModerator } from '../../src/services/communityUserManagement';
import { User } from '../../src/db/models/User';
import { communityNameExists, isUserAlreadyApproved, getApprovedUserView } from '../../src/utils/communities';
import { verifyAuthToken } from '../../src/controller/userAuth';
jest.mock("../../src/utils/communities");
jest.mock("../../src/db/models/User");
jest.mock("../../src/controller/userAuth");
//contents:
//1. Test the approveUser function
//2. Test the getApprovedUsers function
//3. Test the muteUser function (mute and unmute user)
//4. Test the getMutedUsers function
//5. Test the unmuteUser function
//7. Test the banUser function (ban and unban user)
//8. Test the getBannedUsers function

//9. Test the getModerators function:
//TODO:
//10. Test the getEditableModerators function :;  getting i not working due to mocking issues
//11. Test the moderatorLeaveCommunity function
//12. Test the addModerator function
//13. Test the removeModerator function




describe('approveUser', () => {
    // it('should return success if user is approved', async () => {
    //     // Mock request body
    //     const requestBody = {
    //         body: {
    //             username: 'existingUsername',
    //             community_name: 'existingCommunityName'
    //         }
    //     };
    //     // Mock user found in database
    //     const user_to_be_approved = {
    //         username: 'existingUsername',
    //         profile_picture: 'profilePicture',
    //         "_id": "66264a48ce0df64ce7205d9a"
    //     };
    //     //Mock muting user
    //     const approvingUser = {
    //         username: 'approvingUser',
    //         "_id": "66264a48ce0df64ce7205d9a"
    //     }
    //     //mock community 
    //     const community = {
    //         name: 'existingCommunityName',
    //         moderators: [{ username: 'approvingUser', has_access: { everything: true, manage_users: true } }],
    //         save: jest.fn(),
    //         approved_users: [],
    //         _id: "66264a48ce0df64ce7205d9a"
    //     }
    //     // Mock User.findOne
    //     User.findOne.mockResolvedValueOnce(user_to_be_approved);
    //     // Mock verifyAuthToken
    //     verifyAuthToken.mockResolvedValueOnce({ success: true, user: approvingUser });
    //     //mock community name exists
    //     communityNameExists.mockResolvedValueOnce(community);
    //     //mock moderators.some 
    //     community.moderators.some = jest.fn().mockReturnValueOnce(true);
    //     //mock community.moderators.find
    //     community.moderators.find = jest.fn().mockReturnValueOnce({ has_access: { everything: true, manage_users: true } });
    //     //mock isuseralreadyapproved
    //     isUserAlreadyApproved.mockReturnValueOnce(false);
    //     //excpect the array to be updated
    //     const result = await approveUser(requestBody);
    //     expect(result).toEqual({ success: true });
    //     //excpect the length of the array to be 1
    //     expect(community.approved_users.length).toBe(1);
    // });
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
                status: 400,
                message: "Community not found.",
            },
        });

    })

})

// describe("muteUser", () => {
//     it("should mute a user", async () => {
//         const requestBody = {
//             body: {
//                 community_name: 'existingCommunityName',
//                 action: 'mute',
//                 reason: 'reason',
//                 username: 'existingUsername'
//             }
//         };
//         const mutingUser = {
//             username: 'mutingUser',
//         };
//         const community = {
//             name: 'existingCommunityName',
//             moderators: [{ username: 'mutingUser', has_access: { everything: true, manage_users: true } }],
//             save: jest.fn(),
//             muted_users: []
//         };
//         const user = {
//             username: 'existingUsername',
//         };
//         User.findOne.mockResolvedValueOnce(user);
//         verifyAuthToken.mockResolvedValueOnce({ success: true, user: mutingUser });
//         communityNameExists.mockResolvedValueOnce(community);
//         const result = await muteUser(requestBody);
//         expect(result).toEqual({ success: true });
//         expect(community.muted_users).toEqual([{
//             username: 'existingUsername',
//             muted_by_username: 'mutingUser',
//             mute_date: expect.any(Date),
//             mute_reason: 'reason',
//         }]);
//     });
//     it("should unmute a user", async () => {
//         const requestBody = {
//             body: {
//                 community_name: 'existingCommunityName',
//                 action: 'unmute',
//                 username: 'existingUsername'
//             }
//         };
//         const mutingUser = {
//             username: 'mutingUser',
//             _id: "6631d561797be615e98df6a4"
//         };
//         const community = {
//             name: 'existingCommunityName',
//             moderators: [{ username: 'mutingUser', has_access: { everything: true, manage_users: true } }],
//             save: jest.fn(),
//             muted_users: [{ username: 'existingUsername' }]
//         };
//         const user = {
//             username: 'existingUsername',
//             _id: "6631d561797be615e98df6a4"
//         };
//         User.findOne.mockResolvedValueOnce(user);
//         verifyAuthToken.mockResolvedValueOnce({ success: true, user: mutingUser });
//         communityNameExists.mockResolvedValueOnce(community);
//         const result = await muteUser(requestBody);
//         expect(result).toEqual({ success: true });
//         expect(community.muted_users).toEqual([]);
//     });
//     it("should return error if the action is invalid", async () => {
//         const requestBody = {
//             body: {
//                 community_name: 'existingCommunityName',
//                 action: 'invalid',
//                 username: 'existingUsername'
//             }
//         };
//         const mutingUser = {
//             username: 'mutingUser',
//         };
//         const community = {
//             name: 'existingCommunityName',
//             moderators: [{ username: 'mutingUser', has_access: { everything: true, manage_users: true } }],
//             save: jest.fn(),
//             muted_users: [{ username: 'existingUsername' }]
//         };
//         const user = {
//             username: 'existingUsername',
//         };
//         User.findOne.mockResolvedValueOnce(user);
//         verifyAuthToken.mockResolvedValueOnce({ success: true, user: mutingUser });
//         communityNameExists.mockResolvedValueOnce(community);
//         const result = await muteUser(requestBody);
//         expect(result).toEqual({ err: { status: 400, message: "Invalid action." } });
//     });



// })
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

describe('banUser', () => {
    //reset the mock
    jest.resetAllMocks();
    // it('should ban a user from a community', async () => {
    //     const requestBody = {
    //         body: {
    //             username: 'existingUsername',
    //             community_name: 'existingCommunityName',
    //             action: 'ban',
    //             reason_for_ban: 'reason',
    //             mod_note: 'modNote',
    //             permanent_flag: true,
    //             note_for_ban_message: 'noteForBanMessage',
    //             banned_until: '2021-05-10T14:48:00.000Z'
    //         }
    //     };
    //     const banningUser = {
    //         username: 'banningUser',
    //         _id: "6631d561797be615e98df6a4"
    //     };
    //     const community = {
    //         name: 'existingCommunityName',
    //         moderators: [{ username: 'banningUser', has_access: { everything: true, manage_users: true } }],
    //         save: jest.fn(),
    //         banned_users: [],
    //         _id: "66264a48ce0df64ce7205d9a",
    //     };
    //     const user = {
    //         username: 'existingUsername',
    //         _id: "6631d561797be615e98df6a4"
    //     };
    //     User.findOne.mockResolvedValueOnce(user);
    //     verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser });
    //     communityNameExists.mockResolvedValueOnce(community);
    //     const result = await banUser(requestBody);
    //     expect(result).toEqual({ success: true });
    //     expect(community.banned_users).toEqual([{
    //         username: 'existingUsername',
    //         banned_date: community.banned_users[0].banned_date,
    //         reason_for_ban: 'reason',
    //         mod_note: 'modNote',
    //         permanent_flag: true,
    //         banned_until: '2021-05-10T14:48:00.000Z',
    //         note_for_ban_message: 'noteForBanMessage',
    //     }]);
    // });
    //     it('should unban a user from a community', async () => {
    //         jest.resetAllMocks();


    //         const requestBody = {
    //             body: {
    //                 username: 'existingUsername',
    //                 community_name: 'existingCommunityName',
    //                 action: 'unban',
    //             }
    //         };
    //         const banningUser = {
    //             username: 'banningUser',
    //             _id: '6631d561797be615e98df6a4'
    //         };
    //         let community = {
    //             name: 'existingCommunityName',
    //             moderators: [{ username: 'banningUser', has_access: { everything: true, manage_users: true } }],
    //             save: jest.fn(),
    //             banned_users: [{ username: 'existingUsername' }],
    //             "_id": "66264a48ce0df64ce7205d9a"
    //         };
    //         const user = {
    //             username: 'existingUsername',
    //             //mock mongo id  to compare with the real mongo id 

    //             _id: "6631d561797be615e98df6a4"
    //         }
    //         User.findOne.mockResolvedValueOnce(user);
    //         verifyAuthToken.mockResolvedValueOnce({ success: true, user: banningUser });
    //         //  communityNameExists.mockResolvedValueOnce(community); lama ba uncomment da by fail el test el ablo??????????
    //         communityNameExists.mockResolvedValueOnce(community);
    //         const result = await banUser(requestBody);
    //         expect(result).toEqual({ success: true });
    //         expect(community.banned_users).toEqual([]);
    //     });


})
describe('getBannedUsers', () => {
    it('should return the banned users of a community', async () => {
        //reset the mock
        jest.resetAllMocks();
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            banned_users: [{
                username: 'existingUsername',
                banned_date: '2021-05-10T14:48:00.000Z',
                reason_for_ban: 'reason',
                mod_note: 'modNote',
                permanent_flag: true,
                banned_until: '2021-05-10T14:48:00.000Z',
                note_for_ban_message: 'noteForBanMessage'
            }],
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        User.findOne.mockResolvedValueOnce(user);
        communityNameExists.mockResolvedValueOnce(community);
        const result = await getBannedUsers(community_name);
        expect(result).toEqual({
            users: [{
                username: 'existingUsername',
                banned_date: '2021-05-10T14:48:00.000Z',
                reason_for_ban: 'reason',
                mod_note: 'modNote',
                permanent_flag: true,
                banned_until: '2021-05-10T14:48:00.000Z',
                note_for_ban_message: 'noteForBanMessage',
                profile_picture: 'profilePicture',

            }],
        })

    })
    it('should return error if the community is not found', async () => {
        //reset the mock
        jest.resetAllMocks();
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            banned_users: [{ username: 'existingUsername', banned_date: '2021-05-10T14:48:00.000Z', reason_for_ban: 'reason', mod_note: 'modNote', permanent_flag: true, banned_until: '2021-05-10T14:48:00.000Z', note_for_ban_message: 'noteForBanMessage' }],
        };
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await getBannedUsers(community_name);
        expect(result).toEqual({
            err: {
                status: 400,
                message: "Community not found.",
            },
        });

    })

})

describe('getModerators', () => {
    it('should return the moderators of a community', async () => {
        jest.resetAllMocks();
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'existingUsername', moderator_since: '2021-05-10T14:48:00.000Z', has_access: { everything: true, manage_users: true } }],
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        User.findOne.mockResolvedValueOnce(user);
        communityNameExists.mockResolvedValueOnce(community);
        const result = await getModerators(community_name);
        expect(result).toEqual({
            returned_moderators: [{
                username: 'existingUsername',
                profile_picture: 'profilePicture',
                moderator_since: '2021-05-10T14:48:00.000Z',
                has_access: { everything: true, manage_users: true },
            }],
        });
    });
    it('should return error if the community is not found', async () => {
        jest.resetAllMocks();
        const community_name = 'existingCommunityName';
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await getModerators(community_name);
        expect(communityNameExists).toHaveBeenCalledWith(community_name);

        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });
    });
    it('should return error if an error occurs', async () => {
        jest.resetAllMocks();
        const community_name = 'existingCommunityName';
        const community = {
            name: 'existingCommunityName',
            moderators: [{ username: 'existingUsername', moderator_since: '2021-05-10T14:48:00.000Z', has_access: { everything: true, manage_users: true } }],
        };
        communityNameExists.mockResolvedValueOnce(community);
        User.findOne.mockRejectedValueOnce(new Error('error occurred'));
        const result = await getModerators(community_name);
        expect(communityNameExists).toHaveBeenCalledWith(community_name);
        expect(User.findOne).toHaveBeenCalledWith({ username: 'existingUsername' });

        expect(result.err.status).toEqual(500);

    });

})
describe('getEditableModerators', () => {
    it('should return error if the user is not a moderator of the community', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: 'existingCommunityName',
            },
            headers: {
                authorization: 'Bearer token',
            },
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        const community = {
            name: 'existingCommunityName',
            moderators: [
                { username: 'existingUsername2', moderator_since: '2021-05-11T14:48:00.000Z', has_access: { everything: true, manage_users: true } },
            ],
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, user });
        User.findOne.mockResolvedValueOnce(user);
        communityNameExists.mockResolvedValueOnce(community);
        const result = await getEditableModerators(request);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^User is not a moderator of the community.\s*$/),
            },
        });
    });

    it('should return error if the community is not found', async () => {
        jest.resetAllMocks();
        const request = {
            params: {
                community_name: 'existingCommunityName',
            },
            headers: {
                authorization: 'Bearer token',
            },
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',

        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user });
        User.findOne.mockResolvedValueOnce(user);
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await getEditableModerators(request);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });
    });
});

describe('moderatorLeaveCommunity', () => {
    // it('should return success if the user is a moderator of the community', async () => {
    //     jest.resetAllMocks();
    //     const request = {
    //         body: {
    //             community_name: 'existingCommunityName',
    //         },
    //         headers: {
    //             authorization: 'Bearer token',
    //         },
    //     };
    //     const user = {
    //         username: 'existingUsername',
    //         profile_picture: 'profilePicture',
    //         moderated_communities: ['existingCommunityName'],
    //     };
    //     const community = {
    //         name: 'existingCommunityName',
    //         moderators: [
    //             { username: 'existingUsername', moderator_since: '2021-05-11T14:48:00.000Z', has_access: { everything: true, manage_users: true } },
    //         ],
    //         save: jest.fn(),
    //     };
    //     verifyAuthToken.mockResolvedValueOnce({ success: true, user });
    //     User.findOne.mockResolvedValueOnce(user);
    //     communityNameExists.mockResolvedValueOnce(community);
    //     const result = await moderatorLeaveCommunity(request);
    //     expect(result).toEqual({ success: true });
    //     expect(community.save).toHaveBeenCalled();
    // });

    it('should return error if the user is not a moderator of the community', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                community_name: 'existingCommunityName',
            },
            headers: {
                authorization: 'Bearer token',
            },
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        const community = {
            name: 'existingCommunityName',
            moderators: [
                { username: 'existingUsername2', moderator_since: '2021-05-11T14:48:00.000Z', has_access: { everything: true, manage_users: true } },
            ],
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, user });
        User.findOne.mockResolvedValueOnce(user);
        communityNameExists.mockResolvedValueOnce(community);
        const result = await moderatorLeaveCommunity(request);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^User is not a moderator of the community.\s*$/),
            },
        });
    });

    it('should return error if the community is not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                community_name: 'existingCommunityName',
            },
            headers: {
                authorization: 'Bearer token',
            },
        };
        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, user });
        User.findOne.mockResolvedValueOnce(user);
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await moderatorLeaveCommunity(request);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });
    });

})

describe('addModerator', () => {
    // it('should return success if the user is not a moderator of the community', async () => {
    //     jest.resetAllMocks();
    //     const requestBody = {
    //         community_name: 'existingCommunityName',
    //         username: 'existingUsername',
    //         has_access: {
    //             everything: true,
    //             manage_users: true,
    //             manage_settings: true,
    //             manage_posts_and_comments: true,
    //         },
    //     };
    //     const community = {
    //         name: 'existingCommunityName',
    //         moderators: [],
    //         save: jest.fn(),
    //     };
    //     const user = {
    //         username: 'existingUsername',
    //     };
    //     communityNameExists.mockResolvedValueOnce(community);
    //     User.findOne.mockResolvedValueOnce(user);
    //     const result = await addModerator(requestBody);
    //     expect(result).toEqual({ success: true });
    //     expect(community.moderators).toEqual([{
    //         username: user.username,
    //         moderator_since: expect.any(Date),
    //         has_access: {
    //             everything: requestBody.has_access.everything,
    //             manage_users: requestBody.has_access.manage_users,
    //             manage_settings: requestBody.has_access.manage_settings,
    //             manage_posts_and_comments: requestBody.has_access.manage_posts_and_comments,
    //         },
    //     }]);
    //     expect(community.save).toHaveBeenCalled();
    // });
    // TODO: test if the user is already a moderator of the community



    it('should return error if the community is not found', async () => {

        //add the verify auth token mock 
        jest.resetAllMocks();
        const request = {
            headers: {
                authorization: 'Bearer token',
            },
            body: {
                community_name: 'existingCommunityName',
                username: 'existingUsername',
                has_access: {
                    everything: true,
                    manage_users: true,
                    manage_settings: true,
                    manage_posts_and_comments: true,
                },
                _id: '123456789012345678901234'

            }
        };

        const user = {
            username: 'existingUsername',
            profile_picture: 'profilePicture',
            _id: '123456789012345678901234'
        };
        const requestBody = request.body;
        verifyAuthToken.mockResolvedValueOnce({ success: true, user });
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await addModerator(request);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });
    });
})
describe('deleteModerator', () => {
    // it('should return success if the user is a moderator of the community', async () => {
    //     jest.resetAllMocks();
    //     const requestBody = {
    //         community_name: 'existingCommunityName',
    //         username: 'existingUsername',
    //     };
    //     const community = {
    //         name: 'existingCommunityName',
    //         moderators: [
    //             { username: 'existingUsername', moderator_since: '2021-05-11T14:48:00.000Z', has_access: { everything: true, manage_users: true } },
    //         ],
    //         save: jest.fn(),
    //     };
    //     const user = {
    //         username: 'existingUsername',
    //     };
    //     communityNameExists.mockResolvedValueOnce(community);
    //     User.findOne.mockResolvedValueOnce(user);
    //     const result = await deleteModerator(requestBody);
    //     expect(result).toEqual({ success: true });
    //     expect(community.moderators).toEqual([]);
    //     expect(community.save).toHaveBeenCalled();
    // });


    it('should return error if the community is not found', async () => {
        jest.resetAllMocks();
        const requestBody = {
            community_name: 'existingCommunityName',
            username: 'existingUsername',
        };
        communityNameExists.mockResolvedValueOnce(undefined);
        const result = await deleteModerator(requestBody);
        expect(result).toEqual({
            err: {
                status: 400,
                message: expect.stringMatching(/^Community not found.\s*$/),
            },
        });
    });
})
