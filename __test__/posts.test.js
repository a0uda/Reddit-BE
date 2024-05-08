import { Post } from "../src/db/models/Post.js";
import { User } from "../src/db/models/User.js";
import { createPost, sharePost } from "../src/controller/posts.js";
import {
  checkBannedUser,
  getCommentRepliesHelper,
  getCommunity,
  checkNewPostInput,
  checkApprovedUser,
  checkPostSettings,
  checkContentSettings,
  checkVotesMiddleware,
} from "../src/services/posts.js";
import jwt from "jsonwebtoken";
import {
  getCommunityGeneralSettings,
  getCommunityPostsAndComments,
  getCommunityContentControls,
} from "../src/services/communitySettingsService.js";

jest.mock("jsonwebtoken");
jest.mock("../src/db/models/User");
jest.mock("../src/db/models/Post");
jest.mock("../src/services/posts.js");
jest.mock("../src/services/communitySettingsService.js");

describe("New Post", () => {
  beforeEach(() => {});

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await createPost(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if post title is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {},
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({
      result: false,
      message: "One of the required parameters is missing",
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "One of the required parameters is missing"
    );
  });

  it("should return error if type is not in enum", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        type: "InvalidType",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({
      result: false,
      message: "Type must be in image_and_videos, polls, url, text, hybrid",
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Type must be in image_and_videos, polls, url, text, hybrid"
    );
  });

  it("should return error if url type post has no link_url", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        type: "url",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({
      result: false,
      message: "Type url must have a link_url",
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Type url must have a link_url");
  });

  it("should return error if image_and_videos type post has no image or video", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        type: "image_and_videos",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({
      result: false,
      message: "Must provide image or video for post of type image_and_videos",
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Must provide image or video for post of type image_and_videos"
    );
  });

  it("should return error if any image or video has missing path", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "image_and_videos",
        images: [
          { path: "/image1.jpg" },
          {
            caption: "string",
            link: "string",
          },
        ], // One image with missing path
        videos: [{ path: "/video1.mp4" }, { path: "/video2.mp4" }], // All videos have paths
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({
      result: false,
      message: "All images and videos must have a path",
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "All images and videos must have a path"
    );
  });

  it("should return error if polls type post has less than 2 options", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        type: "polls",
        polls: ["option1"],
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({
      result: false,
      message:
        "Type polls must have at least 2 options and polls_voting_length and it must be between 1-7 days",
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Type polls must have at least 2 options and polls_voting_length and it must be between 1-7 days"
    );
  });

  it("should return error if post in community flag is true but community_name is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "text",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({
      result: false,
      message: "If post in community it must have a community_name",
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "If post in community it must have a community_name"
    );
  });

  it("should return error if community does not exist", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "text",
        community_name: "NonExistentCommunity",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({ result: true });
    getCommunity.mockResolvedValue({
      success: false,
      error: { status: 404, message: "Community not found" },
    });

    const result = await createPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Community not found");
  });

  it("should return error if community is not public and user is not approved", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "text",
        community_name: "TestCommunity",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({ result: true });
    getCommunity.mockResolvedValue({
      success: true,
    });
    getCommunityGeneralSettings.mockResolvedValue({
      general_settings: { visibility: "Restricted" },
    });
    checkApprovedUser.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: "User can't do this action because he is not approved",
      },
    });

    const result = await createPost(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "User can't do this action because he is not approved"
    );
  });

  it("should return error if user is banned from the community", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "text",
        community_name: "TestCommunity",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({ result: true });
    getCommunity.mockResolvedValue({
      success: true,
    });
    getCommunityGeneralSettings.mockResolvedValue({
      general_settings: { type: "Public" },
    });
    checkBannedUser.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: "User can't do this action because he is banned",
      },
    });

    // Call createPost function
    const result = await createPost(request);

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "User can't do this action because he is banned"
    );
  });

  it("should return error if community does't allow link posts and the type is link", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "link",
        community_name: "TestCommunity",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({ result: true });
    getCommunity.mockResolvedValue({
      success: true,
    });
    getCommunityGeneralSettings.mockResolvedValue({
      general_settings: { type: "Public" },
    });
    checkBannedUser.mockResolvedValue({
      success: true,
    });
    checkPostSettings.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: "Community doesn't allow this type of posts",
      },
    });

    // Call createPost function
    const result = await createPost(request);

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Community doesn't allow this type of posts"
    );
  });

  it("should return error if community does't allow multiple images per post", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "image_and_videos",
        images: [
          { path: "/image1.jpg" },
          {
            path: "/image2.jpg",
            caption: "string",
            link: "string",
          },
        ],
        community_name: "TestCommunity",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({ result: true });
    getCommunity.mockResolvedValue({
      success: true,
    });
    getCommunityGeneralSettings.mockResolvedValue({
      general_settings: { type: "Public" },
    });
    checkBannedUser.mockResolvedValue({
      success: true,
    });
    checkPostSettings.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: `Can't allow multiple images per post`,
      },
    });

    // Call createPost function
    const result = await createPost(request);

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      `Can't allow multiple images per post`
    );
  });

  it("should return error if post title is missing required words", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Test Post",
        description: "Test Description",
        post_in_community_flag: true,
        type: "text",
        community_name: "TestCommunity",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({ result: true });
    getCommunity.mockResolvedValue({ success: true });
    getCommunityGeneralSettings.mockResolvedValue({
      general_settings: { type: "Public" },
    });
    checkBannedUser.mockResolvedValue({
      success: true,
    });
    checkPostSettings.mockResolvedValue({
      success: true,
    });
    getCommunityContentControls.mockResolvedValue({
      success: true,
    });

    checkContentSettings.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: "Post title must include the following words: required_word",
      },
    });
    const result = await createPost(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Post title must include the following words: required_word"
    );
  });

  it("should return error if post title contains banned words", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Banned word Test",
        description: "Test Description",
        post_in_community_flag: true,
        type: "text",
        community_name: "TestCommunity",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    checkNewPostInput.mockResolvedValue({ result: true });
    getCommunity.mockResolvedValue({ success: true });
    getCommunityGeneralSettings.mockResolvedValue({
      general_settings: { type: "Public" },
    });
    checkBannedUser.mockResolvedValue({
      success: true,
    });
    checkPostSettings.mockResolvedValue({
      success: true,
    });
    getCommunityContentControls.mockResolvedValue({
      success: true,
    });
    checkContentSettings.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: "Post title contains banned words. ",
      },
    });
    const result = await createPost(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Post title contains banned words. ");
  });

  it("should create a post successfully in a community", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Title Test",
        description: "Test Description",
        post_in_community_flag: true,
        type: "text",
        community_name: "TestCommunity",
        community_id: "mockCommunityId",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      upvotes_posts_ids: [],
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });
    // Mock community
    const mockCommunity = { _id: "mockCommunityId", name: "TestCommunity" };
    getCommunity.mockResolvedValue({ success: true, community: mockCommunity });

    // Mock community settings
    const mockCommunitySettings = { type: "Public", nsfw_flag: false };
    getCommunityGeneralSettings.mockResolvedValue({
      success: true,
      general_settings: mockCommunitySettings,
    });

    // Mock user checks
    checkApprovedUser.mockResolvedValue({ success: true });
    checkBannedUser.mockResolvedValue({ success: true });

    // Mock post creation
    const mockPost = {
      _id: "mockPostId",
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
      },
      save: jest.fn(),
    };
    Post.mockReturnValueOnce({
      save: jest.fn().mockResolvedValue(mockPost),
    });

    // Mock content and post settings
    checkPostSettings.mockResolvedValue({ success: true });
    checkContentSettings.mockResolvedValue({ success: true });

    // Execute the function
    const result = await createPost(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.error).toEqual({});
    expect(result.message).toBe("Post created sucessfully ");
  });
});

describe("sharePost", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully share a post in a community", async () => {
    // Mock the request object
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        post_in_community_flag: true,
        community_name: "TestCommunity",
        caption: "Test caption",
        oc_flag: false,
        spoiler_flag: false,
        nsfw_flag: false,
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      upvotes_posts_ids: [],
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const mockPost = new Post({
      _id: "postId",
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    });
    const posts_and_comments = {
      posts: {
        allow_crossposting_of_posts: true,
      },
    };
    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);
    // Mock the getCommunity function to return a successful response
    getCommunity.mockResolvedValue({
      success: true,
      community: {
        _id: "communityId",
      },
    });
    getCommunityPostsAndComments.mockResolvedValue({
      posts_and_comments,
    });
    getCommunityGeneralSettings.mockResolvedValue({
      general_settings: { type: "Public", nsfw_flag: false },
    });
    checkBannedUser.mockResolvedValue({ success: true });
    checkPostSettings.mockResolvedValue({ success: true });
    checkContentSettings.mockResolvedValue({ success: true });

    const mockSharedPost = {
      _id: "mockCharedPostId",
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    };
    Post.mockReturnValueOnce({
      save: jest.fn().mockReturnValueOnce(mockSharedPost),
    });
    const mockPost2 = {
      _id: "postId",
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    };
    Post.findById.mockReturnValueOnce(mockPost2);

    const result = await sharePost(request);

    // Check the expected result
    expect(result.success).toBe(true);
    expect(result.error).toEqual({});
    expect(result.message).toBe("Shared post sucessfully");
  });
});
