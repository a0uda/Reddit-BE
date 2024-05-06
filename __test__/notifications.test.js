import {
  pushNotification,
  getNotifications,
} from "../src/controller/notifications";
import { User } from "../src/db/models/User";
import { Notification } from "../src/db/models/Notification";
import { Community } from "../src/db/models/Community";
import jwt from "jsonwebtoken"; // Import jwt module
// import { generateResponse } from "../../src/utils/generalUtils.js";

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../src/db/models/Community");
jest.mock("../src/db/models/User");
jest.mock("../src/db/models/Notification");

describe("pushNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should push notification successfully", async () => {
    const user = {
      _id: "user_id",
      username: "test_user",
      safety_and_privacy_settings: {
        muted_communities: [],
        blocked_users: [],
      },
      notifications_settings: {
        comments: true,
      },
    };

    const sending_user_username = "sending_user";
    const sending_user = {
      _id: "sending_user_id",
      username: "test_user",
      safety_and_privacy_settings: {
        muted_communities: [],
        blocked_users: [],
      },
      notifications_settings: {
        comments: true,
      },
    };
    const comment = {
      _id: "comment_id",
      community_id: "community_id",
      community_name: "test_community",
      comment_in_community_flag: true,
    };

    User.findOne.mockResolvedValueOnce(sending_user);

    const notification = {
      created_at: expect.any(Number),
      community_name: "test_community",
      post_id: null,
      comment_id: "comment_id",
      user_id: "user_id",
      sending_user_username: "sending_user",
      type: "comments",
      save: jest.fn(),
    };

    const expectedResult = {
      success: true,
      notification,
    };

    const result = await pushNotification(
      user,
      sending_user_username,
      null,
      comment,
      "comments"
    );
    expect(result.success).toEqual(expectedResult.success);
  });

  it("should return error if post is in a muted community", async () => {
    const user = {
      _id: "user_id",
      username: "test_user",
      safety_and_privacy_settings: {
        muted_communities: [{ id: "muted_community_id" }],
        blocked_users: [],
      },
      notifications_settings: {
        comments: true,
      },
    };

    const sending_user_username = "sending_user";
    const post = {
      _id: "post_id",
      post_in_community_flag: true,
      community_id: "muted_community_id",
      community_name: "muted_community",
    };

    const result = await pushNotification(
      user,
      sending_user_username,
      post,
      null,
      "comments"
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("User has this community muted");
  });

  it("should return error if sending user is blocked", async () => {
    const user = {
      _id: "user_id",
      username: "test_user",
      safety_and_privacy_settings: {
        muted_communities: [],
        blocked_users: [{ id: "sending_user_id" }],
      },
      notifications_settings: {
        comments: true,
      },
    };

    const sending_user_username = "sending_user";
    const sending_user = {
      _id: "sending_user_id",
      username: "sending_user",
    };

    User.findOne.mockResolvedValueOnce(sending_user);

    const result = await pushNotification(
      user,
      sending_user_username,
      null,
      null,
      "comments"
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("User blocked");
  });

  it("should return error if user has notifications for the specified type turned off", async () => {
    const user = {
      _id: "user_id",
      username: "test_user",
      safety_and_privacy_settings: {
        muted_communities: [],
        blocked_users: [],
      },
      notifications_settings: {
        comments: false, // Notifications for comments are turned off
      },
    };

    const result = await pushNotification(
      user,
      "sending_user",
      null,
      {
        _id: "comment_id",
        community_id: "community_id",
        community_name: "test_community",
        comment_in_community_flag: true,
      },
      "comments"
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("User has this option sent off");
  });

  it("should return error if trying to push notification to the same user", async () => {
    const user = {
      _id: "user_id",
      username: "test_user",
      safety_and_privacy_settings: {
        muted_communities: [],
        blocked_users: [],
      },
      notifications_settings: {
        comments: true,
      },
    };

    // Attempting to push notification to the same user
    const result = await pushNotification(
      user,
      "test_user",
      null,
      {
        _id: "comment_id",
        community_id: "community_id",
        community_name: "test_community",
        comment_in_community_flag: true,
      },
      "comments"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Can't push notif to same user");
  });

  it("should return error if an error occurs while pushing notification", async () => {
    const user = {
      _id: "user_id",
      username: "test_user",
      safety_and_privacy_settings: {
        muted_communities: [],
        blocked_users: [],
      },
      notifications_settings: {
        comments: true,
      },
    };

    const sending_user_username = "sending_user";

    // Mocking an error to be thrown
    User.findOne.mockRejectedValueOnce(new Error("Database error"));

    // Expected error response
    const expectedError = {
      success: false,
      error: "Internal server error",
    };

    // Calling the function and asserting the result
    const result = await pushNotification(
      user,
      sending_user_username,
      null,
      null,
      "comments"
    );

    expect(result).toEqual(expectedError);
  });
});

// describe("getNotifications", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("should retrieve notifications successfully", async () => {
//     const request = {
//       headers: {
//         authorization: "Bearer valid_token",
//       },
//     };

//     const mockUser = {
//       _id: "user_id",
//       token: ["valid_token"],
//       profile_picture: "user_profile_picture",
//       generateAuthToken: jest.fn(),
//       save: jest.fn(),
//     };

//     const mockNotifications = [
//       {
//         _id: "notification_id_1",
//         created_at: new Date(),
//         post_id: "post_id_1",
//         comment_id: "comment_id_1",
//         sending_user_username: "sending_user_1",
//         community_name: "community_1",
//         unread_flag: true,
//         hidden_flag: false,
//         type: "notification_type_1",
//       },
//       {
//         _id: "notification_id_2",
//         created_at: new Date(),
//         post_id: "post_id_2",
//         comment_id: "comment_id_2",
//         sending_user_username: "sending_user_2",
//         community_name: "community_2",
//         unread_flag: false,
//         hidden_flag: true,
//         type: "notification_type_2",
//       },
//     ];

//     const mockCommunities = [
//       {
//         name: "community_1",
//         profile_picture: "community_1_profile_picture",
//       },
//       {
//         name: "community_2",
//         profile_picture: "community_2_profile_picture",
//       },
//     ];

//     const mockSendingUsers = [
//       {
//         username: "sending_user_1",
//         profile_picture: "sending_user_1_profile_picture",
//       },
//       {
//         username: "sending_user_2",
//         profile_picture: "sending_user_2_profile_picture",
//       },
//     ];

//     User.findById.mockResolvedValueOnce(mockUser);
//     jwt.verify.mockReturnValue({ _id: mockUser._id });

//     Notification.find.mockResolvedValueOnce(mockNotifications);
//     Community.find.mockResolvedValueOnce(mockCommunities);
//     User.find.mockResolvedValueOnce(mockSendingUsers);

//     const expectedResult = {
//       success: true,
//       message: "Notifications retrieved successfully",
//       notifications: mockNotifications.map((notification) => ({
//         id: notification._id,
//         created_at: notification.created_at,
//         post_id: notification.post_id,
//         comment_id: notification.comment_id,
//         sending_user_username: notification.sending_user_username,
//         community_name: notification.community_name,
//         unread_flag: notification.unread_flag,
//         hidden_flag: notification.hidden_flag,
//         type: notification.type,
//         profile_picture: !!notification.community_name
//           ? "community_1_profile_picture"
//           : "sending_user_1_profile_picture",
//         is_in_community: !!notification.community_name,
//       })),
//     };

//     const result = await getNotifications(request);
//     expect(result).toEqual(expectedResult);
//   });
// });
