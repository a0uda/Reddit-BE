import {
  getCommunitiesHelper,
  getModeratedCommunitiesHelper,
  getMutedCommunitiesHelper,
  getBlockedUserHelper,
  getActiveCommunitiesHelper,
} from "../../src/services/users";
import { Community } from "../../src/db/models/Community";
import { User } from "../../src/db/models/User";
import { getCommunityGeneralSettings } from "../../src/services/communitySettingsService";
jest.mock("../../src/db/models/Community");
jest.mock("../../src/db/models/User");
jest.mock("../../src/services/communitySettingsService");

describe("Community Helper Functions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCommunitiesHelper", () => {
    it("should retrieve communities for a user", async () => {
      const user = {
        communities: [
          { id: "community1" },
          { id: "community2" },
          { id: "community3" },
        ],
      };

      const mockCommunities = [
        {
          _id: "community1",
          name: "Community One",
          profile_picture: "img1.jpg",
          members_count: 100,
        },
        {
          _id: "community3",
          name: "Community Three",
          profile_picture: "img3.jpg",
          members_count: 50,
        },
      ];

      Community.findById.mockImplementation(async (id) => {
        return mockCommunities.find((c) => c._id === id);
      });

      const result = await getCommunitiesHelper(user);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("community1");
      expect(result[0].name).toBe("Community One");
      expect(result[0].profile_picture).toBe("img1.jpg");
      expect(result[0].favorite_flag).toBeUndefined(); // Assuming no favorite_flag in the return object
      // Add more assertions as needed
    });
  });

  describe("getModeratedCommunitiesHelper", () => {
    it("should retrieve moderated communities for a user", async () => {
      const user = {
        moderated_communities: [
          { id: "modCommunity1" },
          { id: "modCommunity2" },
        ],
      };

      const loggedInUser = {
        communities: [{ id: "modCommunity1" }, { id: "otherCommunity" }],
      };

      const mockCommunities = [
        {
          _id: "modCommunity1",
          name: "Moderated Community One",
          profile_picture: "modImg1.jpg",
          members_count: 75,
        },
        {
          _id: "modCommunity2",
          name: "Moderated Community Two",
          profile_picture: "modImg2.jpg",
          members_count: 120,
        },
      ];

      Community.findById.mockImplementation(async (id) => {
        return mockCommunities.find((c) => c._id === id);
      });

      const result = await getModeratedCommunitiesHelper(user, loggedInUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("modCommunity1");
      expect(result[0].name).toBe("Moderated Community One");
      expect(result[0].profile_picture).toBe("modImg1.jpg");
      expect(result[0].favorite_flag).toBeUndefined(); // Assuming no favorite_flag in the return object
      expect(result[0].joined).toBe(true); // User is a member of modCommunity1
      expect(result[1].joined).toBe(false); // User is not a member of modCommunity2
      // Add more assertions as needed
    });
  });
});

describe("getBlockedUserHelper", () => {
  it("should retrieve blocked users for a user", async () => {
    const user = {
      safety_and_privacy_settings: {
        blocked_users: [
          { id: "blockedUserId1", blocked_date: new Date() },
          { id: "blockedUserId2", blocked_date: new Date() },
        ],
      },
    };

    const mockBlockedUsers = [
      {
        _id: "blockedUserId1",
        username: "BlockedUser1",
        profile_picture: "img1.jpg",
      },
      {
        _id: "blockedUserId2",
        username: "BlockedUser2",
        profile_picture: "img2.jpg",
      },
    ];

    User.findById.mockImplementation(async (id) => {
      return mockBlockedUsers.find((user) => user._id === id);
    });

    const result = await getBlockedUserHelper(user);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("blockedUserId1");
    expect(result[0].username).toBe("BlockedUser1");
    expect(result[0].profile_picture).toBe("img1.jpg");
    expect(result[0].blocked_date).toBeDefined();
    // Add more assertions as needed
  });
});

describe("getMutedCommunitiesHelper", () => {
  it("should retrieve muted communities for a user", async () => {
    const user = {
      safety_and_privacy_settings: {
        muted_communities: [
          { id: "mutedCommunityId1", muted_date: new Date() },
          { id: "mutedCommunityId2", muted_date: new Date() },
        ],
      },
    };

    const mockMutedCommunities = [
      {
        _id: "mutedCommunityId1",
        name: "MutedCommunity1",
        profile_picture: "img1.jpg",
      },
      {
        _id: "mutedCommunityId2",
        name: "MutedCommunity2",
        profile_picture: "img2.jpg",
      },
    ];

    Community.findById.mockImplementation(async (id) => {
      return mockMutedCommunities.find((community) => community._id === id);
    });

    const result = await getMutedCommunitiesHelper(user);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("mutedCommunityId1");
    expect(result[0].name).toBe("MutedCommunity1");
    expect(result[0].profile_picture).toBe("img1.jpg");
    expect(result[0].muted_date).toBeDefined();
    // Add more assertions as needed
  });
});

describe("getActiveCommunitiesHelper", () => {
  it("should retrieve active communities with general settings", async () => {
    const mockCommunities = [
      {
        id: "communityId1",
        name: "Community1",
        profile_picture: "img1.jpg",
        members_count: 100,
      },
      {
        id: "communityId2",
        name: "Community2",
        profile_picture: "img2.jpg",
        members_count: 50,
      },
    ];

    getCommunityGeneralSettings.mockImplementation(async (name) => {
      const general_settings = {
        title: `${name} Title`,
        description: `${name} Description`,
      };
      return { err: null, general_settings };
    });

    const result = await getActiveCommunitiesHelper(mockCommunities);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("communityId1");
    expect(result[0].name).toBe("Community1");
    expect(result[0].description).toBe("Community1 Description");
    expect(result[0].title).toBe("Community1 Title");
    expect(result[0].profile_picture).toBe("img1.jpg");
    expect(result[0].banner_picture).toBeUndefined(); // Assuming no banner_picture in the return object
    expect(result[0].members_count).toBe(100);
    // Add more assertions as needed
  });
});
