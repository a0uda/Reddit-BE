import { verifyAuthToken } from "./userAuth.js";

import { addNewCommunity, getCommunityNames, getCommunityNamesByPopularity } from "../services/communityService.js";
import { savePostForScheduling, postScheduledPost, getScheduledPosts, editScheduledPost, submitScheduledPost } from "../services/communityScheduledPostsService.js";

import { scheduledPostSchema } from "../db/models/scheduledPosts.js";
import { scheduledPost } from "../db/models/scheduledPosts.js";

import schedule from "node-schedule";

export const addNewCommunityController = async (req, res, next) => {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const { err, community } = await addNewCommunity(req.body, authenticated_user)

        if (err) { return next(err) }

        return res.status(201).send(community)

    } catch (error) {
        next(error)
    }
}

export const getCommunityNamesController = async (req, res, next) => {
    try {
        const { err, communities } = await getCommunityNames();

        if (err) { return next(err) }

        return res.status(200).send(communities);

    } catch (error) {
        next(error)
    }
}

export const getCommunityNamesByPopularityController = async (req, res, next) => {
    try {

        const { err, communities } = await getCommunityNamesByPopularity();

        if (err) { return next(err) }

        return res.status(200).send(communities);

    } catch (error) {
        next(error)
    }
}

//////////////////////////////////////////////////////////////////////// Schedule Posts //////////////////////////////////////////////////////////////
export const schedulePostController = async (req, res, next) => {
    // All posts should be saved in the schedulePost collection as soon as they are scheduled.
    // This is done using the savePostForScheduling function from the communityScheduledPostsService.
    // This function returns the id of the post that was saved.

    // A function that stores this post in the actual post collection is then scheduled to run at the scheduled time(s).
    // This is done using the postScheduledPost function from the communityScheduledPostsService.
    // This function would need the post id from the schedulePost collection to post the actual post.

    try {
        // Get the necessary attributes from the request body.
        let { submit_time, repetition_option, postInput } = req.body;

        // Set the schedule date properly using the submit_time attribute.
        const { date, hours, minutes } = submit_time;
        const [year, month, day] = date.split('-').map(Number);
        const schedule_date = new Date(year, month - 1, day, Number(hours), Number(minutes));

        // Check if the schedule_date is in the past
        if (schedule_date < new Date()) {
            return res.status(400).send({ err: { status: 400, message: 'The input date is in the past.' } });
        }

        // Get the valid repetition options from the schema and convert them to lower case
        const validRepetitionOptions = scheduledPostSchema.obj.scheduling_details.repetition_option.enum;
        repetition_option = repetition_option.toLowerCase();

        // Validate the repetition_option
        if (!validRepetitionOptions.includes(repetition_option)) {
            return res.status(400).send({ err: { status: 400, message: 'Invalid repetition option.' } });
        }

        const scheduling_details = {
            repetition_option,
            schedule_date,
        };

        /// Save the post for scheduling.
        let saved_post_id;
        try {
            const authenticated_user = req.user;

            const result = await savePostForScheduling(scheduling_details, postInput, authenticated_user);

            if (result.err) {
                return next(result.err);
            }
            saved_post_id = result.saved_post_id;
        } catch (error) {
            const err = { status: 500, message: error.message };
            return next(err);
        }

        // Helper function to schedule the post.
        const scheduleJob = async () => {
            try {
                const result = await postScheduledPost(saved_post_id);
            } catch (error) {
                console.log({ status: 500, message: error.message });
            }
        };

        // Create a new RecurrenceRule
        const scheduleRule = new schedule.RecurrenceRule();
        scheduleRule.minute = schedule_date.getMinutes();

        let job;

        if (repetition_option.toLowerCase() !== "none") {
            if (repetition_option.toLowerCase() !== "hourly") {
                scheduleRule.hour = schedule_date.getHours();
            }

            if (repetition_option.toLowerCase() === "weekly") {
                scheduleRule.dayOfWeek = schedule_date.getDay();
            }

            if (repetition_option.toLowerCase() === "monthly") {
                scheduleRule.date = schedule_date.getDate();
            }

            job = schedule.scheduleJob(scheduleRule, scheduleJob);
        } else {
            // One-time schedule
            job = schedule.scheduleJob(schedule_date, scheduleJob);
        }

        try {
            // Update the document with the job's name
            await scheduledPost.findByIdAndUpdate(saved_post_id, { jobName: job.name });
        } catch (error) {
            const err = { status: 500, message: error.message };
            return next(err);
        }

        return res.status(201).send({ message: `Post scheduled successfully on ${new Date()} to be posted on ${scheduling_details.schedule_date} and reccurency is ${scheduling_details.repetition_option}!` });

    } catch (error) {
        const err = { status: 500, message: error.message };
        return next(err);
    }
}

export const getScheduledPostsController = async (req, res, next) => {
    try {
        const { recurring_posts, non_recurring_posts } = await getScheduledPosts();

        return res.status(200).send({ recurring_posts, non_recurring_posts });

    } catch (error) {
        const err = { status: 500, message: error.message };
        return next(err);
    }
}

export const editScheduledPostController = async (req, res, next) => {
    try {
        const { post_id, new_description } = req.body;

        const { err, edited_post } = await editScheduledPost(post_id, new_description);

        if (err) { return next(err) }

        return res.status(200).send(edited_post);

    } catch (error) {
        const err = { status: 500, message: error.message };
        return next(err);
    }
}

export const submitScheduledPostController = async (req, res, next) => {
    try {
        const { post_id } = req.body;

        const { err, message } = await submitScheduledPost(post_id);

        if (err) { return next(err) }

        return res.status(200).send({ message: message });

    } catch (error) {
        const err = { status: 500, message: error.message };
        return next(err);
    }
}