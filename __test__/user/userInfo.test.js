import { User } from "../../src/db/models/User";
import { Post } from "../../src/db/models/Post.js";
import { Comment } from "../../src/db/models/Comment.js";
import { Community } from "../../src/db/models/Community.js";
import {
  getFollowers,
  getFollowing,
  getFollowersCount,
  getFollowingCount,
  getOverview,
  getAbout,
  getActiveCommunities,
} from "../../src/controller/userInfo";
import {
  getUserPostsHelper,
  getUserCommentsHelper,
} from "../../src/services/users.js";
import { getAboutFormat } from "../../src/utils/userInfo";
import { getModeratedCommunitiesHelper } from "../../src/services/users.js";
import { getFriendsFormat } from "../../src/utils/userInfo";
import { getActiveCommunitiesHelper } from "../../src/services/users.js";
import jwt from "jsonwebtoken"; // Import jwt module
// import { generateResponse } from "../../src/utils/generalUtils.js";

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../../src/db/models/User");
jest.mock("../../src/db/models/Post");
jest.mock("../../src/db/models/Comment");
jest.mock("../../src/db/models/Community");
jest.mock("../../src/utils/userInfo.js");

// jest.mock("../../src/utils/generalUtils.js");
jest.mock("../../src/services/users.js");

describe("Get Followers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getFollowers(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return user followers", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      followers_ids: ["followerId1", "followerId2"],
      created_at: "2022-04-14T10:00:00Z",
      email: "user@example.com",
      username: "example_user",
      display_name: "Example User",
      about: "I am an example user",
      profile_picture: "profile_pic_url",
      banner_picture: "banner_pic_url",
      country: "US",
      gender: "Male",
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const mockFollowerDetails = [
      {
        _id: "followerId1",
        created_at: "2022-04-15T10:00:00Z",
        email: "follower1@example.com",
        username: "follower1_user",
        display_name: "Follower 1",
        about: "I am follower 1",
        profile_picture: "follower1_profile_pic_url",
        banner_picture: "follower1_banner_pic_url",
        country: "Canada",
        gender: "Female",
      },
      {
        _id: "followerId2",
        created_at: "2022-04-16T10:00:00Z",
        email: "follower2@example.com",
        username: "follower2_user",
        display_name: "Follower 2",
        about: "I am follower 2",
        profile_picture: "follower2_profile_pic_url",
        banner_picture: "follower2_banner_pic_url",
        country: "UK",
        gender: "Male",
      },
    ];
    getFriendsFormat
      .mockImplementationOnce(() => mockFollowerDetails[0])
      .mockImplementationOnce(() => mockFollowerDetails[1]);
    const result = await getFollowers(request);
    expect(result.success).toBe(true);
    expect(result.message).toEqual("User followers retrieved successfully");
    expect(result.users).toEqual(mockFollowerDetails);
  });
});

describe("Get Following", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getFollowing(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return user following", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      following_ids: ["followingId1", "followingId2"],
      created_at: "2022-04-14T10:00:00Z",
      email: "user@example.com",
      username: "example_user",
      display_name: "Example User",
      about: "I am an example user",
      profile_picture: "profile_pic_url",
      banner_picture: "banner_pic_url",
      country: "US",
      gender: "Male",
    };

    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const mockFollowingDetails = [
      {
        _id: "followingId1",
        created_at: "2022-04-15T10:00:00Z",
        email: "following1@example.com",
        username: "following1_user",
        display_name: "Following 1",
        about: "I am following 1",
        profile_picture: "following1_profile_pic_url",
        banner_picture: "following1_banner_pic_url",
        country: "Canada",
        gender: "Female",
      },
      {
        _id: "followingId2",
        created_at: "2022-04-16T10:00:00Z",
        email: "following2@example.com",
        username: "following2_user",
        display_name: "Following 2",
        about: "I am following 2",
        profile_picture: "following2_profile_pic_url",
        banner_picture: "following2_banner_pic_url",
        country: "UK",
        gender: "Male",
      },
    ];

    getFriendsFormat
      .mockImplementationOnce(() => mockFollowingDetails[0])
      .mockImplementationOnce(() => mockFollowingDetails[1]);

    const result = await getFollowing(request);
    expect(result.success).toBe(true);
    expect(result.message).toEqual("User following retrieved successfully");
    expect(result.users).toEqual(mockFollowingDetails);
  });
});

describe("Get Followers Count", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getFollowersCount(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return user followers count", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      followers_ids: ["followerId1", "followerId2"],
    };

    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const result = await getFollowersCount(request);
    expect(result.success).toBe(true);
    expect(result.message).toEqual(
      "User followers count retrieved successfully"
    );
    expect(result.count).toEqual(mockUser.followers_ids.length);
  });
});

describe("Get Following Count", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getFollowingCount(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return user following count", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      following_ids: ["followingId1", "followingId2"],
    };

    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const result = await getFollowingCount(request);
    expect(result.success).toBe(true);
    expect(result.message).toEqual(
      "User following count retrieved successfully"
    );
    expect(result.count).toEqual(mockUser.following_ids.length);
  });
});

describe("Get Overview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if username parameter is missing", async () => {
    const request = {
      params: {}, // Missing username parameter
    };

    const result = await getOverview(request);

    // Assert success and message fields
    expect(result.success).toEqual(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Missing Username in params");

    // Ensure that other functions are not called
    expect(User.findOne).not.toHaveBeenCalled();
    expect(getUserPostsHelper).not.toHaveBeenCalled();
    expect(getUserCommentsHelper).not.toHaveBeenCalled();
  });

  it("should return error if user is not found", async () => {
    const request = {
      params: {
        username: "non_existent_user",
      },
    };

    User.findOne.mockResolvedValue(null); // Simulate user not found

    const expectedResult = {
      success: false,
      error: {
        status: 404,
        message: "No user found with username",
      },
    };

    const result = await getOverview(request);

    // Assert success and message fields
    expect(result.success).toEqual(expectedResult.success);
    expect(result.error.status).toEqual(expectedResult.error.status);
    expect(result.error.message).toEqual(expectedResult.error.message);

    // Ensure that other functions are not called
    expect(getUserPostsHelper).not.toHaveBeenCalled();
    expect(getUserCommentsHelper).not.toHaveBeenCalled();
  });

  it("should return posts and comments successfully", async () => {
    const request = {
      params: {
        username: "example_user",
      },
    };

    const mockUser = {
      _id: "mockUserId",
      username: "example_user",
    };
    const loggedInUser = {
      _id: "loggedInUserId",
    };
    const mockPosts = [{ _id: "post1" }, { _id: "post2" }]; // Mocked posts
    const mockComments = [{ _id: "comment1" }, { _id: "comment2" }]; // Mocked comments

    User.findOne.mockResolvedValue(mockUser);
    getUserPostsHelper.mockResolvedValue(mockPosts);
    getUserCommentsHelper.mockResolvedValue(mockComments);

    const mockPostsResult = [
      { _id: "post1", is_post: true },
      { _id: "post2", is_post: true },
    ]; // Mocked posts with is_post flag
    const mockCommentsResult = [
      { _id: "comment1", is_post: false },
      { _id: "comment2", is_post: false },
    ];
    const result = await getOverview(request);
    expect(result.success).toEqual(true);
    expect(result.message).toEqual("Comments and posts retrieved successfully");
    expect(result.content.posts).toEqual(mockPostsResult);
    expect(result.content.comments).toEqual(mockCommentsResult);
  });

  it("should return error if internal server error occurs", async () => {
    const request = {
      params: {
        username: "example_user",
      },
    };

    const mockError = new Error("Something went wrong");
    User.findOne.mockRejectedValue(mockError); // Simulate internal server error

    const expectedResult = {
      success: false,
      error: {
        status: 500,
        message: "Internal Server Error",
      },
    };

    const result = await getOverview(request);

    // Assert success and message fields
    expect(result.success).toEqual(expectedResult.success);
    expect(result.error.status).toEqual(expectedResult.error.status);
    expect(result.error.message).toEqual(expectedResult.error.message);

    // Ensure that other functions are not called
    expect(getUserPostsHelper).not.toHaveBeenCalled();
    expect(getUserCommentsHelper).not.toHaveBeenCalled();
  });
});

describe("Get About", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return about information successfully", async () => {
    const request = {
      params: {
        username: "example_user",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      username: "example_user",
    };
    const mockAbout = { bio: "Sample bio", location: "Sample location" };
    const mockModeratedCommunities = ["Community1", "Community2"];

    User.findOne.mockResolvedValue(mockUser);
    getAboutFormat.mockResolvedValue(mockAbout);
    getModeratedCommunitiesHelper.mockResolvedValue(mockModeratedCommunities);

    const expectedResult = {
      success: true,
      message: "About retrieved successfully",
      about: {
        ...mockAbout,
        moderatedCommunities: mockModeratedCommunities,
      },
    };

    const result = await getAbout(request);

    expect(result).toEqual(expectedResult);
  });

  it("should return error if username parameter is missing", async () => {
    const request = {
      params: {}, // Missing username parameter
    };

    const expectedResult = {
      success: false,
      error: {
        status: 400,
        message: "Missing Username in params",
      },
    };

    const result = await getAbout(request);

    expect(result).toEqual(expectedResult);
  });

  it("should return error if user is not found", async () => {
    const request = {
      params: {
        username: "non_existent_user",
      },
    };

    User.findOne.mockResolvedValue(null); // Simulate user not found

    const expectedResult = {
      success: false,
      error: {
        status: 404,
        message: "No user found with username",
      },
    };

    const result = await getAbout(request);

    expect(result).toEqual(expectedResult);
  });

  it("should return error if internal server error occurs", async () => {
    const request = {
      query: {
        username: "example_user",
      },
    };

    const mockError = new Error("Something went wrong");
    User.findOne.mockRejectedValue(mockError); // Simulate internal server error

    const expectedResult = {
      success: false,
      error: {
        status: 500,
        message: "Internal Server Error",
      },
    };

    const result = await getAbout(request);

    expect(result).toEqual(expectedResult);
  });
});

describe("Get Active Communities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if username is missing", async () => {
    const request = {
      query: {}, // No authorization token provided
    };

    // Expected result
    const expectedResult = {
      success: false,
      error: { status: 400, message: "Username is required" },
    };

    // Call the function and assert the result
    const result = await getActiveCommunities(request);
    expect(result).toEqual(expectedResult);
  });

  it("should return active communities successfully", async () => {
    const request = {
      query: { username: "username1" },
    }; // Mock request object

    // Mock user data
    const mockUser = {
      _id: "mockUserId",
      username: "username1",
      token: ["valid_token"],
      communities: [{ id: "communityId1" }, { id: "communityId2" }],
      profile_settings: {
        active_communities_visibility: true,
      },
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };

    // Mock posts and comments data
    const mockPosts = [
      { community_id: "communityId1" },
      { community_id: "communityId2" },
    ];
    const mockComments = [
      { community_id: "communityId1" },
      { community_id: "communityId2" },
    ];

    // Mock active communities data
    const mockActiveCommunities = [
      { _id: "communityId1", name: "Community 1" },
      { _id: "communityId2", name: "Community 2" },
    ];

    // Mock the behavior of functions and models
    User.findById.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(mockUser);

    Post.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPosts),
    });

    Comment.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockComments),
    });
    Community.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockActiveCommunities),
    });
    getActiveCommunitiesHelper.mockReturnValue(mockActiveCommunities);

    // Expected result
    const expectedResult = {
      success: true,
      message: "Your active communities list is retrieved successfully",
      status: 200,
      content: {
        active_communities: mockActiveCommunities,
        showActiveCommunities: true,
      },
    };

    // Call the function and assert the result
    const result = await getActiveCommunities(request);
    expect(result).toEqual(expectedResult);
  });

  it("should return internal server error if an error occurs during retrieval", async () => {
    const request = {
      headers: { authorization: "Bearer valid_token" },
    }; // Mock request object

    // Mock the behavior of functions to throw an error
    User.findById.mockRejectedValue(new Error("Database error"));

    // Expected result
    const expectedResult = {
      success: false,
      status: 500,
      err: "Internal Server Error",
      msg: "An error occurred while retrieving posts.",
    };

    // Call the function and assert the result
    const result = await getActiveCommunities(request);
    expect(result).toEqual(expectedResult);
  });
});
