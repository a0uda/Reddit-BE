const mongoose = require('mongoose');

const schedulePostFormSchema = new mongoose.Schema({
    submitTime: {
        date: { type: Date, default: Date.now },
        time: { 
            hour: { type: Number, min: 1, max: 12 },
            minute: { type: Number, min: 0, max: 59 },
            meridiem: { type: String, enum: ['AM', 'PM'] }
        },
        // TODO How to handle different time zones?
        // timeZone: { type: String, match: /^GMT (\+|-)[01][0-9]:00/ }
    },
    repeatOptions: {
        type: {
            type: String,
            // Weekly on the same day as the submit day.
            // Monthly on the same day as the submit day.
            enum: ['Does not repeat', 'Hourly', 'Daily', 'Weekly On Wednesday', 'Monthly On Day 1st', 'Costume'],
            default: 'Does not repeat'
        },
        costume: {
            value: { type: Number },
            duration: { type: String, enum: ['Hours', 'Days', 'Weeks', 'Months'] }
        }
    },
    advancedOptions: {
        defaultCommentOrder: { type: String, enum: ['Best', 'New', 'Top', 'Controversial', 'Old', 'Q&A'] },
        stickyPost: { type: String, enum: ['Not a sticky post', 'Submit as first sticky post', 'Submit as Second sticky post'] },
        contestMode: { type: Boolean, default: false },
        postAsAutoModerator: { type: Boolean, default: false }
    }
});

const SchedulePostForm = mongoose.model('SchedulePostForm', schedulePostFormSchema);

module.exports = SchedulePostForm;

// When should the validations take place? When scheduling the post or when actually posting it?