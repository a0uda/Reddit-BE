import {
  getComment,
  getCommentWithReplies,
  newComment,
  replyToComment,
  commentVote,
  commentSave,
  commentApprove,
  commentRemove,
  commentReport,
} from "../../src/controller/comments.js";
import { Comment } from "../../src/db/models/Comment.js";
import { User } from "../../src/db/models/User.js";
import { Post } from "../../src/db/models/Post.js";
import { getPost } from "../../src/controller/posts.js";
import jwt from "jsonwebtoken"; // Import jwt module
import {
  checkBannedUser,
  getCommentRepliesHelper,
  getCommunity,
} from "../../src/services/posts.js";

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../../src/db/models/Comment");
jest.mock("../../src/db/models/User");
jest.mock("../../src/db/models/Post");
jest.mock("../../src/services/posts.js");
jest.mock("../../src/controller/posts");

describe("Get Comment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if token is missin", async () => {
    const request = {
      headers: {},
    };
    const result = await getComment(request, true);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if comment id is missing", async () => {
    const request = {
      body: {},
      query: {},
    };
    const result = await getComment(request, false);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Comment id is required");
  });

  it("should return error if comment is not found", async () => {
    const request = {
      body: { id: "invalid_comment_id" },
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);

    const result = await getComment(request, false);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Comment Not found");
  });

  it("should return comment if found and user verified", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { id: "valid_comment_id" },
    };
    const verifiedUser = {
      _id: "verified_user_id",
      token: ["valid_token"],
      generateAuthToken: jest.fn(),
    };
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
    };
    User.mockImplementation(() => mockUser);
    User.findById = jest.fn().mockReturnValue(verifiedUser);
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);
    jwt.verify.mockReturnValue({ _id: verifiedUser._id });

    const result = await getComment(request, true);
    expect(result.success).toBe(true);
    expect(result.comment).toEqual(mockComment);
    expect(result.user).toEqual(verifiedUser);
    expect(result.message).toEqual("Comment Retrieved successfully");
  });

  it("should return comment if found and user not verified", async () => {
    const request = {
      body: { id: "valid_comment_id" },
    };
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);

    const result = await getComment(request, false);
    expect(result.success).toBe(true);
    expect(result.comment).toEqual(mockComment);
    expect(result.user).toBeUndefined();
    expect(result.message).toEqual("Comment Retrieved successfully");
  });
});

describe("Get Comment with replies", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should return error if comment id is missing", async () => {
    const request = {
      body: {},
      query: {},
    };
    const result = await getCommentWithReplies(request, false);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Comment id is required");
  });

  it("should return error if comment is not found", async () => {
    const request = {
      body: { id: "invalid_comment_id" },
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);

    const result = await getCommentWithReplies(request, false);
    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Comment Not found");
  });

  it("should return comment if found and user not verified", async () => {
    const request = {
      body: { id: "valid_comment_id" },
    };
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);

    const result = await getCommentWithReplies(request, false);
    expect(result.success).toBe(true);
    expect(result.comment).toEqual(mockComment);
    expect(result.user).toBeUndefined();
    expect(result.message).toEqual("Comment Retrieved sucessfully");
  });
});

describe("New Comment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if post retrieval fails", async () => {
    const request = {};
    getPost.mockResolvedValueOnce({
      success: false,
      error: { status: 404, message: "Post Not found" },
    });

    const result = await newComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Post Not found");
  });

  it("should return error if comment description is missing", async () => {
    const request = {};
    getPost.mockResolvedValueOnce({
      success: true,
      post: {},
      user: {},
      message: "Post Retrieved successfully",
    });

    const result = await newComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Comment description is required");
  });

  it("should return error if post is locked", async () => {
    const request = { body: { description: "Test comment" } };
    getPost.mockResolvedValueOnce({
      success: true,
      post: { locked_flag: true },
      user: {},
      message: "Post Retrieved successfully",
    });

    Post.mockReturnValueOnce({
      save: jest.fn().mockResolvedValueOnce(true),
    });

    const result = await newComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Post is locked can't comment");
  });

  it("should return error if user is banned from posting in the community", async () => {
    const request = { body: { description: "Test comment" } };
    getPost.mockResolvedValueOnce({
      success: true,
      post: { post_in_community_flag: true, community_name: "test_community" },
      user: {},
      message: "Post Retrieved successfully",
    });
    getCommunity.mockResolvedValueOnce({
      success: true,
      community: { banned_users: ["banned_user_id"] },
      message: "Community Retrieved successfully",
    });
    checkBannedUser.mockResolvedValueOnce({
      success: false,
      error: {
        status: 403,
        message: "User is banned from posting in the community",
      },
    });

    const result = await newComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(403);
    expect(result.error.message).toEqual(
      "User is banned from posting in the community"
    );
  });

  it("should return error if  community not found", async () => {
    const request = { body: { description: "Test comment" } };
    getPost.mockResolvedValueOnce({
      success: true,
      post: { post_in_community_flag: true, community_name: "test_community" },
      user: {},
      message: "Post Retrieved successfully",
    });
    getCommunity.mockResolvedValueOnce({
      success: false,
      error: {
        status: 404,
        message: "Community not found",
      },
    });

    const result = await newComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Community not found");
  });

  it("should create comment successfully", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { description: "Test comment" },
    };
    const mockPost = {
      _id: "post_id",
      locked_flag: false,
      post_in_community_flag: false,
      description: "test",
      comments_count: 0,
      save: jest.fn(),
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
    getPost.mockResolvedValueOnce({
      success: true,
      post: mockPost,
      user: mockUser,
      message: "Post Retrieved successfully",
    });
    Post.findById = jest.fn().mockReturnValue(mockPost);
    const mockComment = {
      _id: "commentId1",
      post_id: "postId",
      user_id: "mockUserId",
      upvote_users: [],
      upvotes_count: 0,
    };
    Comment.mockReturnValueOnce({
      save: jest.fn().mockResolvedValueOnce(mockComment),
    });

    Post.mockReturnValueOnce({
      save: jest.fn().mockResolvedValueOnce(true),
    });
    const result = await newComment(request);

    expect(result.success).toBe(true);
    expect(result.error).toEqual({});
    expect(result.message).toEqual("Comment created successfully");
  });
});

describe("Reply to Comment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if comment retrieval fails", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { id: "invalid_comment_id" },
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
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);

    const result = await replyToComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Comment Not found");
  });

  it("should return error if comment description is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { id: "valid_comment_id" },
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
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);
    const result = await replyToComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Comment description is required");
  });

  it("should return error if comment is locked", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { id: "valid_comment_id", description: "Test reply" },
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
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
      locked_flag: true,
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);
    const result = await replyToComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Comment is locked can't reply");
  });

  it("should return error if user is banned from replying in the community", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { id: "valid_comment_id", description: "Test reply" },
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
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
      comment_in_community_flag: true,
      community_name: "test_community",
      locked_flag: false,
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);
    const mockCommunity = {
      _id: "mockCommunityId",
      name: "TestCommunity",
      banned_users: [{ id: "mockUserId" }],
    };
    getCommunity.mockResolvedValue({
      success: true,
      community: mockCommunity,
    });
    const result = await replyToComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("User can't reply he is banned");
  });

  it("should return error if  community not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { id: "valid_comment_id", description: "Test reply" },
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
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
      comment_in_community_flag: true,
      community_name: "test_community",
      locked_flag: false,
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);
    const mockCommunity = {
      _id: "mockCommunityId",
      name: "TestCommunity",
      banned_users: [{ id: "mockUserId" }],
    };
    getCommunity.mockResolvedValue({
      success: false,
      error: {
        status: 404,
        message: "Community not found",
      },
    });
    const result = await replyToComment(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Community not found");
  });
  it("should reply to comment successfully in community", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: { id: "valid_comment_id", description: "Test reply" },
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
    const mockComment = {
      _id: "valid_comment_id",
      post_id: "postId",
      text: "Test comment",
      user_id: "commenter_user_id",
      comment_in_community_flag: true,
      community_name: "test_community",
      locked_flag: false,
      replies_comments_ids: [],
      save: jest.fn(),
    };
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockComment),
    };
    Comment.findById = jest.fn().mockReturnValue(mockQuery);
    const mockCommunity = {
      _id: "mockCommunityId",
      name: "TestCommunity",
      banned_users: [],
    };
    getCommunity.mockResolvedValue({
      success: true,
      community: mockCommunity,
    });
    const mockPost = new Post({
      _id: "postId",
      upvotes_count: 0,
      downvotes_count: 0,
      user_details: {
        upvote_rate: 0,
        total_shares: 0,
      },
      shares_count: 0,
      comments_count: 0,
      save: jest.fn(),
    });

    Post.findById.mockReturnValueOnce(mockPost);
    const result = await replyToComment(request);

    expect(result.success).toBe(true);
    expect(result.error).toEqual({});
    expect(result.message).toEqual("Replied to comment sucessfully ");
  });
});
describe("Comment Vote", () => {
  beforeEach(() => {
    // Clear all mock implementations and reset mock calls
    jest.clearAllMocks();
  });

  it("should successfully upvote a comment", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
        vote: "1",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    // Mock comment
    const mockComment = {
      _id: "valid_comment_id",
      upvote_users: [],
      downvote_users: [],
      upvotes_count: 0,
      downvotes_count: 0,
      save: jest.fn(),
    };
    Comment.findOne.mockResolvedValueOnce(mockComment);

    // Call the commentVote function
    const result = await commentVote(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("voted successfully");
    // Add more assertions if necessary
  });
  it("should successfully upvote a comment", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
        vote: "-1",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    // Mock comment
    const mockComment = {
      _id: "valid_comment_id",
      upvote_users: [],
      downvote_users: [],
      upvotes_count: 0,
      downvotes_count: 0,
      save: jest.fn(),
    };
    Comment.findOne.mockResolvedValueOnce(mockComment);

    // Call the commentVote function
    const result = await commentVote(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("voted successfully");
    // Add more assertions if necessary
  });

  it("should return error if comment is not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
        vote: "1",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    // Mock comment
    const mockComment = {
      _id: "valid_comment_id",
      upvote_users: [],
      downvote_users: [],
      upvotes_count: 0,
      downvotes_count: 0,
      save: jest.fn(),
    };
    Comment.findOne.mockResolvedValueOnce(null);

    const result = await commentVote(request);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe("Comment Not Found or User Not Authorized");
  });
});

describe("Comment Save", () => {
  beforeEach(() => {
    // Clear all mock implementations and reset mock calls
    jest.clearAllMocks();
  });

  it("should successfully save a comment", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: [],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const mockComment = {
      _id: "valid_comment_id",
    };
    Comment.findOne.mockResolvedValueOnce(mockComment);

    // Call the commentSave function
    const result = await commentSave(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("Action completed successfully");
    // Add more assertions if necessary
  });

  it("should remove a saved comment if already saved", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const mockComment = {
      _id: "valid_comment_id",
    };
    Comment.findOne.mockResolvedValueOnce(mockComment);

    // Call the commentSave function
    const result = await commentSave(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("Action completed successfully");
    // Add more assertions if necessary
  });

  it("should return error if comment is not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    Comment.findOne.mockResolvedValueOnce(null);

    // Call the commentSave function
    const result = await commentSave(request);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe("Comment Not Found ");
    // Add more assertions if necessary
  });
});
describe("Comment Approve", () => {
  beforeEach(() => {
    // Clear all mock implementations and reset mock calls
    jest.clearAllMocks();
  });

  it("should successfully approve a comment", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    // Mock comment
    const mockComment = {
      _id: "valid_comment_id",
      user_id: "userId",
      moderator_details: {
        removed_flag: true,
        removed_by: "moderatorId",
        removed_date: new Date(),
        approved_flag: false,
        approved_by: null,
        approved_date: null,
      },
      save: jest.fn(),
    };
    Comment.findOne.mockResolvedValueOnce(mockComment);

    // Call the commentApprove function
    const result = await commentApprove(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("comment approved successfully");
    expect(mockComment.moderator_details.approved_flag).toBe(true);
    expect(mockComment.moderator_details.approved_by).toBe("userId");
    // Add more assertions if necessary
  });

  it("should return error if comment is not found or user is not authorized", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    // Mock comment not found
    Comment.findOne.mockResolvedValueOnce(null);

    // Call the commentApprove function
    const result = await commentApprove(request);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe("comment Not Found or User Not Authorized");
    // Add more assertions if necessary
  });
});

describe("Comment Remove", () => {
  beforeEach(() => {
    // Clear all mock implementations and reset mock calls
    jest.clearAllMocks();
  });

  it("should successfully remove a comment", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    // Mock comment
    const mockComment = {
      _id: "valid_comment_id",
      user_id: "userId",
      moderator_details: {
        removed_flag: true,
        removed_by: "moderatorId",
        removed_date: new Date(),
        approved_flag: false,
        approved_by: null,
        approved_date: null,
      },
      save: jest.fn(),
    };
    Comment.findOne.mockResolvedValueOnce(mockComment);

    // Call the commentApprove function
    const result = await commentRemove(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("comment removed successfully");
  });

  it("should return error if comment is not found or user is not authorized", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    // Mock comment not found
    Comment.findOne.mockResolvedValueOnce(null);

    // Call the commentApprove function
    const result = await commentRemove(request);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe("comment Not Found or User Not Authorized");
    // Add more assertions if necessary
  });
});

describe("Comment Report", () => {
  beforeEach(() => {
    // Clear all mock implementations and reset mock calls
    jest.clearAllMocks();
  });

  it("should successfully report a comment", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      reported_comments_ids: [],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    // Mock comment
    const mockComment = {
      _id: "valid_comment_id",
      user_id: "otherUserId",
    };
    Comment.findOne.mockResolvedValueOnce(mockComment);

    // Call the commentReport function
    const result = await commentReport(request);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("Comment is reported successfully");
    expect(mockUser.reported_comments_ids).toContain("valid_comment_id");
    // Add more assertions if necessary
  });

  it("should return error if comment is not found or user is not authorized to report", async () => {
    const request = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        id: "valid_comment_id",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      saved_comments_ids: ["valid_comment_id"],
      token: ["validToken"],
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    // Mock comment not found
    Comment.findOne.mockResolvedValueOnce(null);

    // Call the commentReport function
    const result = await commentReport(request);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe("Comment Not Found or User Not Authorized");
    // Add more assertions if necessary
  });
});
