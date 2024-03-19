import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({

    rule_title:
    {
        type: String,
        required: true,
        unique: true,
    },
    rule_order: {  // => determined by db
        type: Number,
        min: 1,
    },
    applies_to: { // => chosen by default
        type: String,
        enum: ["posts_and_comments", "posts_only", "comments_only"],
    },
    report_reason: String, // => if not provided, use rule_title
    full_description: String, // => optional

});
export const Rule = mongoose.model("Rule", ruleSchema);