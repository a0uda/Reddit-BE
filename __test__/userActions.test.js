import { ObjectId } from "mongodb";
import {
  blockUser,
  reportUser,
  addOrRemovePicture,
  muteCommunity,
  clearHistory,
} from "../src/controller/userActions";
import { User } from "../src/db/models/User";
import { Community } from "../src/db/models/Community";
import jwt from "jsonwebtoken";

jest.mock("../src/db/models/User");
jest.mock("../src/db/models/Community");
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => ({
    _id: "userId",
  })),
}));

describe("User Blocking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should block a user successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        blocked_username: "userToBlock",
      },
    };

    const mockUser = {
      _id: "userId",
      username: "blockingUser",
      safety_and_privacy_settings: { blocked_users: [] },
      followers_ids: [],
      following_ids: [],
      save: jest.fn(),
    };
    const mockUserToBlock = {
      _id: "userToBlockId",
      followers_ids: [],
      following_ids: [],
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    User.findOne = jest.fn().mockReturnValueOnce(mockUserToBlock);

    const result = await blockUser(requestBody);
    console.log(result);
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("User blocked successfully.");
  });

  it("should unblock a user successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        blocked_username: "userToUnblock",
      },
    };

    const mockUser = {
      _id: "userId",
      username: "unblockingUser",
      safety_and_privacy_settings: {
        blocked_users: [{ _id: 1234 }],
      },
      save: jest.fn(),
    };
    const mockUserToUnBlock = {
      _id: 1234,
      followers_ids: [],
      following_ids: [],
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    User.findOne = jest.fn().mockReturnValueOnce(mockUserToUnBlock);

    const result = await blockUser(requestBody);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("User unblocked successfully.");
  });

  it("should handle blocking a non-existent user", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        blocked_username: "nonExistentUser",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "unblockingUser",
      safety_and_privacy_settings: {
        blocked_users: [{ _id: 1234 }],
      },
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    User.findOne = jest.fn().mockReturnValueOnce(null);

    const result = await blockUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.err).toBe("User Not Found");
  });

  it("should handle internal server error during blocking/unblocking", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        blocked_username: "userWithError",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "unblockingUser",
      safety_and_privacy_settings: {
        blocked_users: [{ _id: 1234 }],
      },
      save: jest.fn(),
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    User.findOne = jest.fn().mockImplementationOnce(() => {
      throw new Error("Internal Server Error");
    });

    const result = await blockUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.err).toBe("Internal Server Error");
    expect(result.msg).toBe(
      "An error occurred while blocking/unblocking user."
    );
  });
});

describe("User Reporting", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock function calls before each test
  });

  it("should report a user successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        reported_username: "userToReport",
      },
    };

    const mockUser = {
      _id: "userId",
      username: "reportingUser",
      reported_users: [],
      save: jest.fn(), // Mock the save function
    };
    const mockUserToReport = {
      _id: "userToReportId",
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    User.findOne = jest.fn().mockReturnValueOnce(mockUserToReport);

    const result = await reportUser(requestBody);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("User reported successfully.");
  });

  it("should handle reporting a non-existent user", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        reported_username: "nonExistentUser",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "reportingUser",
      reported_users: [],
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);
    User.findOne = jest.fn().mockReturnValueOnce(null); // Simulate non-existent user

    const result = await reportUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.err).toBe("User Not Found");
  });

  it("should handle internal server error during reporting", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        reported_username: "userWithError",
      },
    };
    const mockUser = {
      _id: "userId",
      username: "reportingUser",
      reported_users: [],
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    User.findOne = jest.fn().mockImplementationOnce(() => {
      throw new Error("Internal Server Error");
    });

    const result = await reportUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.err).toBe("Internal Server Error");
    expect(result.msg).toBe("An error occurred while reporting user.");
  });
});

describe("User Picture Management", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock function calls before each test
  });

  it("should add a picture successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        profile_picture: "profilePictureURL",
      },
    };

    const pictureField = "profile_picture";

    const mockUser = {
      _id: "userId",
      profile_settings: {},
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const result = await addOrRemovePicture(requestBody, pictureField);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe(`User ${pictureField} added successfully`);
  });

  it("should remove a picture successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {},
    };

    const pictureField = "profile_picture";

    const mockUser = {
      _id: "userId",
      profile_settings: {
        profile_picture: "existingProfilePictureURL",
      },
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const result = await addOrRemovePicture(requestBody, pictureField, true);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe(`User ${pictureField} removed successfully`);
  });

  it("should handle internal server error during picture management", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        profile_picture: "profilePictureURL",
      },
    };

    const pictureField = "profile_picture";

    const mockUser = {
      _id: "userId",
      profile_settings: {},
      save: jest.fn().mockImplementation(() => {
        throw new Error("Internal Server Error");
      }), // Mock save to throw an error
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const result = await addOrRemovePicture(requestBody, pictureField);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.err).toBe("Internal Server Error");
    expect(result.msg).toBe("An error occurred while processing the request.");
  });
});

describe("Community Muting", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock function calls before each test
  });

  it("should mute a community successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        community_name: "communityToMute",
      },
    };

    const mockUser = {
      _id: "userId",
      safety_and_privacy_settings: {
        muted_communities: [],
      },
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const mockCommunity = {
      _id: "communityId",
      name: "communityToMute",
    };
    Community.findOne = jest.fn().mockReturnValueOnce(mockCommunity);

    const result = await muteCommunity(requestBody);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("Community muted successfully.");
  });

  it("should unmute a community successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        community_name: "communityToUnmute",
      },
    };

    const mockUser = {
      _id: "userId",
      safety_and_privacy_settings: {
        muted_communities: ["communityId"],
      },
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const mockCommunity = {
      _id: "communityId",
      name: "communityToUnmute",
    };
    Community.findOne = jest.fn().mockReturnValueOnce(mockCommunity);

    const result = await muteCommunity(requestBody);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("Community unmuted successfully.");
  });

  it("should handle muting a non-existent community", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        community_name: "nonExistentCommunity",
      },
    };

    const mockUser = {
      _id: "userId",
      safety_and_privacy_settings: {
        muted_communities: [],
      },
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    Community.findOne = jest.fn().mockReturnValueOnce(null);

    const result = await muteCommunity(requestBody);

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.err).toBe("Community Not Found");
  });

  it("should handle internal server error during community muting", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {
        community_name: "communityWithError",
      },
    };

    const mockUser = {
      _id: "userId",
      safety_and_privacy_settings: {
        muted_communities: [],
      },
      save: jest.fn().mockImplementation(() => {
        throw new Error("Internal Server Error");
      }), // Mock save to throw an error
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const mockCommunity = {
      _id: "communityId",
      name: "communityWithError",
    };
    Community.findOne = jest.fn().mockReturnValueOnce(mockCommunity);

    const result = await muteCommunity(requestBody);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.err).toBe("Internal Server Error");
    expect(result.msg).toBe("An error occurred while processing the request.");
  });
});

describe("Clearing History", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock function calls before each test
  });

  it("should clear user history successfully", async () => {
    const requestBody = {
      headers: {
        authorization: "Bearer validToken",
      },
      body: {},
    };

    const mockUser = {
      _id: "userId",
      history_posts_ids: ["postId1", "postId2"],
      save: jest.fn(), // Mock the save function
    };
    User.findById = jest.fn().mockReturnValueOnce(mockUser);

    const result = await clearHistory(requestBody);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.msg).toBe("History cleared successfully.");
    expect(mockUser.history_posts_ids).toEqual([]); // Ensure history is cleared in the user object
    expect(mockUser.save).toHaveBeenCalled(); // Ensure the save function was called
  });
});