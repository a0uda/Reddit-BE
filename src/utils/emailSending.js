import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
import {
  verifyEmailEmail,
  forgetPasswordEmail,
  forgetUsernameEmail,
  changeOldEmail,
  changePasswordEmail,
} from "../templates/email.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

async function saveToken(userId, expirationDate) {
  const token = new Token({
    user_id: userId,
    token: jwt.sign({ _id: userId.toString() }, process.env.JWT_SECRET),
    expires_at: expirationDate,
  });
  await token.save();
  return token;
}

export async function sendEmail(message) {
  // console.log("link: ", link);
  // console.log("user email: ", userEmail);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  transporter
    .sendMail(message)
    .then(() => {
      console.log("email sent");
    })
    .catch((error) => {
      console.log("ERROR", error);
    });
}

export async function redirectToVerifyEmail(userId, userEmail) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 3); // Adding 3 days
  const token = await saveToken(userId, expirationDate);
  const link = `http://localhost:3000/users/internal-verify-email/${token.token}`;
  // console.log("Link",link)
  let message = verifyEmailEmail(link, userEmail);
  await sendEmail(message);
  console.log("email sent pt2");
}

export async function redirectToResetPassword(userId, userEmail) {
  // console.log("hi2 email", userEmail, "email2", process.env.EMAIL);
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 3); // Adding 3 hours
  const token = await saveToken(userId, expirationDate);
  const link = `http://localhost:3000/users/internal-forget-password/${token.token}`;
  let message = forgetPasswordEmail(link, userEmail);
  await sendEmail(message);
  console.log("email sent pt2");
}

export async function redirectToForgetUsername(userId, userEmail, username) {
  // Do i really need a token here?
  // const expirationDate = new Date();
  // expirationDate.setDate(expirationDate.getDate() + 3); // Adding 3 days
  // const token = await saveToken(userId, expirationDate);
  const link = `http://localhost:3000/userprofilepage/${username}`; //frontend
  let message = forgetUsernameEmail(link, userEmail, username);
  await sendEmail(message);
  console.log("email sent pt2");
}

export async function sendChangeEmail(userEmail, username) {
  let message = changeOldEmail(userEmail, username);
  await sendEmail(message);
  console.log("email sent pt2");
}

export async function sendChangePassword(userEmail, username) {
  let message = changePasswordEmail(userEmail, username);
  await sendEmail(message);
  console.log("email sent pt2");
}
