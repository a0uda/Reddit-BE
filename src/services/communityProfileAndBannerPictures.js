// The little pencil icon on the community profile and banner pictures in the community's default/home/first-to-open page.

import {
    communityNameExists
} from "../utils/communities.js";

//////////////////////////////////////////////////////////////////////// Profile Picture //////////////////////////////////////////////////////////////
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

const deleteCommunityProfilePicture = async (requestBody) => {
    const { community_name } = requestBody;
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }
        community.profile_picture = "none";
        const savedCommunity = await community.save();

        console.log(savedCommunity);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////////////////////////////////////////////// Banner Picture //////////////////////////////////////////////////////////////
const addCommunityBannerPicture = async (requestBody) => {
    const { community_name, banner_picture } = requestBody;
    try {
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

const deleteCommunityBannerPicture = async (requestBody) => {
    const { community_name } = requestBody;
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }

        community.banner_picture = "none";
        const savedCommunity = await community.save();

        console.log(savedCommunity);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

export {
    addCommunityProfilePicture,
    deleteCommunityProfilePicture,

    addCommunityBannerPicture,
    deleteCommunityBannerPicture,
}