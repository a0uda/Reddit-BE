const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["public", "private", "restricted", "employee only"]
    },
    category: String,
    nswf_flag: Boolean,
    profile_picture: String,
    banner_picture: String,
    created_at: {
        type: Date,
        required: true,
        default: Date.now()
    },
    members_nickname: String,
    currently_viewing_nickname: String,
    description: String,
    welcome_message: {
        send_welcome_message_flag: Boolean,
        message: String
    },
    language: String,
    region: String,
    accepting_requests_to_join: Boolean,
    content_controls: {
        providing_members_with_posting_guidlines: {
            flag: Boolean,
            guidline_text: String
        },
        require_words_in_post_title: {
            flag: Boolean,
            add_required_words: String
        },
        ban_words_in_post_body: {
            flag: Boolean,
            add_banned_words: String
        },
        require_or_ban_links_from_specific_domains: {
            flag: Boolean,
            restriction_type: {
                type: String,
                enum: ["required_domains", "blocked_domains"]
            },
            block_link_posts_with_these_domains: String
        },
        restrict_how_often_the_same_link_can_be_posted: {
            flag: Boolean,
            number_of_days: {
                type: Number,
                min: 0
            }
        }
    },
    posts_and_comments: {
        post_type_options: {
            type: String,
            enum: ["any", "links only", "text posts only"]
        },
        allow_crossposting_of_posts: Boolean,
        archive_posts: Boolean,
        enable_spoiler_tag: Boolean,
        allow_image_uploads_and_links_to_image_hosting_sites: Boolean,
        allow_multiple_images_per_post: Boolean,
        allow_polls: Boolean,
        spam_filter_strength: {
            posts: {
                type: String,
                enum: ["low", "high (default)", "all"]
            },
            links: {
                type: String,
                enum: ["low", "high (default)", "all"]
            },
            comments: {
                type: String,
                enum: ["low (default)", "high", "all"]
            }
        },
        comments: {
            suggested_sort: {
                type: String,
                enum: ["None (Recommended)", "Best", "Old", "Top", "Q&A", "Live (Beta)", "Controversial", "New"]
            },
            collapse_deleted_and_removed_comments: Boolean,
            minutes_to_hide_comment_scores: {
                type: Number,
                min: 0
            },
            media_in_comments: {
                gifs_from_giphy: Boolean,
                collectible_expressions: Boolean,
                images: Boolean,
                gifs: Boolean
            }
        }
    },
    traffic: String,
    topics: String,
    owner: String,
    views_count: {
        type: Number,
        min: 0
    },
    members_count: {
        type: Number,
        min: 0
    },
    moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    invited_moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    muted_users: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: Date,
        reason: String
    }],
    banned_users: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: Date,
        reason: {
            type: String,
            enum: ["none", "rule", "spam", "personal", "threat", "others"]
        },
        additional_info: String,
        lifted: Boolean,
        lift_date: Date,
        lifted_by: String
    }],
    posts_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    removed_posts_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    removed_comments_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    edited_posts_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    edited_comments_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    unmoderated_posts_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    unmoderated_comments_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    reported_posts_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    reported_comments_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    scheduled_posts: [{
        post_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        },
        date: Date,
        recurring: Boolean,
        title: String,
        text: String,
        recurrence_type: {
            type: String,
            enum: ["does_not_repeat", "hourly", "daily", "weekly_on_day", "monthly_on_date"]
        },
        recurrence_details: {
            number: Number,
            duration: {
                type: String,
                enum: ["hours", "days", "weeks", "months"]
            }
        },
        comment_order: {
            default_comment_order: {
                type: String,
                enum: ["Default comment order", "Best", "Top", "New", "Controversial", "Old", "Q&A"]
            },
            not_a_sticky_post: {
                type: String,
                enum: ["not_a_sticky_post", "submit_as_first_sticky_post", "submit_as_second_sticky_post"]
            }
        },
        nsfw: Boolean,
        spoiler: Boolean
    }],
    allow_image_posts: Boolean,
    allow_url_posts: Boolean,
    allow_polls_posts: Boolean,
    rules: [{
        rule_title: String,
        rule_order: {
            type: Number,
            min: 1
        },
        applies_to: {
            type: String,
            enum: ["posts_and_comments", "posts_only", "comments_only"]
        },
        report_reason: String,
        full_description: String
    }]
});

const Community = mongoose.model('Community', communitySchema);

module.exports=Community;
