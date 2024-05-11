
import { createUsernameMention, getUserSentMessages, getUserUnreadMessagesCount, getMessagesInbox, getUserPostReplies, getAllMessages, getUserMentions } from "../../src/services/messageService.js";
import { Message } from "../../src/db/models/Message.js";

import { verifyAuthToken } from '../../src/controller/userAuth';

jest.mock("../../src/db/models/User");
jest.mock("../../src/controller/userAuth");
jest.mock("../../src/utils/communities.js");
jest.mock("../../src/db/models/User");
jest.mock("../../src/controller/userAuth");
jest.mock("../../src/db/models/Community");
jest.mock("../../src/db/models/Message");
jest.mock("../../src/db/models/Post");
jest.mock("../../src/db/models/Comment");


describe("getUserPostReplies", () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await getUserPostReplies(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await getUserPostReplies(request);
        expect(result.err.status).toBe(500);

    })
})
describe("getUserInbox", () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await getMessagesInbox(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await getMessagesInbox(request);
        expect(result.err.status).toBe(500);

    })

})
describe("getUsernameMentions", () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await getUserMentions(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await getUserMentions(request);
        expect(result.err.status).toBe(500);

    })

})
describe("getAllMessages", () => {
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await getAllMessages(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await getAllMessages(request);
        expect(result.err.status).toBe(500);

    })

})
describe("getUserSentMessages", () => {
    /*const getUserSentMessages = async (request) => {
    try {
        const { success, err, status, user, msg } = await verifyAuthToken(request);
 
        Eif (!user) {
            return { success, err, status, user, msg };
        }
 
        const user_id = user._id;
        const messages = await Message.find({ sender_id: user_id })
 
        let messagesToSend = await Promise.all(messages.map(async (message) => {
            const type = "getUserSentMessages"
            return await mapMessageToFormat(message, user, type);
        }));
        //TODO: FILTER DELETED AT 
        messagesToSend = messagesToSend.filter((message) => message !== null);
 
        return { status: 200, messages: messagesToSend };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}; */
    it('should return an error if the user is not authenticated', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token ' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: false, status: 401, msg: 'error' });
        const result = await getUserSentMessages(request);
        expect(result.status).toBe(401);

    })
    //internal server error 500
    it('should return an error if there is an error in the server', async () => {
        jest.resetAllMocks();
        const request = {
            Headers: { authorization: 'Bearer token' }
        };
        verifyAuthToken.mockResolvedValueOnce({ success: true, status: 200, user: { _id: '123' } });
        Message.find.mockRejectedValueOnce(new Error('error'));
        const result = await getUserSentMessages(request);
        expect(result.err.status).toBe(500);

    })

})
