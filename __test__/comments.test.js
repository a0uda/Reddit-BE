import {
  getComment,
  getCommentWithReplies,
  newComment,
  replyToComment,
} from "../src/controller/comments";
import { Comment } from "../src/db/models/Comment";
import { User } from "../src/db/models/User";
import { Post } from "../src/db/models/Post.js";
import { getPost } from "../src/controller/posts";
import jwt from "jsonwebtoken"; // Import jwt module
import {
  checkBannedUser,
  getCommentRepliesHelper,
  getCommunity,
} from "../src/services/posts.js";

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../src/db/models/Comment");
jest.mock("../src/db/models/User");
jest.mock("../src/db/models/Post");
jest.mock("../src/services/posts.js");
jest.mock("../src/controller/posts");

describe("Get Comment", () => {
  beforeEach(() => {});

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
    Comment.findById.mockResolvedValue(null);

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
      generateAuthToken: jest.fn(),
    };
    const mockComment = {
      _id: "valid_comment_id",
      text: "Test comment",
      user_id: "commenter_user_id",
    };
    User.mockImplementation(() => mockUser);
    User.findById = jest.fn().mockReturnValue(verifiedUser);
    Comment.findById.mockResolvedValue(mockComment);
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
    Comment.findById.mockResolvedValue(mockComment);

    const result = await getComment(request, false);
    expect(result.success).toBe(true);
    expect(result.comment).toEqual(mockComment);
    expect(result.user).toBeUndefined();
    expect(result.message).toEqual("Comment Retrieved successfully");
  });
});

describe("New Comment", () => {
  beforeEach(() => {});

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

  it("should create comment successfully", async () => {
    const request = { body: { description: "Test comment" } };
    const mockPost = {
      _id: "post_id",
      locked_flag: false,
      post_in_community_flag: false,
      description: "test",
      save: jest.fn(),
    };
    const mockUser = { _id: "user_id", username: "test_user" };
    getPost.mockResolvedValueOnce({
      success: true,
      post: mockPost,
      user: mockUser,
      message: "Post Retrieved successfully",
    });
    Comment.mockReturnValueOnce({
      save: jest.fn().mockResolvedValueOnce(true),
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

// describe("Reply to Comment", () => {
//   beforeEach(() => {
//     jest.mock("../src/controller/comments", () => ({
//       getComment: jest.fn(),
//     }));
//   });

//   it("should return error if comment retrieval fails", async () => {
//     const request = {};
//     getComment.mockResolvedValueOnce({
//       success: false,
//       error: { status: 404, message: "Comment Not found" },
//     });

//     const result = await replyToComment(request);

//     expect(result.success).toBe(false);
//     expect(result.error.status).toEqual(404);
//     expect(result.error.message).toEqual("Comment Not found");
//   });

//   it("should return error if comment description is missing", async () => {
//     const request = {};
//     getComment.mockResolvedValueOnce({
//       success: true,
//       comment: {},
//       user: {},
//       message: "Comment Retrieved successfully",
//     });

//     const result = await replyToComment(request);

//     expect(result.success).toBe(false);
//     expect(result.error.status).toEqual(400);
//     expect(result.error.message).toEqual("Comment description is required");
//   });

//   it("should return error if comment is locked", async () => {
//     const request = {};
//     getComment.mockResolvedValueOnce({
//       success: true,
//       comment: { locked_flag: true },
//       user: {},
//       message: "Comment Retrieved successfully",
//     });

//     const result = await replyToComment(request);

//     expect(result.success).toBe(false);
//     expect(result.error.status).toEqual(400);
//     expect(result.error.message).toEqual("Comment is locked can't reply");
//   });

//   it("should return error if user is banned from replying in the community", async () => {
//     const request = {};
//     getComment.mockResolvedValueOnce({
//       success: true,
//       comment: {
//         comment_in_community_flag: true,
//         community_name: "test_community",
//         banned_users: ["banned_user_id"],
//       },
//       user: { _id: "banned_user_id" },
//       message: "Comment Retrieved successfully",
//     });

//     const result = await replyToComment(request);

//     expect(result.success).toBe(false);
//     expect(result.error.status).toEqual(400);
//     expect(result.error.message).toEqual("User can't reply he is banned");
//   });

//   it("should reply to comment successfully", async () => {
//     const request = { body: { description: "Test reply" } };
//     const mockComment = {
//       _id: "comment_id",
//       post_id: "post_id",
//       user_id: "user_id",
//       username: "test_user",
//       parent_id: null,
//       parent_username: null,
//       is_reply: false,
//       created_at: Date.now(),
//       description: "Test comment",
//       comment_in_community_flag: false,
//       community_id: "community_id",
//       community_name: "test_community",
//       upvotes_count: 1,
//       spoiler_flag: false,
//       locked_flag: false,
//       replies_comments_ids: [],
//     };
//     const mockUser = { _id: "user_id", username: "test_user" };
//     getComment.mockResolvedValueOnce({
//       success: true,
//       comment: mockComment,
//       user: mockUser,
//       message: "Comment Retrieved successfully",
//     });
//     Comment.mockReturnValueOnce({
//       save: jest.fn().mockResolvedValueOnce(true),
//     });

//     const result = await replyToComment(request);

//     expect(result.success).toBe(true);
//     expect(result.error).toEqual({});
//     expect(result.message).toEqual("Replied to comment successfully");
//   });
// });
