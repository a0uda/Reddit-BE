
import { composeNewMessage, createUsernameMention, getUserSentMessages, markMessageAsRead, markAllAsRead, getUserUnreadMessagesCount, deleteMessage } from "../../src/services/messageService.js";
import { Message } from "../../src/db/models/Message.js";
import { User } from '../../src/db/models/User';
import { verifyAuthToken } from '../../src/controller/userAuth';
import { Community } from '../../src/db/models/Community';
import { Comment } from '../../src/db/models/Comment';

jest.mock("../../src/db/models/User");
jest.mock("../../src/controller/userAuth");
jest.mock("../../src/utils/communities.js");
jest.mock("../../src/db/models/User");
jest.mock("../../src/controller/userAuth");
jest.mock("../../src/db/models/Community");
jest.mock("../../src/db/models/Message");
jest.mock("../../src/db/models/Post");
jest.mock("../../src/db/models/Comment");
describe('composeNewMessage', () => {

    //reset all mocks 
    jest.resetAllMocks();
    it('should return an error if the required fields are not provided', async () => {

        const request = {
            body: {
                data: {
                    sender_type: 'moderator',

                    receiver_type: 'user',
                    message: 'message',
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',

            _id: '66356010be06bf92b669eda0'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const result = await composeNewMessage(request, false);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe('Please provide all the required fields');
    })
    it('should return an error if the parent_message_id is not provided , is reply is false', async () => {

        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',

            _id: '66356010be06bf92b669eda0'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const result = await composeNewMessage(request, true);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe('This is a reply Please provide the parent_message_id');
    }
    )
    it('should return an error if the parent_message_id is not provided , is reply is true', async () => {

        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',

            _id: '66356010be06bf92b669eda0'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const result = await composeNewMessage(request, true);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe('This is a reply Please provide the parent_message_id');
    })
    it('should return an error if the senderVia is not provided and the senderType is moderator', async () => {

        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    parent_message_id: 'parent_message_id'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',

            _id: '66356010be06bf92b669eda0'
        }
        //mock community.findOne 
        Community.findOne.mockResolvedValueOnce(null);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const result = await composeNewMessage(request, false);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe('the provided senderVia Community id does not exist');
    })
    it('should return an error if the senderVia is not provided and the senderType is user', async () => {

        const request = {
            body: {
                data: {
                    sender_type: 'user',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    parent_message_id: 'parent_message_id'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',

            _id: '66356010be06bf92b669eda0'
        }
        //mock community.findOne 
        User.findOne.mockResolvedValueOnce(null);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const result = await composeNewMessage(request, false);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe('reciever User does not exist');
    })
    //should reurn error when sender type is moderator and sedner via id is incorrect 
    it('should return an error if the senderVia is not provided and the senderType is moderator', async () => {

        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    parent_message_id: 'parent_message_id'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',

            _id: '66356010be06bf92b669eda0'
        }
        //mock community.findOne 
        Community.findOne.mockResolvedValueOnce(null);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const result = await composeNewMessage(request, false);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe('the provided senderVia Community id does not exist');
    })
    //when sender is moderator and user is not a moderator of the community 
    it('should return an error if the senderType is moderator and the sender is not a moderator of the community', async () => {

        const mockCommunity = {
            moderators: []
        }
        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    parent_message_id: 'parent_message_id',
                    sender_via: 'sender_via'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',

            _id: '66356010be06bf92b669eda0'
        }
        //mock community.findOne 
        Community.findOne.mockResolvedValueOnce(mockCommunity);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const result = await composeNewMessage(request, false);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe('User is not a moderator in this community. Try to send via another community');
    })

    it('should return a success message if the senderType is moderator and the sender is a moderator of the community', async () => {
        jest.resetAllMocks();
        //mock Message.save() 
        Message.save = jest.fn().mockResolvedValueOnce({ success: true, status: 200, msg: 'success' });
        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    sender_via: 'existing_community_id'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockCommunity = {
            _id: '66356010be06bf92b669eda0',
            moderators: ['66356010be06bf92b669eda0'],
            findOne: jest.fn()
        }
        const mockReceiver = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }
        const mockSender = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        mockCommunity.moderators.find = jest.fn().mockReturnValueOnce({ has_access: { everything: true, manage_users: true }, username: 'username' });

        User.findOne = jest.fn().mockResolvedValueOnce(mockReceiver);


        Community.findOne.mockResolvedValueOnce(mockCommunity);
        const result = await composeNewMessage(request, false);

        expect(result.status).toBe(200);
        expect(result.message).toBe('Message sent successfully');
    })
    //test case 2 
    it('should return a success message if the senderType is user and the sender is a user', async () => {
        jest.resetAllMocks();
        //mock Message.save() 
        Message.save = jest.fn().mockResolvedValueOnce({ success: true, status: 200, msg: 'success' });
        const request = {
            body: {
                data: {
                    sender_type: 'user',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockReceiver = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }
        const mockSender = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        User.findOne = jest.fn().mockResolvedValueOnce(mockReceiver);
        const result = await composeNewMessage(request, false);

        expect(result.status).toBe(200);
        expect(result.message).toBe('Message sent successfully');
    })
    //test case 3 
    it('should return a success message if the senderType is user and the receiver is moderator', async () => {
        jest.resetAllMocks();
        //mock Message.save() 
        Message.save = jest.fn().mockResolvedValueOnce({ success: true, status: 200, msg: 'success' });
        const request = {
            body: {
                data: {
                    sender_type: 'user',
                    receiver_username: 'username',
                    receiver_type: 'moderator',
                    message: 'message',
                    subject: 'subject',
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockReceiver = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }
        const mockSender = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }
        const mockCommunity = {
            _id: '66356010be06bf92b669eda0',
            moderators: ['66356010be06bf92b669eda0'],
            muted_users: [],
            name: 'name',
        }
        Community.findOne.mockResolvedValueOnce(mockCommunity);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        User.findOne = jest.fn().mockResolvedValueOnce(mockReceiver);
        const result = await composeNewMessage(request, false);

        expect(result.status).toBe(200);
        expect(result.message).toBe('Message sent successfully');
    })

    //test if isReply is true and parent_message_id is not provided 
    it('should return an error if isReply is true and parent_message_id is not provided', async () => {
        const request = {
            body: {
                data: {
                    sender_type: 'user',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    isReply: true,
                    parent_message_id: null
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }

        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });

        const result = await composeNewMessage(request, true);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe("This is a reply Please provide the parent_message_id");
    })
    //test if isReply is true and parent_message_id is provided but the parent message does not exist 
    it('should return an error if isReply is true and parent_message_id is provided but the parent message does not exist', async () => {
        const request = {
            body: {
                data: {
                    sender_type: 'user',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    isReply: true,
                    parent_message_id: '66356010be06bf92b669eda0'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        const mockSender = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'
        }
        Message.findOne = jest.fn().mockResolvedValueOnce(null);
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });

        const result = await composeNewMessage(request, true);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe("the provided parent_message_id does not exist");
    })
    //should return an error if the user is not authenticated 
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
    })
    //should return an error if the reciever doesnt exist
    /*const whatever = require('whatever');

test('test 1', () => {
  whatever.mockImplementation(() => 'hello');
}); */

    it('should return error if receiver username doesnt exist ', async () => {
        jest.resetAllMocks();
        jest.resetModules();
        //including the required modules 

        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    senderVia: 'community'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const mockSender = {
            username: 'username',
            _id: '66356010be06bf92b669eda4'
        }
        const mockCommunity = {
            _id: '66356010be06bf92b669eda0',
            moderators: [{ username: 'username' }],
            muted_users: [],
            name: 'name',

        }
        const mockReceiver = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'

        }
        //reset all mocks 

        Community.findOne.mockResolvedValueOnce(mockCommunity);
        mockCommunity.moderators.find = jest.fn().mockReturnValueOnce(true);
        //reset the mock function 
        jest.resetAllMocks();
        User.findOne.mockResolvedValueOnce(null);
        const result = await composeNewMessage(request, false);
        expect(result.err.status).toBe(500);

    })


    it('should return internal server error', async () => {


        jest.resetAllMocks();
        jest.resetModules();
        const request = {
            body: {
                data: {
                    sender_type: 'moderator',
                    receiver_username: 'username',
                    receiver_type: 'user',
                    message: 'message',
                    subject: 'subject',
                    senderVia: 'community'
                },
                Headers: {
                    authorization: 'Bearer token'
                }
            },
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, user: mockSender, status: 200, msg: 'success' });
        const mockSender = {
            username: 'username',
            _id: '66356010be06bf92b669eda4'
        }
        const mockCommunity = {
            _id: '66356010be06bf92b669eda0',
            moderators: [{ username: 'username' }],
            muted_users: [],
            name: 'name',

        }
        const mockReceiver = {
            username: 'username',
            _id: '66356010be06bf92b669eda0'

        }
        //reset all mocks 
        jest.resetAllMocks();
        jest.resetModules();

        Community.findOne.mockResolvedValueOnce(mockCommunity);
        mockCommunity.moderators.find = jest.fn().mockReturnValueOnce(true);
        //reset the mock function 
        jest.resetAllMocks();
        User.findOne.mockResolvedValueOnce(null);
        const result = await composeNewMessage(request, false);
        expect(result.err.status).toBe(500);

    })



});

describe('getUserSentMessages', () => {
    //test case 1 
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await getUserSentMessages(request);
        expect(result.status).toBe(401);

    })
    //test case 2
    // it('should return an array of messages if the user is authenticated', async () => {
    //     jest.resetAllMocks();
    //     const request = {
    //         Headers: {
    //             authorization: 'Bearer token'
    //         }

    //     };
    //     const mockUser = {
    //         username: 'username',
    //         _id: '66356010be06bf92b669eda0',
    //         safety_and_privacy_settings: {
    //             blocked_users: ['66356010be06bf92b669eda3', '66356010be06bf92b669eda4'], // Mocking blocked users' IDs
    //             muted_communities: ['66356010be06bf92b669eda5', '66356010be06bf92b669eda6'], // Mocking muted communities' IDs
    //         }
    //     };
    //     const mockReceiver = {
    //         username: 'receiver',
    //         _id: '66356010be06bf92b669eda1'
    //     }
    //     const mockMessage = {
    //         _id: '66356010be06bf92b669eda2',
    //         sender_id: '66356010be06bf92b669eda0',
    //         receiver_id: '66356010be06bf92b669eda1',
    //         message: 'message',
    //         subject: 'subject',
    //         sender_type: 'user',
    //         receiver_type: 'user',
    //         created_at: '2021-09-01T00:00:00.000Z',
    //         unread: true,
    //         is_username_menioned: false,
    //         deleted_at: null,
    //         is_invitation: false,
    //     }
    //     verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
    //     Message.find.mockResolvedValueOnce([mockMessage]);
    //     User.findOne.mockResolvedValueOnce(mockReceiver);
    //     const result = await getUserSentMessages(request);
    //     expect(result.status).toBe(200);
    //     expect(result.messages).toHaveLength(1);
    // })
})

describe('markMessageAsRead', () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await markMessageAsRead(request);
        expect(result.status).toBe(401);
    })
    it('should return an error if the messages are not found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                Messages: ['66356010be06bf92b669eda0']
            },
            Headers: { authorization: 'Bearer token ' }
        };
        const mockUser = {
            username: 'username',
            _id: '66356010be06bf92b669eda0',
            safety_and_privacy_settings: {
                blocked_users: ['66356010be06bf92b669eda3', '66356010be06bf92b669eda4'], // Mocking blocked users' IDs
                muted_communities: ['66356010be06bf92b669eda5']
            }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Message.find = jest.fn().mockResolvedValueOnce([]);
        const result = await markMessageAsRead(request);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe("Messages not found");

    })
    it('should return an array of updated messages if the messages are found', async () => {
        jest.resetAllMocks();
        const request = {
            body: {
                Messages: ['66356010be06bf92b669eda0']
            },
            Headers: { authorization: 'Bearer token' }
        };
        const mockUser = {
            username: 'username',
            _id: '66356010bee06bf92b669eda0',
            safety_and_privacy_settings: {
                blocked_users: ['879987987987987987987987', '66356010be06bf92b669eda4'], // Mocking blocked users' IDs
                muted_communities: ['66356010be06bf92b669eda5']
            }
        };
        const mockMessage = {
            _id: '66356010be06bf92b669eda0',
            sender_id: '66356010be06bf92b669eda1',
            receiver_id: '66356010bee06bf92b669eda0',
            message: 'message',
            subject: 'subject',
            sender_type: 'user',
            receiver_type: 'user',
            created_at: '2021-09-01T00:00:00.000Z',
            unread_flag: true,
            is_username_menioned: false,
            deleted_at: null,
            is_invitation: false,
            save: jest.fn()
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Message.find = jest.fn().mockResolvedValueOnce([mockMessage]);
        const result = await markMessageAsRead(request);
        expect(result.status).toBe(200);
        expect(result.messages).toHaveLength(1);


    }) //new test
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await markMessageAsRead(request);
        expect(result.err.status).toBe(500);

    })

})
describe('markAllAsRead', () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await markAllAsRead(request);
        expect(result.status).toBe(401);
    })
    it('should return sucess if all messages are marked as unread', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' },
        };
        const mockUser = {
            username: 'username',
            _id: '66356010be06bf92b669eda0',
            safety_and_privacy_settings: {
                blocked_users: ['66356010be06bf92b669eda3', '66356010be06bf92b669eda4'], // Mocking blocked users' IDs
                muted_communities: ['66356010be06bf92b669eda5']
            }
        };
        const mockMessage = {
            _id: '66356010be06bf92b669eda0',
            sender_id: '66356010be060bf92b669eda1',
            receiver_id: '66356010be760bf92b669eda0',
            message: 'message',
            subject: 'subject',
            sender_type: 'user',
            receiver_type: 'user',
            created_at: '2021-09-01T00:00:00.000Z',
            unread_flag: true,
            is_username_menioned: false,
            deleted_at: null,
            is_invitation: false,
            save: jest.fn()
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Message.find = jest.fn().mockResolvedValueOnce([mockMessage]);
        const result = await markAllAsRead(request);
        expect(result.status).toBe(200);
        expect(result.message).toBe("All messages marked as read");


    })
    //new test
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await markAllAsRead(request);
        expect(result.err.status).toBe(500);

    })
})

describe('getUserUnreadMessagesCount', () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await getUserUnreadMessagesCount(request);
        expect(result.status).toBe(401);
    })
    it('should return the count of unread messages if the user is authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        const mockUser = {
            username: 'username',
            _id: '66356010be760bf92b669eda0',
            safety_and_privacy_settings: {
                blocked_users: [], // Mocking blocked users' IDs

            }
        };
        const mockMessage1 = {
            _id: '66356010be06bf92b669eda0',
            sender_id: '66356010be060bf92b669eda1',
            receiver_id: '66356010be760bf92b669eda0',
            message: 'message',
            subject: 'subject',
            sender_type: 'user',
            receiver_type: 'user',
            created_at: '2021-09-01T00:00:00.000Z',
            unread_flag: true,
            is_username_mentioned: false,
            deleted_at: null,
            is_invitation: false,
            save: jest.fn()
        };
        const mockMessage2 = {
            _id: '66356010be06bf92b669eda1',
            sender_id: '66356010be060bf92b669eda1',
            receiver_id: '66356010be760bf92b669eda0',
            message: 'message',
            subject: 'subject',
            sender_type: 'user',
            receiver_type: 'user',
            created_at: '2021-09-01T00:00:00.000Z',
            unread_flag: true,
            is_username_mentioned: false,
            deleted_at: null,
            is_invitation: false,
            save: jest.fn()

        };
        const mockMessage3 = {
            _id: '66356010be06bf92b669eda2',
            sender_id: '66356010be060bf92b669eda1',
            receiver_id: '66356010be760bf92b669eda0',
            message: 'message',
            subject: 'subject',
            sender_type: 'user',
            receiver_type: 'user',
            created_at: '2021-09-01T00:00:00.000Z',
            unread_flag: true,
            is_username_mentioned: false,
            deleted_at: null,
            is_invitation: false,
            save: jest.fn()


        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Message.find.mockResolvedValueOnce([mockMessage1, mockMessage2, mockMessage3]);

        const result = await getUserUnreadMessagesCount(request);
        expect(result.status).toBe(200);
        expect(result.count).toBe(3);
    })
    //new test
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await getUserUnreadMessagesCount(request);
        expect(result.err.status).toBe(500);

    })
});

describe('createUsernameMention', () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' },
            body: {
                comment_id: '66356010be06bf92b669eda0',
                mentioned_username: 'username'
            }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await createUsernameMention(request);
        expect(result.status).toBe(401);
    })

    it('should return an error if the comment is not found', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: {
                authorization: 'Bearer token'
            },
            body: {
                comment_id: '66356010be06bf92b669edf0',
                mentioned_username: 'username'
            }
        };
        const mockUser = {
            username: 'username',
            _id: '66356010be760bf92b669eda0',
            safety_and_privacy_settings: {
                blocked_users: [], // Mocking blocked users' IDs
            }
        };
        const mentionedUser = {
            username: 'mentioned_username',
            _id: '66356010be760bf92b669eda1',
            safety_and_privacy_settings: {
                blocked_users: [], // Mocking blocked users' IDs
            }
        }
        const mockComment = {
            _id: "66356010be06bf92b669eda1",
            post_id: '66356010be760bf92b669eda0',
            user_id: '66356010be760bf92b669eda1'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Comment.findOne.mockResolvedValueOnce(null);
        User.findOne.mockResolvedValueOnce(mentionedUser);
        const result = await createUsernameMention(request);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe("Comment not found");
    })
    it('should return an error if the mentioned username is not found', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: {
                authorization: 'Bearer token'
            },
            body: {
                comment_id: '66356010be06bf92b669edf0',
                mentioned_username: 'username'
            }
        };
        const mockUser = {
            username: 'username',
            _id: '66356010be760bf92b669eda0',
            safety_and_privacy_settings: {
                blocked_users: [], // Mocking blocked users' IDs
            }
        };
        const mentionedUser = {
            username: 'mentioned_username',
            _id: '66356010be760bf92b669eda1',
            safety_and_privacy_settings: {
                blocked_users: [], // Mocking blocked users' IDs
            }
        }
        const mockComment = {
            _id: "66356010be06bf92b669eda1",
            post_id: '66356010be760bf92b669eda0',
            user_id: '66356010be760bf92b669eda1'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Comment.findOne.mockResolvedValueOnce(mockComment);
        User.findOne.mockResolvedValueOnce(null);
        const result = await createUsernameMention(request);
        expect(result.err.status).toBe(400);
        expect(result.err.message).toBe("mentioned User not found");
    })
    it('should return success if the user mention is saved successfully', async () => {
        jest.resetAllMocks();

        const request = {
            Headers: { authorization: 'Bearer token ' },
            body: {
                comment_id: '66356010be06bf92b669eda0',
                mentioned_username: 'username'
            }
        };
        const mockUser = {
            username: 'username',
            _id: '66356010be760bf92b669eda0',
            safety_and_privacy_settings: {
                blocked_users: [], // Mocking blocked users' IDs
            },
            save: jest.fn()
        };
        const mentionedUser = {
            username: 'mentioned_username',
            _id: '66356010be760bf92b669eda1',
            safety_and_privacy_settings: {
                blocked_users: [], // Mocking blocked users' IDs
            },
            user_mentions: [],
            save: jest.fn()
        }
        const mockComment = {
            _id: "66356010be06bf92b669eda1",
            post_id: '66356010be760bf92b669eda0',
            user_id: '66356010be760bf92b669eda1'
        }
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Comment.findOne.mockResolvedValueOnce(mockComment);
        User.findOne.mockResolvedValueOnce(mentionedUser);
        const result = await createUsernameMention(request);
        expect(result.status).toBe(200);
        expect(mentionedUser.user_mentions.length).toBe(1);
        expect(mentionedUser.user_mentions[0].sender_username).toBe(mockUser.username);
        expect(mentionedUser.user_mentions[0].unread_flag).toBe(true);
    })
    ////new test
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await createUsernameMention(request);
        expect(result.err.status).toBe(500);
    })
})

describe('deleteMessage', () => {
    it('should return Internal server error', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: {
                authorization: 'Bearer token'
            }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await deleteMessage(request);
        expect(result.status).toBe(401);
    })

    it('should return an error if the message doesnt exist ', async () => {
        jest.resetAllMocks();
        jest.resetModules();
        //re mock the module 

        const { deleteMessage } = require('../../src/services/messageService.js');
        const { verifyAuthToken } = require('../../src/controller/userAuth');
        jest.mock('../../src/db/models/message.js');
        jest.mock('../../src/controller/userAuth');
        const request = {
            Headers: {
                authorization: 'Bearer token'
            }
            ,
            body: { _id: '6635600be06bf92b669eda0' }
        };
        const mockUser = {
            _id: '66356010be760bf92b669eda0'
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: mockUser });
        Message.findById.mockResolvedValueOnce(null);
        const result = await deleteMessage(request);
        expect(result.err.status).toBe(404);
        expect(result.err.message).toBe("Message not found");
    })
    //new test
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await deleteMessage(request);
        expect(result.err.status).toBe(500);
    })
})


