import mongoose from 'mongoose';

// The communityAppearanceSchema includes these subdocuments (ImageSchema and ColorSchema) directly, so no references (ref) are needed. 
// Which means that there's no need to use .populate().exec() to retrieve these subdocuments. They are fetched automatically when a CommunityAppearance document is retrieved.

const ImageSchema = new mongoose.Schema({
    url: String,
    alt: String
});

const ColorSchema = new mongoose.Schema({
    hue: Number,
    saturation: Number,
    hex: String
});

const communityAppearanceSchema = new mongoose.Schema({
    avatar: ImageSchema,
    banner: ImageSchema,
    key_color: ColorSchema,
    base_color: ColorSchema,
    sticky_post_color: ColorSchema,
    dark_mode: Boolean
});


export const CommunityAppearance = mongoose.model(
    "CommunityAppearance",
    communityAppearanceSchema
);