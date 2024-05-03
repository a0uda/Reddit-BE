import {
  getSettings,
  getSafetySettings,
  setSettings,
} from "../src/controller/userSettings";
import { User } from "../src/db/models/User";
import jwt from "jsonwebtoken"; // Import jwt module
import * as userSettingUtils from "../src/utils/userSettings"; // Import the entire module
import {
  getBlockedUserHelper,
  getMutedCommunitiesHelper,
} from "../src/services/users";

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../src/db/models/User");
jest.mock("../src/utils/userSettings");
jest.mock("../src/services/users.js", () => ({
  getBlockedUserHelper: jest.fn(),
  getMutedCommunitiesHelper: jest.fn(),
}));

describe("Get Settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getSettings(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if user is not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(null);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    const result = await getSettings(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("User not found");
  });

  it("should return account settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email: "test@example.com",
      verified_email_flag: true,
      country: "US",
      gender: "Male",
      gmail: "test@gmail.com",
      connected_google: true,
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    const expectedResult = {
      account_settings: {
        email: "test@example.com",
        verified_email_flag: true,
        country: "US",
        gender: "Male",
        gmail: "test@gmail.com",
        connected_google: true,
      },
    };
    userSettingUtils.getAccountSettingsFormat.mockReturnValue(expectedResult);
    const result = await getSettings(request, "Account");

    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings retrieved successfully");
    expect(result.settings).toEqual(expectedResult);
    expect(userSettingUtils.getAccountSettingsFormat).toHaveBeenCalledWith(
      mockUser
    );
  });

  it("should return profile settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      display_name: "Test User",
      about: "This is a test user",
      social_links: [
        {
          _id: "12345",
          username: "string",
          display_text: "string",
          type: "instagram",
          custom_url: "string",
        },
      ],
      profile_picture: "profilepic.jpg",
      banner_picture: "bannerpic.jpg",
      profile_settings: {
        nsfw_flag: false,
        allow_followers: true,
        content_visibility: "public",
        active_communities_visibility: "all",
        generateAuthToken: jest.fn(),
        save: jest.fn(),
      },
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    const expectedResult = {
      profile_settings: {
        display_name: "Test User",
        about: "This is a test user",
        social_links: [
          {
            _id: "12345",
            username: "string",
            display_text: "string",
            type: "instagram",
            custom_url: "string",
          },
        ],
        profile_picture: "profilepic.jpg",
        banner_picture: "bannerpic.jpg",
        nsfw_flag: false,
        allow_followers: true,
        content_visibility: "public",
        active_communities_visibility: "all",
      },
    };
    userSettingUtils.getProfileSettingsFormat.mockReturnValue(expectedResult);
    const result = await getSettings(request, "Profile");

    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings retrieved successfully");
    expect(result.settings).toEqual(expectedResult);
    expect(userSettingUtils.getProfileSettingsFormat).toHaveBeenCalledWith(
      mockUser
    );
  });

  it("should return feed settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      feed_settings: {
        Adult_content_flag: false,
        autoplay_media: true,
        communitiy_content_sort: {
          type: "hot",
          duration: "day",
          sort_remember_per_community: true,
        },
        global_content: {
          global_content_view: "compact",
          global_remember_per_community: true,
        },
        Open_posts_in_new_tab: false,
        community_themes: true,
      },
    };

    // Mocking the User.findById and jwt.verify functions
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    // Expected result for feed settings
    const expectedResult = {
      feed_settings: {
        Adult_content_flag: false,
        autoplay_media: true,
        communitiy_content_sort: {
          type: "hot",
          duration: "day",
          sort_remember_per_community: true,
        },
        global_content: {
          global_content_view: "compact",
          global_remember_per_community: true,
        },
        Open_posts_in_new_tab: false,
        community_themes: true,
      },
    };
    userSettingUtils.getFeedSettingsFormat.mockReturnValue(expectedResult);
    // Calling the function to test
    const result = await getSettings(request, "Feed");

    // Assertions
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings retrieved successfully");
    expect(result.settings).toEqual(expectedResult);
    expect(userSettingUtils.getFeedSettingsFormat).toHaveBeenCalledWith(
      mockUser
    );
  });

  it("should return notification settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      notifications_settings: {
        mentions: true,
        comments: true,
        upvotes_posts: false,
        upvotes_comments: false,
        replies: true,
        new_followers: true,
        invitations: false,
        posts: true,
        private_messages: false,
        chat_messages: true,
        chat_requests: false,
      },
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const expectedResult = {
      notifications_settings: {
        mentions: true,
        comments: true,
        upvotes_posts: false,
        upvotes_comments: false,
        replies: true,
        new_followers: true,
        invitations: false,
        posts: true,
        private_messages: false,
        chat_messages: true,
        chat_requests: false,
      },
    };
    userSettingUtils.getNotificationsSettingsFormat.mockReturnValue(
      expectedResult
    );
    const result = await getSettings(request, "Notification");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings retrieved successfully");
    expect(result.settings).toEqual(expectedResult);
    expect(
      userSettingUtils.getNotificationsSettingsFormat
    ).toHaveBeenCalledWith(mockUser);
  });

  it("should return chat and messaging settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      chat_and_messaging_settings: {
        who_send_chat_requests_flag: true,
        who_send_private_messages_flag: false,
      },
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const expectedResult = {
      chat_and_messaging_settings: {
        who_send_chat_requests_flag: true,
        who_send_private_messages_flag: false,
      },
    };
    userSettingUtils.getChatAndMsgsSettingsFormat.mockReturnValue(
      expectedResult
    );
    const result = await getSettings(request, "Chat");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings retrieved successfully");
    expect(result.settings).toEqual(expectedResult);
    expect(userSettingUtils.getChatAndMsgsSettingsFormat).toHaveBeenCalledWith(
      mockUser
    );
  });

  it("should return email settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email_settings: {
        new_follower_email: true,
        chat_request_email: false,
        unsubscribe_from_all_emails: false,
      },
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const expectedResult = {
      email_settings: {
        new_follower_email: true,
        chat_request_email: false,
        unsubscribe_from_all_emails: false,
      },
    };
    userSettingUtils.getEmailSettingsFormat.mockReturnValue(expectedResult);
    const result = await getSettings(request, "Email");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings retrieved successfully");
    expect(result.settings).toEqual(expectedResult);
    expect(userSettingUtils.getEmailSettingsFormat).toHaveBeenCalledWith(
      mockUser
    );
  });
});

describe("Get Safety Settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getSafetySettings(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return safety settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      safety_and_privacy_settings: {
        blocked_users: [
          {
            id: "userId1",
            blocked_date: "2024-04-15T10:00:00Z",
          },
          {
            id: "userId2",
            blocked_date: "2024-04-14T12:00:00Z",
          },
        ],
        muted_communities: [
          {
            id: "communityId1",
            muted_date: "2024-04-10T08:00:00Z",
          },
          {
            id: "communityId2",
            muted_date: "2024-04-12T14:00:00Z",
          },
        ],
      },
      save: jest.fn(),
    };

    // Mocking the User.findById and jwt.verify functions
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    // Mocking blocked users and muted communities
    const mockBlockedUsers = [
      {
        id: "userId1",
        username: "BlockedUser1",
        profile_picture: "profile_pic_url1",
        blocked_date: "2024-04-15T10:00:00Z",
      },
      {
        id: "userId2",
        username: "BlockedUser2",
        profile_picture: "profile_pic_url2",
        blocked_date: "2024-04-14T12:00:00Z",
      },
    ];
    const mockMutedCommunities = [
      {
        id: "communityId1",
        name: "Community1",
        profile_picture: "profile_pic_url1",
        muted_date: "2024-04-15T10:00:00Z",
      },
      {
        id: "communityId2",
        name: "Community2",
        profile_picture: "profile_pic_url2",
        muted_date: "2024-04-14T12:00:00Z",
      },
    ];
    getBlockedUserHelper.mockResolvedValue(mockBlockedUsers);
    getMutedCommunitiesHelper.mockResolvedValue(mockMutedCommunities);

    const expectedResult = {
      safety_and_privacy_settings: {
        blocked_users: mockBlockedUsers,
        muted_communities: mockMutedCommunities,
      },
    };
    userSettingUtils.getSafetySettingsFormat.mockReturnValue(expectedResult);
    const result = await getSafetySettings(request);
    expect(result.success).toBe(true);
    // expect(result.message).toEqual("Settings retrieved successfully");
    expect(result.settings).toEqual(expectedResult);
  });
});

describe("Set Settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update account settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
      body: {
        account_settings: {
          gender: "Female",
          country: "Canada",
        },
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      gender: "Male",
      country: "US",
    };
    User.mockImplementation(() => mockUser);
    mockUser.save = jest.fn().mockResolvedValue(mockUser);

    userSettingUtils.setAccountSettings.mockReturnValue(mockUser);
    const result = await setSettings(request, "Account");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings set successfully");
  });

  it("should update profile settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
      body: {
        profile_settings: {
          display_name: "New display name",
          about: "This is my about",
          nsfw_flag: true,
          allow_followers: true,
          content_visibility: true,
          active_communities_visibility: true,
        },
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      display_name: "Old display name",
      about: "Old about",
      nsfw_flag: false,
      allow_followers: false,
      content_visibility: false,
      active_communities_visibility: false,
    };
    User.mockImplementation(() => mockUser);
    mockUser.save = jest.fn().mockResolvedValue(mockUser);

    userSettingUtils.setProfileSettings.mockReturnValue(mockUser);
    const result = await setSettings(request, "Profile");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings set successfully");
  });

  it("should update feed settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
      body: {
        feed_settings: {
          Adult_content_flag: true,
          autoplay_media: true,
          communitiy_content_sort: {
            type: "top",
            duration: "now",
            sort_remember_per_community: true,
          },
          global_content: {
            global_content_view: "card",
            global_remember_per_community: true,
          },
          Open_posts_in_new_tab: true,
          community_themes: true,
        },
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      feed_settings: {
        Adult_content_flag: false,
        autoplay_media: false,
        communitiy_content_sort: {},
        global_content: {},
        Open_posts_in_new_tab: false,
        community_themes: false,
      },
    };
    User.mockImplementation(() => mockUser);
    mockUser.save = jest.fn().mockResolvedValue(mockUser);

    userSettingUtils.setFeedSettings.mockReturnValue(mockUser);
    const result = await setSettings(request, "Feed");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings set successfully");
  });

  it("should update notification settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
      body: {
        notifications_settings: {
          mentions: true,
          comments: true,
          upvotes_posts: true,
          upvotes_comments: true,
          replies: true,
          new_followers: true,
          invitations: true,
          posts: true,
          private_messages: true,
          chat_messages: true,
          chat_requests: true,
        },
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      notifications_settings: {
        mentions: false,
        comments: false,
        upvotes_posts: false,
        upvotes_comments: false,
        replies: false,
        new_followers: false,
        invitations: false,
        posts: false,
        private_messages: false,
        chat_messages: false,
        chat_requests: false,
      },
    };
    User.mockImplementation(() => mockUser);
    mockUser.save = jest.fn().mockResolvedValue(mockUser);

    userSettingUtils.setNotificationSettings.mockReturnValue(mockUser);
    const result = await setSettings(request, "Notification");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings set successfully");
  });

  it("should update email settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
      body: {
        email_settings: {
          new_follower_email: true,
          chat_request_email: true,
          unsubscribe_from_all_emails: true,
        },
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email_settings: {
        new_follower_email: false,
        chat_request_email: false,
        unsubscribe_from_all_emails: false,
      },
    };
    User.mockImplementation(() => mockUser);
    mockUser.save = jest.fn().mockResolvedValue(mockUser);

    userSettingUtils.setEmailSettings.mockReturnValue(mockUser);
    const result = await setSettings(request, "Email");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings set successfully");
  });

  it("should update chat settings", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
      body: {
        chat_and_messaging_settings: {
          who_send_chat_requests_flag: "Everyone",
          who_send_private_messages_flag: "Everyone",
        },
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      chat_and_messaging_settings: {
        who_send_chat_requests_flag: "Nobody",
        who_send_private_messages_flag: "Nobody",
      },
    };
    User.mockImplementation(() => mockUser);
    mockUser.save = jest.fn().mockResolvedValue(mockUser);

    userSettingUtils.setChatSettings.mockReturnValue(mockUser);
    const result = await setSettings(request, "Chat");
    expect(result.success).toBe(true);
    expect(result.message).toEqual("Settings set successfully");
  });
});
