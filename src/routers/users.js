import express from "express";
import {User} from "../db/models/User.js"; //if error put .js
import { addNewUser, isUsernameAvailable } from "../utils/users.js";

export const usersRouter = express.Router();


usersRouter.post("/users/signup",async (req,res) => {
    try {
    const { success, err, user } = await addNewUser(req.body);

    if (!success){
        res.status(400).send(err);
        return;
    }

    res.status(201).send( {username:user.username, access_token:user.token});

    } catch (error) {

    res.status(500).json({ error: "Internal server error." });
}
    return;
})





















