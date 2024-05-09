import { Post } from "../../src/db/models/Post.js";
import { User } from "../../src/db/models/User.js";
import { Comment } from "../../src/db/models/Comment.js";
import {
  createPost,
  getPost,
  sharePost,
  getPostComments,
  getViewsCount,
  marknsfw,
  allowReplies,
  setSuggestedSort,
  pollVote,
  getTrendingPosts,
} from "../../src/controller/posts.js";
import {
  checkBannedUser,
  getCommentRepliesHelper,
  getCommunity,
  checkNewPostInput,
  checkApprovedUser,
  checkPostSettings,
  checkContentSettings,
  checkVotesMiddleware,
} from "../../src/services/posts.js";
import { checkCommentVotesMiddleware } from "../../src/services/comments.js";
import jwt from "jsonwebtoken";
import {
  getCommunityGeneralSettings,
  getCommunityPostsAndComments,
  getCommunityContentControls,
} from "../../src/services/communitySettingsService.js";

jest.mock("jsonwebtoken");
jest.mock("../../src/db/models/User");
jest.mock("../../src/db/models/Comment");
jest.mock("../../src/db/models/Post");
jest.mock("../../src/services/posts.js");
jest.mock("../../src/services/comments.js");
jest.mock("../../src/services/communitySettingsService.js");

describe("New Post", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
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
        ],
        videos: [{ path: "/video1.mp4" }, { path: "/video2.mp4" }],
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

    const result = await createPost(request);

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

    const result = await createPost(request);

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

    const result = await createPost(request);

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

    const mockCommunity = { _id: "mockCommunityId", name: "TestCommunity" };
    getCommunity.mockResolvedValue({ success: true, community: mockCommunity });

    const mockCommunitySettings = { type: "Public", nsfw_flag: false };
    getCommunityGeneralSettings.mockResolvedValue({
      success: true,
      general_settings: mockCommunitySettings,
    });

    checkApprovedUser.mockResolvedValue({ success: true });
    checkBannedUser.mockResolvedValue({ success: true });

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

    checkPostSettings.mockResolvedValue({ success: true });
    checkContentSettings.mockResolvedValue({ success: true });

    const result = await createPost(request);

    expect(result.success).toBe(true);
    expect(result.error).toEqual({});
    expect(result.message).toBe("Post created sucessfully ");
  });

  it("should create a post successfully in a user profile", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        title: "Title Test",
        description: "Test Description",
        post_in_community_flag: false,
        type: "text",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      profile_settings: {
        nsfw_flag: false,
      },
      upvotes_posts_ids: [],
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const mockCommunity = { _id: "mockCommunityId", name: "TestCommunity" };
    getCommunity.mockResolvedValue({ success: true, community: mockCommunity });

    const mockCommunitySettings = { type: "Public", nsfw_flag: false };
    getCommunityGeneralSettings.mockResolvedValue({
      success: true,
      general_settings: mockCommunitySettings,
    });

    checkApprovedUser.mockResolvedValue({ success: true });
    checkBannedUser.mockResolvedValue({ success: true });

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

    checkPostSettings.mockResolvedValue({ success: true });
    checkContentSettings.mockResolvedValue({ success: true });

    const result = await createPost(request);

    expect(result.success).toBe(true);
    expect(result.error).toEqual({});
    expect(result.message).toBe("Post created sucessfully ");
  });
});

describe("sharePost", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await sharePost(request, true);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should successfully share a post in a community", async () => {
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

    expect(result.success).toBe(true);
    expect(result.error).toEqual({});
    expect(result.message).toBe("Shared post sucessfully");
  });

  it("should return an error if post_in_community_flag is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
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

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "post_in_community_flag and caption are required"
    );
  });

  it("should return an error if caption is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        community_name: "TestCommunity",
        post_in_community_flag: false,
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

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "post_in_community_flag and caption are required"
    );
  });

  it("should return an error if user has already reposted the same post in the same community", async () => {
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

    const existingRepost = new Post({
      _id: "existingRepostId",
      reposted: {
        original_post_id: mockPost._id,
      },
      user_id: mockUser._id,
      post_in_community_flag: true,
      community_name: "TestCommunity",
    });
    Post.findOne.mockResolvedValueOnce(existingRepost);

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "You have already reposted this post in the same community/your profile"
    );
  });

  // it("should return an error if post is already reposted", async () => {
  //   const request = {
  //     headers: {
  //       authorization: "Bearer valid_token",
  //     },
  //     body: {
  //       id: "postId",
  //       post_in_community_flag: true,
  //       community_name: "TestCommunity",
  //       caption: "Test caption",
  //       oc_flag: false,
  //       spoiler_flag: false,
  //       nsfw_flag: false,
  //     },
  //   };

  //   const mockUser = {
  //     _id: "mockUserId",
  //     token: ["valid_token"],
  //     upvotes_posts_ids: [],
  //     save: jest.fn(),
  //   };
  //   User.findById.mockResolvedValue(mockUser);
  //   jwt.verify.mockReturnValue({ _id: mockUser._id });

  //   const mockPost = new Post({
  //     _id: "postId",
  //     upvotes_count: 0,
  //     downvotes_count: 0,
  //     is_reposted_flag: true,
  //     user_details: {
  //       upvote_rate: 0,
  //       total_shares: 0,
  //     },
  //     shares_count: 0,
  //     save: jest.fn(),
  //   });
  //   const posts_and_comments = {
  //     posts: {
  //       allow_crossposting_of_posts: true,
  //     },
  //   };
  //   Post.findById.mockReturnValueOnce(mockPost);
  //   checkVotesMiddleware.mockResolvedValue([mockPost]);

  //   getCommunity.mockResolvedValue({
  //     success: true,
  //     community: {
  //       _id: "communityId",
  //     },
  //   });
  //   getCommunityPostsAndComments.mockResolvedValue({
  //     posts_and_comments,
  //   });
  //   getCommunityGeneralSettings.mockResolvedValue({
  //     general_settings: { type: "Public", nsfw_flag: false },
  //   });
  //   checkBannedUser.mockResolvedValue({ success: true });
  //   checkPostSettings.mockResolvedValue({ success: true });
  //   checkContentSettings.mockResolvedValue({ success: true });

  //   Post.findOne.mockResolvedValueOnce(null);

  //   const result = await sharePost(request);

  //   expect(result).toBe(false);
  //   expect(result.error.status).toBe(400);
  //   expect(result.error.message).toBe(
  //     "You cannot repost a reposted post"
  //   );
  // });

  it("should return an error if crossposting is not allowed in the community", async () => {
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
        allow_crossposting_of_posts: false,
      },
    };
    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

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

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe("Can't repost to this community");
  });

  it("should return an error if the community type is not 'Public' and the user is not approved", async () => {
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
      general_settings: { type: "Restricted", nsfw_flag: false },
    });
    checkApprovedUser.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: "User can't do this action because he is not approved",
      },
    });

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "User can't do this action because he is not approved"
    );
  });

  it("should return an error if the user is banned from posting in the community", async () => {
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
    checkBannedUser.mockResolvedValue({
      success: false,
      error: {
        status: 400,
        message: "User can't do this action because he is banned",
      },
    });

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "User can't do this action because he is banned"
    );
  });

  it("should return an error if the community not found", async () => {
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

    getCommunity.mockResolvedValue({
      success: false,
      error: {
        status: 404,
        message: "Community not found",
      },
    });

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(404);
    expect(result.error.message).toBe("Community not found");
  });

  it("should return an internal server error", async () => {
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

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    getCommunity.mockRejectedValueOnce(new Error("Database error"));

    const result = await sharePost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
  });
});

describe("getPost", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await getPost(request, true);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if post not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
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

    Post.findById.mockReturnValueOnce(null);
    checkVotesMiddleware.mockResolvedValue([null]);

    const result = await getPost(request, true);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Post Not found");
  });

  it("should successfully get a post with authentication from body", async () => {
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

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    const result = await getPost(request, true);

    expect(result.success).toBe(true);

    expect(result.message).toBe("Post Retrieved sucessfully");
  });

  it("should successfully get a post with authentication from query", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      query: {
        id: "postId",
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

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    const result = await getPost(request, true);

    expect(result.success).toBe(true);

    expect(result.message).toBe("Post Retrieved sucessfully");
  });

  it("should successfully get a post without authentication", async () => {
    const request = {
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

    User.findById.mockResolvedValue(null);
    jwt.verify.mockReturnValue(null);

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

    Post.findById.mockReturnValueOnce(mockPost);

    const result = await getPost(request, false);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Post Retrieved sucessfully");
  });

  it("should return an internal server error", async () => {
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

    Post.findById.mockRejectedValueOnce(new Error("Database error"));

    const result = await getPost(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });
});

describe("getPostComments", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully get comments without authentication", async () => {
    const request = {
      body: {
        id: "postId",
      },
    };
    const mockPost = {
      _id: "postId",
    };
    const mockComments = [
      {
        _id: "commentId1",
        post_id: "postId",
      },
      {
        _id: "commentId2",
        post_id: "postId",
      },
    ];

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComments),
    };
    Comment.find = jest.fn().mockReturnValue(mockQuery);

    const result = await getPostComments(request);

    expect(result.success).toBe(true);
    expect(result.comments).toEqual(mockComments);
    expect(result.message).toBe("Comments Retrieved sucessfully");
  });

  it("should successfully get comments with authentication", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
      },
    };

    const mockPost = {
      _id: "postId",
    };
    const mockComments = [
      {
        _id: "commentId1",
        post_id: "postId",
      },
      {
        _id: "commentId2",
        post_id: "postId",
      },
    ];

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      upvotes_posts_ids: [],
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComments),
    };
    Comment.find = jest.fn().mockReturnValue(mockQuery);
    checkCommentVotesMiddleware.mockResolvedValueOnce(mockComments);

    const result = await getPostComments(request);

    expect(result.success).toBe(true);
    expect(result.comments).toEqual(mockComments);
    expect(result.message).toBe("Comments Retrieved sucessfully");
  });

  it("should return an error", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        set_suggested_sort: "invalid_choice",
      },
    };

    Post.findById.mockResolvedValue(new Error("Database error"));

    const result = await getPostComments(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });

  it("should return an internal server error", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
      },
    };

    const mockPost = {
      _id: "postId",
    };
    const mockComments = [
      {
        _id: "commentId1",
        post_id: "postId",
      },
      {
        _id: "commentId2",
        post_id: "postId",
      },
    ];

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    // const mockQuery = {
    //   populate: jest.fn().mockReturnThis(),
    //   exec: jest.fn().mockResolvedValue(mockComments),
    // };
    Comment.find = jest.fn().mockReturnValue(new Error("Database error"));

    const result = await getPostComments(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });
});

describe("getViewsCount", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully get a post views count", async () => {
    const request = {
      body: {
        id: "postId",
      },
    };

    const mockPost = new Post({
      _id: "postId",
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      views_count: 8,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);

    const result = await getViewsCount(request);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Post views_count retrived sucessfully ");
    expect(result.views_count).toEqual(mockPost.views_count);
  });

  it("should return an internal server error", async () => {
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

    Post.findById.mockRejectedValueOnce(new Error("Database error"));

    const result = await getViewsCount(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });
});

describe("marknsfw", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully get a post views count", async () => {
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
      nsfw_flag: false,
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await marknsfw(request);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Post nsfw_flag updated sucessfully to true");
  });

  it("should return an internal server error", async () => {
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
      nsfw_flag: false,
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(new Error("Database error"));
    const result = await marknsfw(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });

  it("should return error", async () => {
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

    Post.findById.mockRejectedValueOnce(new Error("Database error"));

    const result = await marknsfw(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });
});

describe("allowReplies", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully get a post views count", async () => {
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
      nsfw_flag: false,
      upvotes_count: 0,
      allowreplies_flag: false,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await allowReplies(request);

    expect(result.success).toBe(true);
    expect(result.message).toBe(
      "Post allowreplies_flag updated sucessfully to true"
    );
  });

  it("should return an internal server error", async () => {
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
      nsfw_flag: false,
      upvotes_count: 0,
      allowreplies_flag: false,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(new Error("Database error"));
    const result = await allowReplies(request);
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });

  it("should return an error", async () => {
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

    Post.findById.mockRejectedValueOnce(new Error("Database error"));

    const result = await allowReplies(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });
});

describe("setSuggestedSort", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully set suggessted sort", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        set_suggested_sort: "Controversial",
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
      nsfw_flag: false,
      upvotes_count: 0,
      allowreplies_flag: false,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await setSuggestedSort(request);

    expect(result.success).toBe(true);
    expect(result.message).toBe(
      "Post set_suggested_sort updated sucessfully to Controversial"
    );
  });

  it("should return an error if choice is invalid", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        set_suggested_sort: "invalid_choice",
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
      nsfw_flag: false,
      upvotes_count: 0,
      allowreplies_flag: false,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await setSuggestedSort(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "Invalid value for set_suggested_sort. Valid options are: None (Recommended), Best, Old, Top, Q&A, Live (Beta), Controversial, New"
    );
  });

  // it("should return an internal server error", async () => {
  //   const request = {
  //     headers: {
  //       authorization: "Bearer valid_token",
  //     },
  //     body: {
  //       id: "postId",
  //       set_suggested_sort: "New",
  //     },
  //   };
  //   const mockUser = {
  //     _id: "mockUserId",
  //     token: ["valid_token"],
  //     upvotes_posts_ids: [],
  //     save: jest.fn(),
  //   };
  //   User.findById.mockResolvedValue(mockUser);
  //   jwt.verify.mockReturnValue({ _id: mockUser._id });

  //   const mockPost = {
  //     _id: "postId",
  //     nsfw_flag: false,
  //     upvotes_count: 0,
  //     allowreplies_flag: false,
  //     downvotes_count: 0,
  //     user_details: {
  //       upvote_rate: 0,
  //       total_shares: 0,
  //     },
  //     shares_count: 0,
  //     save: jest.fn(),
  //   };

  //   Post.findById.mockReturnValueOnce(mockPost);
  //   checkVotesMiddleware.mockResolvedValue([mockPost]);

  //   Post.findById.mockRejectedValueOnce(new Error("Database error"));
  //   const result = await setSuggestedSort(request);

  //   expect(result.success).toBe(false);
  //   expect(result.error.status).toBe(500);
  //   expect(result.error.message).toBe("Internal server error");
  // });

  it("should return an error", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        set_suggested_sort: "invalid_choice",
      },
    };

    User.findById.mockResolvedValue(new Error("Database error"));

    const result = await setSuggestedSort(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe("Internal server error");
  });
});

describe("pollVote", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully vote on poll", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        option_id: "option1Id",
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

    const mockPost = {
      _id: "postId",
      type: "polls",
      created_at: new Date(),
      polls_voting_is_expired_flag: false,
      polls_voting_length: 3,
      polls: [
        {
          _id: "option1Id",
          options: "option1",
          votes: 0,
          users_ids: [],
        },
        {
          _id: "option2Id",
          options: "option2",
          votes: 0,
          users_ids: [],
        },
      ],
      save: jest.fn(),
    };

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await pollVote(request);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Voted to option option1 sucessfully");
  });

  it("should error if missing post id", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {},
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      upvotes_posts_ids: [],
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const mockPost = {
      _id: "postId",
      type: "polls",
      created_at: new Date(),
      polls_voting_is_expired_flag: false,
      polls_voting_length: 3,
      polls: [
        {
          _id: "option1Id",
          options: "option1",
          votes: 0,
          users_ids: [],
        },
        {
          _id: "option2Id",
          options: "option2",
          votes: 0,
          users_ids: [],
        },
      ],
      save: jest.fn(),
    };

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await pollVote(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe("Post id is required");
  });

  it("should error if missing option id", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
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

    const mockPost = {
      _id: "postId",
      type: "polls",
      created_at: new Date(),
      polls_voting_is_expired_flag: false,
      polls_voting_length: 3,
      polls: [
        {
          _id: "option1Id",
          options: "option1",
          votes: 0,
          users_ids: [],
        },
        {
          _id: "option2Id",
          options: "option2",
          votes: 0,
          users_ids: [],
        },
      ],
      save: jest.fn(),
    };

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await pollVote(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe("Required post id and option id");
  });

  it("should error if post is not of type polls", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        option_id: "option1Id",
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

    const mockPost = {
      _id: "postId",
      type: "text",
      created_at: new Date(),
      polls_voting_is_expired_flag: false,
      polls_voting_length: 3,
      polls: [
        {
          _id: "option1Id",
          options: "option1",
          votes: 0,
          users_ids: [],
        },
        {
          _id: "option2Id",
          options: "option2",
          votes: 0,
          users_ids: [],
        },
      ],
      save: jest.fn(),
    };

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await pollVote(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe("Post is not of type polls");
  });

  it("should error if poll is expired", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        option_id: "option1Id",
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

    const mockPost = {
      _id: "postId",
      type: "polls",
      created_at: new Date(),
      polls_voting_is_expired_flag: true,
      polls_voting_length: 3,
      polls: [
        {
          _id: "option1Id",
          options: "option1",
          votes: 0,
          users_ids: [],
        },
        {
          _id: "option2Id",
          options: "option2",
          votes: 0,
          users_ids: [],
        },
      ],
      save: jest.fn(),
    };

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await pollVote(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe("Post poll vote is expired");
  });

  it("should error if poll is expired in date", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        option_id: "option1Id",
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
    const created_at = new Date();
    created_at.setDate(created_at.getDate() - 7);
    const mockPost = {
      _id: "postId",
      type: "polls",
      created_at,
      polls_voting_is_expired_flag: true,
      polls_voting_length: 3,
      polls: [
        {
          _id: "option1Id",
          options: "option1",
          votes: 0,
          users_ids: [],
        },
        {
          _id: "option2Id",
          options: "option2",
          votes: 0,
          users_ids: [],
        },
      ],
      save: jest.fn(),
    };

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await pollVote(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe("Post poll vote is expired");
  });

  it("should error if option not found in poll", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        id: "postId",
        option_id: "option3Id",
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

    const mockPost = {
      _id: "postId",
      type: "polls",
      created_at: new Date(),
      polls_voting_is_expired_flag: false,
      polls_voting_length: 3,
      polls: [
        {
          _id: "option1Id",
          options: "option1",
          votes: 0,
          users_ids: [],
        },
        {
          _id: "option2Id",
          options: "option2",
          votes: 0,
          users_ids: [],
        },
      ],
      save: jest.fn(),
    };

    Post.findById.mockReturnValueOnce(mockPost);
    checkVotesMiddleware.mockResolvedValue([mockPost]);
    
    Post.findById.mockReturnValueOnce(mockPost);
    const result = await pollVote(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe("Option not found in post poll");
  });

  // it("should return an internal server error", async () => {
  //   const request = {
  //     headers: {
  //       authorization: "Bearer valid_token",
  //     },
  //     body: {
  //       id: "postId",
  //       option_id: "option1Id",
  //     },
  //   };
  //   const mockUser = {
  //     _id: "mockUserId",
  //     token: ["valid_token"],
  //     upvotes_posts_ids: [],
  //     save: jest.fn(),
  //   };
  //   User.findById.mockResolvedValue(mockUser);
  //   jwt.verify.mockReturnValue({ _id: mockUser._id });

  //   const mockPost = {
  //     _id: "postId",
  //     type: "polls",
  //     created_at: new Date(),
  //     polls_voting_is_expired_flag: false,
  //     polls_voting_length: 3,
  //     polls: [
  //       {
  //         _id: "option1Id",
  //         options: "option1",
  //         votes: 0,
  //         users_ids: [],
  //       },
  //       {
  //         _id: "option2Id",
  //         options: "option2",
  //         votes: 0,
  //         users_ids: [],
  //       },
  //     ],
  //     save: jest.fn(),
  //   };

  //   Post.findById.mockResolvedValueOnce(mockPost);
  //   checkVotesMiddleware.mockResolvedValueOnce([mockPost]);

  //   Post.findById.mockRejectedValueOnce(new Error("Database error"));
  //   const result = await pollVote(request);

  //   expect(result.success).toBe(false);
  //   expect(result.error.status).toBe(500);

  // });
});
