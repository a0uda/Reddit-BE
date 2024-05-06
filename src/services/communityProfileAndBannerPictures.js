// The little pencil icon on the community profile and banner pictures in the community's default/home/first-to-open page.

import {
    communityNameExists
} from "../utils/communities.js";

//////////////////////////////////////////////////////////////////////// Profile Picture //////////////////////////////////////////////////////////////
/**
 * 
 * @param {object} requestBody 
 * @property {string} requestBody.community_name - The name of the community to add the rule to.
 * @property {string} requestBody.profile_picture - The profile picture of the community.
 * 
 * @returns
 * @property {boolean} success - The success status of the operation.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * {
 * community_name: 'example_community',
 * profile_picture: 'example_profile_picture',
 * }
 * 
 * @example
 * Output:
 * {
 * success: true
 * }
 */
const addCommunityProfilePicture = async (requestBody) => {
    const { community_name, profile_picture } = requestBody;
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }
        community.profile_picture = profile_picture;
        const savedCommunity = await community.save();

        console.log(savedCommunity);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

/**
 * @param {object} requestBody
 * @property {string} requestBody.community_name - The name of the community to delete the profile picture from.
 * @property {string} requestBody.profile_picture - The profile picture of the community.
 * 
 * @returns
 * @property {boolean} success - The success status of the operation.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * {
 * community_name: 'example_community',
 * }
 * 
 * @example
 * Output:
 * {
 * success: true
 * }
 */
const deleteCommunityProfilePicture = async (requestBody) => {
    const { community_name } = requestBody;
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }
        community.profile_picture = "";
        const savedCommunity = await community.save();

        console.log(savedCommunity);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////////////////////////////////////////////// Banner Picture //////////////////////////////////////////////////////////////
/**
 * @param {object} requestBody
 * @property {string} requestBody.community_name - The name of the community to add the rule to.
 * @property {string} requestBody.banner_picture - The banner picture of the community.
 * 
 * @returns
 * @property {boolean} success - The success status of the operation.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * {
 * community_name: 'example_community',
 * banner_picture: 'example_banner_picture',
 * }
 * 
 * @example
 * Output:
 * {
 * success: true
 * }
 */
const addCommunityBannerPicture = async (requestBody) => {
    const { community_name, banner_picture } = requestBody;
    try {
        if (!banner_picture) return { err: { status: 500, message: "banner picture is required" } };
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }
        community.banner_picture = banner_picture;
        await community.save();
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
/**
 * @param {object} requestBody
 * @property {string} requestBody.community_name - The name of the community to delete the banner picture from.
 * @property {string} requestBody.banner_picture - The banner picture of the community.
 * 
 * @returns
 * @property {boolean} success - The success status of the operation.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * {
 * community_name: 'example_community',
 * }
 * 
 * @example
 * Output:
 * {
 * success: true
 * }
 */
const deleteCommunityBannerPicture = async (requestBody) => {
    const { community_name } = requestBody;
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }

        community.banner_picture = "";
        const savedCommunity = await community.save();

        console.log(savedCommunity);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};
//GET /communities/:community_name/profile_picture 
const getCommunityProfilePicture = async (community_name) => {

    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 400, message: "community name does not exist " },
            };
        }
        return { picture: community.profile_picture };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}
//GET /communities/:community_name/banner_picture 
const getCommunityBannerPicture = async (community_name) => {

    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 400, message: "community name does not exist " },
            };
        }
        return { picture: community.banner_picture };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}
export {
    addCommunityProfilePicture,
    deleteCommunityProfilePicture,
    getCommunityProfilePicture,
    getCommunityBannerPicture,

    addCommunityBannerPicture,
    deleteCommunityBannerPicture,
}