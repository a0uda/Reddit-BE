import {
  checkNewPostInput,
  getCommunity,
  checkApprovedUser,
  checkBannedUser,
  checkPostSettings,
  checkContentSettings,
  checkVotesMiddleware,
} from "../../src/services/posts";
import { communityNameExists } from "../../src/utils/communities";
import {
  getCommunityPostsAndComments,
  getCommunityContentControls,
} from "../../src/services/communitySettingsService";
import { Post } from "../../src/db/models/Post";

jest.mock("../../src/utils/communities");
jest.mock("../../src/db/models/Post");
jest.mock("../../src/services/communitySettingsService");

describe("checkNewPostInput", () => {
  it("should return false if required parameters are missing", async () => {
    const requestBody = {
      post_in_community_flag: true,
      type: "image_and_videos",
    };

    const result = await checkNewPostInput(requestBody);

    expect(result.result).toBe(false);
    expect(result.message).toBe("One of the required parameters is missing");
  });

  it("should return false if type is not valid", async () => {
    const requestBody = {
      title: "Test Post",
      post_in_community_flag: true,
      type: "invalid_type",
    };

    const result = await checkNewPostInput(requestBody);

    expect(result.result).toBe(false);
    expect(result.message).toBe(
      "Type must be in image_and_videos, polls, url, text, hybrid"
    );
  });

  it('should return false if type is "image_and_videos" and no images or videos provided', async () => {
    const requestBody = {
      title: "Test Post",
      post_in_community_flag: true,
      type: "image_and_videos",
    };

    const result = await checkNewPostInput(requestBody);

    expect(result.result).toBe(false);
    expect(result.message).toBe(
      "Must provide image or video for post of type image_and_videos"
    );
  });

  it('should return false if type is "url" and no link_url provided', async () => {
    const requestBody = {
      title: "Test Post",
      post_in_community_flag: true,
      type: "url",
    };

    const result = await checkNewPostInput(requestBody);

    expect(result.result).toBe(false);
    expect(result.message).toBe("Type url must have a link_url");
  });

  it('should return false if type is "polls" and conditions are not met', async () => {
    const requestBody = {
      title: "Test Post",
      post_in_community_flag: true,
      type: "polls",
      polls: ["Option1"],
      polls_voting_length: 0,
    };

    const result = await checkNewPostInput(requestBody);

    expect(result.result).toBe(false);
    expect(result.message).toBe(
      "Type polls must have at least 2 options and polls_voting_length and it must be between 1-7 days"
    );
  });

  it("should return false if post_in_community_flag is true and no community_name provided", async () => {
    const requestBody = {
      title: "Test Post",
      post_in_community_flag: true,
      type: "text",
    };

    const result = await checkNewPostInput(requestBody);

    expect(result.result).toBe(false);
    expect(result.message).toBe(
      "If post in community it must have a community_name"
    );
  });

  it("should return true if all input parameters are valid", async () => {
    const requestBody = {
      title: "Test Post",
      post_in_community_flag: true,
      type: "text",
      community_name: "CommunityName",
    };

    const result = await checkNewPostInput(requestBody);

    expect(result.result).toBe(true);
  });
});

describe("getCommunity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if community does not exist", async () => {
    const nonExistentCommunityName = "NonExistentCommunity";
    communityNameExists.mockResolvedValueOnce(null);

    const result = await getCommunity(nonExistentCommunityName);

    expect(communityNameExists).toHaveBeenCalledWith(nonExistentCommunityName);
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(404);
    expect(result.error.message).toBe("Community not found");
  });

  it("should return the community if it exists", async () => {
    const existingCommunityName = "ExistingCommunity";
    const existingCommunity = {
      _id: "123abc",
      name: "ExistingCommunity",
      description: "A test community",
      members_count: 100,
      profile_picture: "community.jpg",
    };
    communityNameExists.mockResolvedValueOnce(existingCommunity);

    const result = await getCommunity(existingCommunityName);

    expect(communityNameExists).toHaveBeenCalledWith(existingCommunityName);
    expect(result.success).toBe(true);
    expect(result.community).toEqual(existingCommunity);
  });
});

describe("checkBannedUser", () => {
  it("should return success if user is not banned", async () => {
    // Create a mock community object without any banned users
    const community = {
      banned_users: [],
    };

    const username = "testuser";

    const result = await checkBannedUser(community, username);

    expect(result.success).toBe(true);
  });

  it("should return error if user is banned", async () => {
    // Create a mock community object with a banned user
    const community = {
      banned_users: [
        { username: "banneduser1" },
        { username: "banneduser2" },
        { username: "banneduser3" },
      ],
    };

    const username = "banneduser2"; // Simulate a banned user

    const result = await checkBannedUser(community, username);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "User can't do this action because he is banned"
    );
  });

  it("should return success if community has no banned users", async () => {
    // Create a mock community object with an empty banned users array
    const community = {
      banned_users: [],
    };

    const username = "nonbanneduser";

    const result = await checkBannedUser(community, username);

    expect(result.success).toBe(true);
  });
});

describe("checkApprovedUser", () => {
  it("should return success if user is approved", async () => {
    // Create a mock community object with approved users
    const community = {
      approved_users: [
        { username: "approveduser1" },
        { username: "approveduser2" },
        { username: "approveduser3" },
      ],
    };

    const username = "approveduser2"; // Simulate an approved user

    const result = await checkApprovedUser(community, username);

    expect(result.success).toBe(true);
  });

  it("should return error if user is not approved", async () => {
    // Create a mock community object without the required approved user
    const community = {
      approved_users: [
        { username: "approveduser1" },
        { username: "approveduser3" },
      ],
    };

    const username = "nonapproveduser"; // Simulate a non-approved user

    const result = await checkApprovedUser(community, username);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "User can't do this action because he is not approved"
    );
  });

  //   it("should return success if community has no approved users", async () => {
  //     // Create a mock community object with an empty array of approved users
  //     const community = {
  //       approved_users: [],
  //     };

  //     const username = "nonapproveduser"; // Simulate a non-approved user

  //     const result = await checkApprovedUser(community, username);

  //     expect(result.success).toBe(true);
  //   });
});

describe("checkPostSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow valid post type according to community settings", async () => {
    const communityName = "testcommunity";
    const mockPostsAndComments = {
      err: null,
      posts_and_comments: {
        posts: {
          post_type_options: "All Posts Allowed",
          allow_polls_posts: true,
          allow_multiple_images_per_post: true,
        },
      },
    };

    getCommunityPostsAndComments.mockResolvedValue(mockPostsAndComments);

    const validPost = {
      type: "image_and_videos",
      polls: [],
      images: [{ path: "image1.jpg" }, { path: "image2.jpg" }],
    };

    const result = await checkPostSettings(validPost, communityName);

    expect(result.success).toBe(true);
  });

  it("should disallow post type not allowed by community settings", async () => {
    const communityName = "testcommunity";
    const mockPostsAndComments = {
      err: null,
      posts_and_comments: {
        posts: {
          post_type_options: "Links Only",
          allow_polls_posts: false,
          allow_multiple_images_per_post: true,
        },
      },
    };

    getCommunityPostsAndComments.mockResolvedValue(mockPostsAndComments);

    const invalidPost = {
      type: "text",
      polls: [{ option: "option1" }],
      images: [],
    };

    const result = await checkPostSettings(invalidPost, communityName);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(
      "Community doesn't allow this type of posts"
    );
  });

  it("should disallow multiple images per post if not allowed by community settings", async () => {
    const communityName = "testcommunity";
    const mockPostsAndComments = {
      err: null,
      posts_and_comments: {
        posts: {
          post_type_options: "All Posts Allowed",
          allow_polls_posts: true,
          allow_multiple_images_per_post: false,
        },
      },
    };

    getCommunityPostsAndComments.mockResolvedValue(mockPostsAndComments);

    const postWithMultipleImages = {
      type: "image_and_videos",
      polls: [],
      images: [{ path: "image1.jpg" }, { path: "image2.jpg" }],
    };

    const result = await checkPostSettings(
      postWithMultipleImages,
      communityName
    );

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toBe(`Can't allow multiple images per post`);
  });
});

describe("checkContentSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow post with valid content based on community content controls", async () => {
    const communityName = "testcommunity";
    const mockContentControls = {
      err: null,
      content_controls: {
        require_words_in_post_title: {
          flag: true,
          add_required_words: [],
        },
        ban_words_from_post_title: {
          flag: false,
          add_banned_words: [],
        },
        ban_words_from_post_body: {
          flag: true,
          add_banned_words: ["spam", "fake"],
        },
        require_or_ban_links_from_specific_domains: {
          flag: true,
          restriction_type: "Required domains",
          require_or_block_link_posts_with_these_domains: "example.com",
        },
        restrict_how_often_the_same_link_can_be_posted: {
          flag: true,
          number_of_days: 7,
        },
      },
    };

    getCommunityContentControls.mockResolvedValue(mockContentControls);

    const validPost = {
      title: "Important News",
      description: "This is an urgent message.",
      link_url: "https://example.com/article123",
    };

    const mockQuery = jest.fn(() => ({
      exec: jest.fn(() => []),
    }));
    Post.find.mockReturnValue(mockQuery);

    const result = await checkContentSettings(validPost, communityName);

    expect(result.success).toBe(true);
  });

  it("should disallow post with invalid content based on community content controls", async () => {
    const communityName = "testcommunity";
    const mockContentControls = {
      err: null,
      content_controls: {
        require_words_in_post_title: {
          flag: true,
          add_required_words: ["important", "urgent"],
        },
        ban_words_from_post_title: {
          flag: true,
          add_banned_words: ["spam", "fake"],
        },
        ban_words_from_post_body: {
          flag: false,
          add_banned_words: [],
        },
        require_or_ban_links_from_specific_domains: {
          flag: true,
          restriction_type: "Blocked domains",
          require_or_block_link_posts_with_these_domains: "example.com",
        },
        restrict_how_often_the_same_link_can_be_posted: {
          flag: true,
          number_of_days: 7,
        },
      },
    };

    getCommunityContentControls.mockResolvedValue(mockContentControls);

    const invalidPost = {
      title: "Spam Alert",
      description: "This is a spam message.",
      link_url: "https://example.com/spam",
    };

    Post.find.mockResolvedValue([
      { link_url: "https://example.com/spam", created_at: new Date() },
    ]);

    const result = await checkContentSettings(invalidPost, communityName);

    expect(result.success).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message).toContain(
      "Post title must include the following words: important, urgent"
    );
  });
});

describe("checkVotesMiddleware", () => {
  let currentUser;

  beforeEach(() => {
    // Mock a currentUser object with necessary properties
    currentUser = {
      _id: "user123",
      upvotes_posts_ids: ["post1", "post3"],
      downvotes_posts_ids: ["post2"],
      saved_posts_ids: ["post3", "post4"],
    };
  });

  it("should add vote and poll_vote attributes to posts for authenticated user", async () => {
    const posts = [
      {
        _id: "post1",
        type: "text",
      },
      {
        _id: "post2",
        type: "image_and_videos",
      },
      {
        _id: "post3",
        type: "polls",
        polls: [
          { id: "option1", users_ids: ["user123"] },
          { id: "option2", users_ids: [] },
        ],
      },
      {
        _id: "post4",
        type: "text",
      },
    ];

    const processedPosts = await checkVotesMiddleware(currentUser, posts);

    expect(processedPosts).toEqual([
      {
        _id: "post1",
        type: "text",
        vote: 1,
        poll_vote: null,
        saved: false,
      },
      {
        _id: "post2",
        type: "image_and_videos",
        vote: -1,
        poll_vote: null,
        saved: false,
      },
      {
        _id: "post3",
        type: "polls",
        polls: [
          { id: "option1", users_ids: ["user123"] },
          { id: "option2", users_ids: [] },
        ],
        vote: 1,
        poll_vote: "option1",
        saved: true,
      },
      {
        _id: "post4",
        type: "text",
        vote: 0,
        poll_vote: null,
        saved: true,
      },
    ]);
  });

  it("should return null for unauthenticated user", async () => {
    const posts = [
      {
        _id: "post1",
        type: "text",
      },
      {
        _id: "post2",
        type: "image_and_videos",
      },
    ];

    const processedPosts = await checkVotesMiddleware(null, posts);

    expect(processedPosts).toBeNull();
  });
});
