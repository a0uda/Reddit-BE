// Mod Tools --> Settings --> Community Appearance --> (Avatar, Banner, Key Color, Base Color, Sticky Post Color, Dark Mode) options.

import { Community } from "../db/models/Community.js";

// I am not sure weather the frontend will prefer dealing with the appearance as one unit or will they prefer to deal with each option separately. 
// I will implement both and let them decide.

const getAppearanceOptions = async (community_name) => {
    if (typeof community_name !== 'string') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name })
            .populate("appearance")
            .exec();

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        if (typeof community.appearance !== 'object') {
            return { err: { status: 500, message: 'Invalid appearance ID' } };
        }

        return { appearance: community.appearance };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const getAppearanceOption = async (community_name, option_name) => {
    if (typeof community_name !== 'string' || typeof option_name !== 'string') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name })
            .populate("appearance")
            .exec();

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        if (typeof community.appearance !== 'object') {
            return { err: { status: 500, message: 'Invalid appearance ID' } };
        }

        const appearance = community.appearance;
        const appearanceOption = appearance[option_name];

        if (!appearanceOption) {
            return { err: { status: 404, message: 'Option not found' } };
        }

        return { appearance_option: appearanceOption };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const updateAppearanceOptions = async (community_name, new_appearance) => {
    if (typeof community_name !== 'string' || typeof new_appearance !== 'object') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name })
            .populate("appearance")
            .exec();

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        if (typeof community.appearance !== 'object') {
            return { err: { status: 500, message: 'Invalid appearance ID' } };
        }

        // The set function is a method provided by Mongoose. This function is used to update the properties of a Mongoose document.
        const appearance = community.appearance;
        appearance.set(new_appearance);
        await appearance.save();

        return { updates_appearance: appearance };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

const updateAppearanceOption = async (community_name, option_name, new_value) => {
    if (typeof community_name !== 'string' || typeof option_name !== 'string') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    if (option_name === 'dark_mode' && typeof new_value !== 'boolean') {
        return { err: { status: 400, message: 'Invalid value for dark_mode. Expected a boolean.' } };
    }

    if (option_name !== 'dark_mode' && typeof new_value !== 'object') {
        return { err: { status: 400, message: `Invalid value for ${option_name}. Expected an object with the same structure as (ie. containing all the attributes of) the existing appearance option. ` } };
    }

    try {
        const community = await Community.findOne({ name: community_name })
            .populate("appearance")
            .exec();

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        if (typeof community.appearance !== 'object') {
            return { err: { status: 500, message: 'Invalid appearance ID' } };
        }

        const appearance = community.appearance;
        appearance[option_name] = new_value;
        await appearance.save();

        return { updates_appearance_option: appearance[option_name] };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};


export {
    getAppearanceOptions,
    getAppearanceOption,
    updateAppearanceOptions,
    updateAppearanceOption
};


