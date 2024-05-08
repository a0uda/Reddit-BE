import {
  pushNotification,
  getNotifications,
  markAsRead,
  hideNotification,
  getUnreadNotificationsCount,
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

  it("should return error if comment is in a muted community", async () => {
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
    const comment = {
      _id: "post_id",
      comment_in_community_flag: true,
      community_id: "muted_community_id",
      community_name: "muted_community",
    };

    const result = await pushNotification(
      user,
      sending_user_username,
      null,
      comment,
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

describe("getNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getNotifications(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  // it("should retrieve notifications successfully", async () => {
  //   const request = {
  //     headers: {
  //       authorization: "Bearer valid_token",
  //     },
  //   };

  //   const mockUser = {
  //     _id: "user_id",
  //     token: ["valid_token"],
  //     profile_picture: "user_profile_picture",
  //     generateAuthToken: jest.fn(),
  //     save: jest.fn(),
  //   };

  //   const mockNotifications = [
  //     {
  //       _id: "notification_id_1",
  //       user_id: "user_id",
  //       created_at: new Date(),
  //       post_id: "post_id_1",
  //       comment_id: null,
  //       sending_user_username: "sending_user_1",
  //       community_name: "community_1",
  //       unread_flag: true,
  //       hidden_flag: false,
  //       type: "upvotes_posts",
  //     },
  //     {
  //       _id: "notification_id_2",
  //       user_id: "user_id",
  //       created_at: new Date(),
  //       post_id: null,
  //       comment_id: "comment_id_2",
  //       sending_user_username: "sending_user_2",
  //       community_name: "community_2",
  //       unread_flag: false,
  //       hidden_flag: true,
  //       type: "comments",
  //     },
  //   ];

  //   const mockCommunities = [
  //     {
  //       name: "community_1",
  //       profile_picture: "community_1_profile_picture",
  //     },
  //     {
  //       name: "community_2",
  //       profile_picture: "community_2_profile_picture",
  //     },
  //   ];

  //   const mockSendingUsers = [
  //     {
  //       username: "sending_user_1",
  //       profile_picture: "sending_user_1_profile_picture",
  //     },
  //     {
  //       username: "sending_user_2",
  //       profile_picture: "sending_user_2_profile_picture",
  //     },
  //   ];

  //   User.findById.mockResolvedValueOnce(mockUser);
  //   jwt.verify.mockReturnValue({ _id: mockUser._id });

  //   const mockQuery = {
  //     sort: jest.fn().mockReturnThis(),
  //     exec: jest.fn().mockResolvedValue(mockNotifications),
  //   };
  //   Notification.find = jest.fn().mockReturnValue(mockQuery);

  //   const mockFindCom = jest.fn().mockResolvedValue(mockCommunities);
  //   Community.find.mockReturnValueOnce({ exec: mockFindCom });

  //   const mockFindUsers = jest.fn().mockResolvedValue(mockSendingUsers);
  //   User.find.mockResolvedValueOnce({ exec: mockFindUsers });

  //   const expectedResult = {
  //     success: true,
  //     message: "Notifications retrieved successfully",
  //     notifications: mockNotifications.map((notification) => ({
  //       id: notification._id,
  //       created_at: notification.created_at,
  //       post_id: notification.post_id,
  //       comment_id: notification.comment_id,
  //       sending_user_username: notification.sending_user_username,
  //       community_name: notification.community_name,
  //       unread_flag: notification.unread_flag,
  //       hidden_flag: notification.hidden_flag,
  //       type: notification.type,
  //       profile_picture: !!notification.community_name
  //         ? "community_1_profile_picture"
  //         : "sending_user_1_profile_picture",
  //       is_in_community: !!notification.community_name,
  //     })),
  //   };

  //   const result = await getNotifications(request);
  //   expect(result).toEqual(expectedResult);
  // });

  // it("should return an error response if there is an internal server error", async () => {
  //   const request = {
  //     headers: {
  //       authorization: "Bearer valid_token",
  //     },
  //   };
  //   const mockUser = {
  //     _id: "user_id",
  //     token: ["valid_token"],
  //     profile_picture: "user_profile_picture",
  //     generateAuthToken: jest.fn(),
  //     save: jest.fn(),
  //   };
  //   User.findById.mockResolvedValueOnce(mockUser);
  //   jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

  //   const mockQuery = {
  //     sort: jest.fn().mockReturnThis(),
  //     exec: jest.fn().mockResolvedValue(null),
  //   };
  //   Notification.find = jest.fn().mockReturnValue(mockQuery);

  //   const result = await getNotifications(request);
  //   expect(result).toEqual({
  //     success: false,
  //     error: {
  //       status: 500,
  //       message: "Internal Server error",
  //     },
  //   });
  // });

});

describe("markAsRead", () => {
  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await markAsRead(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should mark all notifications as read if markAllFlag is true", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
    };

    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    // Mock Notification.find to return mock notifications
    const mockNotifications = [
      {
        _id: "notification_id_1",
        user_id: "user_id",
        unread_flag: true,
        save: jest.fn(),
      },
      {
        _id: "notification_id_2",
        user_id: "user_id",
        unread_flag: true,
        save: jest.fn(),
      },
    ];
    const mockExec = jest.fn().mockResolvedValue(mockNotifications);
    const mockFind = jest.fn().mockReturnValueOnce({ exec: mockExec });
    Notification.find = mockFind;

    const result = await markAsRead(request, true);

    // Assert response
    expect(result).toEqual({
      success: true,
      message: "All Notifications are read successfully",
    });
  });

  it("should mark a single notification as read if markAllFlag is false and valid id is provided", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "notification_id",
      },
    };

    // Mock the user and authentication
    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    // Mock the notification to be found
    const mockNotification = {
      _id: "notification_id",
      user_id: "user_id",
      unread_flag: true,
      save: jest.fn(),
    };
    Notification.findById.mockResolvedValueOnce(mockNotification);

    const result = await markAsRead(request, false);

    expect(result).toEqual({
      success: true,
      message: "Notification read successfully",
    });
  });

  it("should return an error response if notification id is not provided", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {}, // No id property provided
    };

    // Mock the user and authentication
    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    const result = await markAsRead(request, false);

    expect(result).toEqual({
      success: false,
      error: {
        status: 400,
        message: "Notification id is required",
      },
    });
  });

  it("should return an error response if notification id is not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "non_existent_notification_id",
      },
    };

    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    Notification.findById.mockResolvedValueOnce(null);

    const result = await markAsRead(request, false);
    expect(result).toEqual({
      success: false,
      error: {
        status: 400,
        message: "Notification is not found",
      },
    });
  });

  it("should return an error response if there is an internal server error", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "notification_id",
      },
    };
    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    Notification.findById.mockRejectedValueOnce(new Error("Database error"));

    const result = await markAsRead(request);
    expect(result).toEqual({
      success: false,
      error: {
        status: 500,
        message: "Internal Server error",
      },
    });
  });
});

describe("hideNotification", () => {
  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await hideNotification(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should hide a notification if valid id is provided", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "notification_id",
      },
    };

    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    // Mock Notification.findById to return a mock notification
    const mockNotification = {
      _id: "notification_id",
      hidden_flag: false,
      save: jest.fn(),
    };
    Notification.findById.mockResolvedValueOnce(mockNotification);

    const result = await hideNotification(request);

    expect(result).toEqual({
      success: true,
      message: "Notification hidden successfully",
    });
  });

  it("should return an error response if notification id is not provided", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {}, // No id property provided
    };

    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    const result = await hideNotification(request);

    // Assert response
    expect(result).toEqual({
      success: false,
      error: {
        status: 400,
        message: "Notification id is required",
      },
    });
  });

  it("should return an error response if notification id is not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "non_existent_notification_id",
      },
    };

    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    Notification.findById.mockResolvedValueOnce(null);

    const result = await hideNotification(request);

    expect(result).toEqual({
      success: false,
      error: {
        status: 400,
        message: "Notification is not found",
      },
    });
  });

  it("should return an error response if there is an internal server error", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "notification_id",
      },
    };
    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    Notification.findById.mockRejectedValueOnce(new Error("Database error"));

    const result = await hideNotification(request);
    expect(result).toEqual({
      success: false,
      error: {
        status: 500,
        message: "Internal Server error",
      },
    });
  });
});

describe("getUnreadNotificationsCount", () => {
  it("should return the count of unread notifications if user is authenticated", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
    };

    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };

    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    const mockNotifications = [
      { _id: "notification_id_1", user_id: "user_id", unread_flag: true },
      { _id: "notification_id_2", user_id: "user_id", unread_flag: true },
    ];
    const mockExec = jest.fn().mockResolvedValue(mockNotifications);
    const mockFind = jest.fn().mockReturnValueOnce({ exec: mockExec });
    Notification.find = mockFind;

    const result = await getUnreadNotificationsCount(request);

    // Assert response
    expect(result).toEqual({
      success: true,
      message: "Notifications retrieved successfully",
      count: mockNotifications.length,
    });
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getUnreadNotificationsCount(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return an error response if there is an internal server error", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
    };

    const mockUser = {
      _id: "user_id",
      token: ["valid_token"],
      profile_picture: "user_profile_picture",
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValueOnce(mockUser);
    jwt.verify.mockReturnValueOnce({ _id: mockUser._id });

    const mockFind = jest.fn().mockReturnValueOnce(new Error("Database error"));
    Notification.find = mockFind;

    const result = await getUnreadNotificationsCount(request);

    // Assert response
    expect(result).toEqual({
      success: false,
      error: {
        status: 500,
        message: "Internal Server error",
      },
    });
  });
});
