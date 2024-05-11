import { User } from "../../src/db/models/User.js";
import MessageModel from "../../src/db/models/MessageModel.js";
import ChatModel from "../../src/db/models/ChatModel.js";
import { sendMessage, getMessages, reportMessage, removeMessage, getSideBarChats } from "../../src/services/chatService.js";

jest.mock("../../src/db/models/User.js");
jest.mock("../../src/db/models/MessageModel.js");
jest.mock("../../src/db/models/ChatModel.js");

describe("sendMessage", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return an error if receiver does not exist", async () => {
        User.findOne.mockResolvedValue(null);
        const result = await sendMessage({ username: "sender" }, "receiver", "message");
        expect(result).toEqual({ err: { status: 404, message: 'Either the receiver or sender does not exist in the system' } });
    });

    it("should return an error if sender does not exist", async () => {
        const result = await sendMessage(null, "receiver", "message");
        expect(result).toEqual({ err: { status: 404, message: 'Either the receiver or sender does not exist in the system' } });
    });

    it("should return an error if sender is the same as receiver", async () => {
        User.findOne.mockResolvedValue({ username: "user" });
        const result = await sendMessage({ username: "user" }, "user", "message");
        expect(result).toEqual({ err: { status: 400, message: 'A user cannot send a message to themselves' } });
    });

    it("should return an error if message is not provided", async () => {
        User.findOne.mockResolvedValue({ username: "receiver" });
        const result = await sendMessage({ username: "sender" }, "receiver", "");
        expect(result).toEqual({ err: { status: 400, message: 'The message attribute must be provided in the request body.' } });
    });

    it("should return an error if new message creation fails", async () => {
        User.findOne.mockResolvedValue({ username: "receiver" });
        const mockMessage = new MessageModel();
        mockMessage.save = jest.fn().mockRejectedValue(new Error());
        MessageModel.mockImplementation(() => mockMessage);
        const result = await sendMessage({ username: "sender" }, "receiver", "message");
        expect(result).toEqual({ err: { status: 500, message: 'An error occurred while saving the chat or message' } });
    });

    // Add more tests for other error scenarios and successful message sending
    it("should return an error if finding receiver fails", async () => {
        User.findOne.mockImplementation(() => {
            throw new Error();
        });
        const result = await sendMessage({ username: "sender" }, "receiver", "message");
        expect(result).toEqual({ err: { status: 500, message: `Error finding receiver with username: receiver` } });
    });

    it("should return an error if finding or updating chat fails", async () => {
        User.findOne.mockResolvedValue({ username: "receiver" });
        ChatModel.findOneAndUpdate.mockImplementation(() => {
            throw new Error();
        });
        const result = await sendMessage({ username: "sender" }, "receiver", "message");
        expect(result).toEqual({ err: { status: 500, message: 'An error occurred while trying to find or update the chat' } });
    });

    it("should return an error if creating a new chat fails", async () => {
        User.findOne.mockResolvedValue({ username: "receiver" });
        ChatModel.create.mockImplementation(() => {
            throw new Error();
        });
        const result = await sendMessage({ username: "sender" }, "receiver", "message");
        expect(result).toEqual({ err: { status: 500, message: 'An error occurred while creating a new chat' } });
    });
});

describe("getMessages", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return an error if finding receiver fails", async () => {
        User.findOne.mockImplementation(() => {
            throw new Error();
        });
        const result = await getMessages({ username: "sender" }, "receiver");
        expect(result).toEqual({ err: { status: 500, message: `Error occurred while trying to find the receiver with username: receiver` } });
    });

    it("should return an error if sender or receiver does not exist", async () => {
        User.findOne.mockResolvedValue(null);
        const result = await getMessages(null, "receiver");
        expect(result).toEqual({ err: { status: 404, message: 'Either the sender or the receiver does not exist in the system' } });
    });

    it("should return an error if sender is the same as receiver", async () => {
        User.findOne.mockResolvedValue({ _id: "user" });
        const result = await getMessages({ _id: "user" }, "user");
        expect(result).toEqual({ err: { status: 400, message: 'A user cannot retrieve messages with themselves' } });
    });

    it("should return an error if finding chat fails", async () => {
        User.findOne.mockResolvedValue({ _id: "receiver" });
        ChatModel.findOne.mockImplementation(() => {
            throw new Error();
        });
        const result = await getMessages({ _id: "sender" }, "receiver");
        expect(result).toEqual({ err: { status: 500, message: 'An error occurred while trying to find the chat between the sender and receiver' } });
    });

    it("should return an error if finding chat fails", async () => {
        User.findOne.mockResolvedValue({ _id: "receiver" });
        ChatModel.findOne.mockImplementation(() => {
            throw new Error();
        });
        const result = await getMessages({ _id: "sender" }, "receiver");
        expect(result).toEqual({ err: { status: 500, message: 'An error occurred while trying to find the chat between the sender and receiver' } });
    });

    it("should return messages if chat exists between sender and receiver", async () => {
        const mockMessages = [
            { senderId: "sender", receiverId: "receiver", text: "Hello" },
            { senderId: "receiver", receiverId: "sender", text: "Hi" },
        ];
        const mockChat = {
            messages: mockMessages,
            populate: jest.fn().mockReturnThis(),
        };
        User.findOne.mockResolvedValue({ _id: "receiver" });
        ChatModel.findOne.mockImplementation(() => mockChat);
        const result = await getMessages({ _id: "sender" }, "receiver");
        expect(result).toEqual({ messages: mockMessages });
    });
});

describe("getMessages", () => {
    it("should return an error if finding chat fails", async () => {
        User.findOne.mockResolvedValue({ _id: "receiver" });
        ChatModel.findOne.mockImplementation(() => {
            throw new Error();
        });
        const result = await getMessages({ _id: "sender" }, "receiver");
        expect(result).toEqual({ err: { status: 500, message: 'An error occurred while trying to find the chat between the sender and receiver' } });
    });

    it("should return messages if chat exists between sender and receiver", async () => {
        const mockMessages = [
            { senderId: "sender", receiverId: "receiver", text: "Hello" },
            { senderId: "receiver", receiverId: "sender", text: "Hi" },
        ];
        const mockChat = {
            messages: mockMessages,
            populate: jest.fn().mockReturnThis(),
        };
        User.findOne.mockResolvedValue({ _id: "receiver" });
        ChatModel.findOne.mockImplementation(() => mockChat);
        const result = await getMessages({ _id: "sender" }, "receiver");
        expect(result).toEqual({ messages: mockMessages });
    });
});

describe("reportMessage", () => {
    it("should return an error if messageId, reason, or reportingUserId is missing", async () => {
        const result = await reportMessage(null, "spam", "user1");
        expect(result).toEqual({ err: { status: 400, message: 'Message ID, reason for reporting, or reporting user ID is missing' } });
    });

    it("should return an error if the reason is invalid", async () => {
        const validReasons = ['spam', 'abuse'];
        MessageModel.schema.path = jest.fn().mockReturnValue({ enumValues: validReasons });

        const result = await reportMessage("message1", "invalidReason", "user1");
        expect(result).toEqual({ err: { status: 400, message: `Invalid report reason. Valid reasons are: ${validReasons.join(', ')}` } });
    });

    it("should return an error if finding the message fails", async () => {
        MessageModel.findOne = jest.fn().mockImplementation(() => {
            throw new Error();
        });

        const result = await reportMessage("message1", "spam", "user1");
        expect(result).toEqual({ err: { status: 500, message: `Error occurred while trying to find the message with ID: message1` } });
    });

    it("should return an error if no message is found with the given ID", async () => {
        MessageModel.findOne = jest.fn().mockResolvedValue(null);

        const result = await reportMessage("message1", "spam", "user1");
        expect(result).toEqual({ err: { status: 404, message: `No message found with the ID: message1` } });
    });

    it("should return an error if the reporting user is not the receiver of the message", async () => {
        const mockMessage = { receiverId: "user2", reported: {} };
        MessageModel.findOne = jest.fn().mockResolvedValue(mockMessage);

        const result = await reportMessage("message1", "spam", "user1");
        expect(result).toEqual({ err: { status: 403, message: 'You are not the receiver of this message and hence not allowed to report it' } });
    });

    it("should return an error if saving the message fails", async () => {
        const mockMessage = { receiverId: "user1", reported: {}, save: jest.fn().mockImplementation(() => { throw new Error(); }) };
        MessageModel.findOne = jest.fn().mockResolvedValue(mockMessage);

        const result = await reportMessage("message1", "spam", "user1");
        expect(result).toEqual({ err: { status: 500, message: 'Error occurred while saving the message' } });
    });

    it("should return a success message if the message is reported successfully", async () => {
        const mockMessage = { receiverId: "user1", reported: {}, save: jest.fn().mockResolvedValue() };
        MessageModel.findOne = jest.fn().mockResolvedValue(mockMessage);

        const result = await reportMessage("message1", "spam", "user1");
        expect(result).toEqual({ successMessage: 'Message reported successfully' });
    });
});

describe('removeMessage', () => {
  it('should return an error if messageId is missing', async () => {
    const result = await removeMessage(null, 'user1');
    expect(result).toEqual({ err: { status: 400, message: 'Message ID is missing' } });
  });

  it('should return an error if finding the message fails', async () => {
    MessageModel.findOne.mockImplementation(() => {
      throw new Error();
    });
    const result = await removeMessage('message1', 'user1');
    expect(result).toEqual({ err: { status: 500, message: 'Error occurred while trying to find the message with ID: message1' } });
  });

  it('should return an error if no message is found with the given ID', async () => {
    MessageModel.findOne.mockResolvedValue(null);
    const result = await removeMessage('message1', 'user1');
    expect(result).toEqual({ err: { status: 404, message: 'No message found with the ID: message1' } });
  });

  it('should return an error if the removing user is not the sender of the message', async () => {
    const mockMessage = { senderId: 'user2', removed: { flag: false }, save: jest.fn() };
    MessageModel.findOne.mockResolvedValue(mockMessage);
    const result = await removeMessage('message1', 'user1');
    expect(result).toEqual({ err: { status: 403, message: 'You are not the sender of this message and hence not allowed to remove it' } });
  });

  it('should return an error if finding the chat fails', async () => {
    const mockMessage = { senderId: 'user1', removed: { flag: false }, save: jest.fn() };
    MessageModel.findOne.mockResolvedValue(mockMessage);
    ChatModel.findOne.mockImplementation(() => {
      throw new Error();
    });
    const result = await removeMessage('message1', 'user1');
    expect(result).toEqual({ err: { status: 500, message: 'Error occurred while trying to find the chat containing the message with ID: message1' } });
  });

  it('should return an error if saving the chat fails', async () => {
    const mockMessage = { senderId: 'user1', removed: { flag: false }, save: jest.fn() };
    const mockChat = { lastMessage: 'message1', messages: ['message1'], save: jest.fn().mockImplementation(() => { throw new Error(); }) };
    MessageModel.findOne.mockResolvedValue(mockMessage);
    ChatModel.findOne.mockResolvedValue(mockChat);
    const result = await removeMessage('message1', 'user1');
    expect(result).toEqual({ err: { status: 500, message: 'Error occurred while saving the chat' } });
  });

  it('should return an error if saving the message fails', async () => {
    const mockMessage = { senderId: 'user1', removed: { flag: false }, save: jest.fn().mockImplementation(() => { throw new Error(); }) };
    const mockChat = { lastMessage: 'message1', messages: ['message1'], save: jest.fn() };
    MessageModel.findOne.mockResolvedValue(mockMessage);
    ChatModel.findOne.mockResolvedValue(mockChat);
    const result = await removeMessage('message1', 'user1');
    expect(result).toEqual({ err: { status: 500, message: 'Error occurred while saving the message' } });
  });

  it('should return a success message if the message is removed successfully', async () => {
    const mockMessage = { senderId: 'user1', removed: { flag: false }, save: jest.fn() };
    const mockChat = { lastMessage: 'message1', messages: ['message1'], save: jest.fn() };
    MessageModel.findOne.mockResolvedValue(mockMessage);
    ChatModel.findOne.mockResolvedValue(mockChat);
    const result = await removeMessage('message1', 'user1');
    expect(result).toEqual({ successMessage: 'Message removed successfully' });
  });
});

describe('getSideBarChats', () => {
  it('should return an error if finding the chats fails', async () => {
    ChatModel.find.mockImplementation(() => {
      throw new Error();
    });
    const result = await getSideBarChats('user1');
    expect(result).toEqual({ err: { status: 500, message: 'An error occurred while trying to find the chats for the logged in user' } });
  });
});