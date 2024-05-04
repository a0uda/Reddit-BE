import { addCommunityBannerPicture, addCommunityProfilePicture, deleteCommunityBannerPicture, deleteCommunityProfilePicture } from "../../src/services/communityProfileAndBannerPictures";
import { communityNameExists } from "../../src/utils/communities";
jest.mock("../../src/utils/communities");
jest.mock("../../src/utils/communities");

describe("Community Profile Picture", () => {
    it("should add a community profile picture", async () => {
        const requestBody = {
            community_name: "community1",
            profile_picture: "profile_picture1",
        };
        const mockCommunity = {
            profile_picture: "none",
            save: jest.fn(),
            name: "community1",
        };
        communityNameExists.mockReturnValue(mockCommunity);
        const result = await addCommunityProfilePicture(requestBody);
        expect(result.success).toBe(true);
    });
    it("should return 500 if community name does not exist", async () => {
        const requestBody = {
            community_name: "nonexistent_community",
            profile_picture: "profile_picture1",
        };

        communityNameExists.mockReturnValue(null);
        const result = await addCommunityProfilePicture(requestBody);
        expect(result).toEqual({
            err: {
                status: 500,
                message: expect.stringMatching(/^community name does not exist \s*$/),
            },
        });

    });
    //delete community profile picture
    it("should delete a community profile picture", async () => {
        const requestBody = {
            community_name: "community1",
        };
        const mockCommunity = {
            profile_picture: "profile_picture1",
            save: jest.fn(),
            name: "community1",
        };
        communityNameExists.mockReturnValue(mockCommunity);
        const result = await deleteCommunityProfilePicture(requestBody);
        expect(result.success).toBe(true);
    });
    it("should return 500 if community name does not exist", async () => {
        const requestBody = {
            community_name: "nonexistent_community",
        };

        communityNameExists.mockReturnValue(null);
        const result = await deleteCommunityProfilePicture(requestBody);
        expect(result).toEqual({
            err: {
                status: 500,
                message: expect.stringMatching(/^community name does not exist \s*$/),
            },
        });

    });
});
describe("Community Banner Picture", () => {

    it("should add a community banner picture", async () => {
        const requestBody = {
            community_name: "community1",
            banner_picture: "banner_picture1",
        };
        const mockCommunity = {
            banner_picture: "none",
            save: jest.fn(),
            name: "community1",
        };
        communityNameExists.mockReturnValue(mockCommunity);

        const result = await addCommunityBannerPicture(requestBody);

        expect(result.success).toBe(true);
    });
    it("should return 500 if community name does not exist", async () => {
        const requestBody = {
            community_name: "nonexistent_community",
            banner_picture: "banner_picture1",
        };

        communityNameExists.mockReturnValue(null);
        const result = await addCommunityBannerPicture(requestBody);
        expect(result).toEqual({
            err: {
                status: 500,
                message: expect.stringMatching(/^community name does not exist \s*$/),
            },
        });

    });
    //delete community banner picture
    it("should delete a community banner picture", async () => {
        const requestBody = {
            community_name: "community1",
        };
        const mockCommunity = {
            banner_picture: "banner_picture1",
            save: jest.fn(),
            name: "community1",
        };
        communityNameExists.mockReturnValue(mockCommunity);
        const result = await deleteCommunityBannerPicture(requestBody);
        expect(result.success).toBe(true);
    });
    it("should return 500 if community name does not exist", async () => {
        const requestBody = {
            community_name: "nonexistent_community",
        };

        communityNameExists.mockReturnValue(null);
        const result = await deleteCommunityBannerPicture(requestBody);
        expect(result).toEqual({
            err: {
                status: 500,
                message: expect.stringMatching(/^community name does not exist \s*$/),
            },
        });

    });
});