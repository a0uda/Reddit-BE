import {
  getComment,
  getCommentWithReplies,
  newComment,
  replyToComment,
} from "../src/controller/comments";
import { Comment } from "../src/db/models/Comment";
import { User } from "../src/db/models/User";
import jwt from "jsonwebtoken"; // Import jwt module
import {
  checkBannedUser,
  getCommentRepliesHelper,
  getCommunity,
} from "../src/services/posts.js";

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../src/db/models/Comment");
jest.mock("../src/db/models/User");
jest.mock("../src/services/posts.js");

describe("Get Comment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
