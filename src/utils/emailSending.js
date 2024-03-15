import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
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

async function sendEmail(message) {
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
  let message = {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "Verify your Reddit email address", // Subject line
    text: "Hello world?", // plain text body
    html: `<a href=${link}>Verify email</a>`, // html body
  };
  await sendEmail(message);
  console.log("email sent pt2");
}

export async function redirectToResetPassword(userId, userEmail) {
  // console.log("hi2 email", userEmail, "email2", process.env.EMAIL);
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 3); // Adding 3 hours
  const token = await saveToken(userId, expirationDate);
  const link = `http://localhost:3000/users/internal-forget-password/${token.token}`;
  let message = {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "Ask and you shall receive... a password reset", // Subject line
    text: "Hello world?", // plain text body
    html: `<a href=${link}>Reset Password</a>`, // html body
  };
  await sendEmail(message);
  console.log("email sent pt2");
}
