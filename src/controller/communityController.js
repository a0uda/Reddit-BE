import { verifyAuthToken } from "./userAuth.js";

import { addNewCommunity } from "../services/communityService.js";

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