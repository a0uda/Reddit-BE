import { verifyAuthToken } from "./userAuth.js";

import { addNewCommunity } from "../services/communityService.js";
import { schedulePost } from "../services/communityScheduledPostsService.js";

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


export const schedulePostController = async (req, res, next) => {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const { subTime, repeatWeekly, repeatMonthly, repeatDaily, repeatHourly, postInput } = req.body;

        const { date, hours, minutes } = subTime;
        const [year, month, day] = date.split('-').map(Number);
        const scheduleDate = new Date(Date.UTC(year, month - 1, day, Number(hours), Number(minutes)));

        console.log('Scheduled date:', scheduleDate);

        if (repeatHourly) {
            // Hourly schedule
            const scheduleRule = new schedule.RecurrenceRule();
            scheduleRule.minute = scheduleDate.getMinutes();

            schedule.scheduleJob(scheduleRule, async () => {
                try {
                    const result = await schedulePost(postInput, authenticated_user);
                    console.log(result);
                } catch (error) {
                    console.error('Error in scheduled job:', error);
                }
            });
        } else if (repeatDaily) {
            // Daily schedule
            const scheduleRule = new schedule.RecurrenceRule();
            scheduleRule.hour = scheduleDate.getHours();
            scheduleRule.minute = scheduleDate.getMinutes();

            schedule.scheduleJob(scheduleRule, async () => {
                await schedulePost(postInput, authenticated_user);
            });
        } else if (repeatWeekly) {
            // Weekly schedule using dayOfWeek
            const scheduleRule = new schedule.RecurrenceRule();
            scheduleRule.dayOfWeek = scheduleDate.getDay();
            scheduleRule.hour = scheduleDate.getHours();
            scheduleRule.minute = scheduleDate.getMinutes();

            schedule.scheduleJob(scheduleRule, async () => {
                await schedulePost(postInput, authenticated_user);
            });
        } else if (repeatMonthly) {
            // Monthly schedule using monthlyOn
            const job = schedule.recur().monthlyOn(scheduleDate.getDate()); // Use monthlyOn for reliable monthly scheduling
            job.hour(scheduleDate.getHours()); // Set hour for the job
            job.minute(scheduleDate.getMinutes()); // Set minute for the job

            job.schedule(async () => {
                await schedulePost(postInput, authenticated_user);
            });
        } else {
            // One-time schedule
            schedule.scheduleJob(scheduleDate, async () => {
                await schedulePost(postInput, authenticated_user);
            });
        }

        return res.status(201).send({ message: 'Post scheduled successfully!' });

    } catch (error) {
        next(error)
    }
}

