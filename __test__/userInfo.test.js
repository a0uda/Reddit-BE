import { User } from "../src/db/models/User";
import {
  getFollowers,
  getFollowing,
  getFollowersCount,
  getFollowingCount,
} from "../src/controller/userInfo";
import { getFriendsFormat } from "../src/utils/userInfo";
import jwt from "jsonwebtoken"; // Import jwt module

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../src/db/models/User");
jest.mock("../src/utils/userInfo.js");

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
