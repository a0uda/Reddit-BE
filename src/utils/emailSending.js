/**
 * Utility functions related to email operations.
 * This module provides functions for sending various types of emails to users, including verification emails, password reset emails, etc.
 * @module users/utils/emailSending
 */

import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
import {
  verifyEmailFormatEmail,
  forgetPasswordFormatEmail,
  forgetUsernameFormatEmail,
  changeOldEmailFormat,
  changePasswordFormatEmail,
} from "../templates/email.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

/**
 * Saves a token associated with a user in the database.
 * @param {ObjectId} userId - The ID of the user.
 * @param {Date} expirationDate - The expiration date of the token.
 * @returns {Promise<Token>} A Promise that resolves to the saved token.
 */
async function saveToken(userId, expirationDate) {
  const token = new Token({
    user_id: userId,
    token: jwt.sign({ _id: userId.toString() }, process.env.JWT_SECRET),
    expires_at: expirationDate,
  });
  await token.save();
  return token;
}

/**
 * Sends an email using nodemailer.
 * @param {Object} message - The email message object.
 */
export async function sendEmail(message) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  await transporter.sendMail(message);
  console.log("email sent");
  // .then(() => {
  //   console.log("email sent");
  // })
  // .catch((error) => {
  //   console.log("ERROR", error);
  // });
}

/**
 * Send an email to the user to verify their email address.
 * It also sets 3 days expiration date for the generated link
 * @param {ObjectId} userId - The ID of the user.
 * @param {string} userEmail - The email address of the user.
 */
export async function redirectToVerifyEmail(userId, userEmail) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 3); // Adding 3 days
  const token = await saveToken(userId, expirationDate);
  const link = `http://localhost:3000/users/internal-verify-email/${token.token}`;
  let message = verifyEmailFormatEmail(link, userEmail);
  await sendEmail(message);
  console.log("email sent pt2");
}

/**
 * Send an email to the user to reset their password.
 * It also sets 3 hours expiration date for the generated link
 * @param {ObjectId} userId - The ID of the user.
 * @param {string} userEmail - The email address of the user.
 */
export async function redirectToResetPassword(userId, userEmail) {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 3); // Adding 3 hours
  const token = await saveToken(userId, expirationDate);
  const link = `http://localhost:3000/users/internal-forget-password/${token.token}`;
  let message = forgetPasswordFormatEmail(link, userEmail);
  await sendEmail(message);
  console.log("email sent pt2");
}

/**
 * Send an email to the user to recover their forgotten username.
 * @param {ObjectId} userId - The ID of the user.
 * @param {string} userEmail - The email address of the user.
 * @param {string} username - The username of the user.
 */
export async function redirectToForgetUsername(userId, userEmail, username) {
  const link = `http://localhost:3000/userprofilepage/${username}`;
  let message = forgetUsernameFormatEmail(link, userEmail, username);
  await sendEmail(message);
  console.log("email sent pt2");
}

/**
 * Sends an email to notify the user of a change in their email address.
 * @param {string} userEmail - The new email address of the user.
 * @param {string} username - The username of the user.
 */
export async function sendChangeEmail(userEmail, username) {
  let message = changeOldEmailFormat(userEmail, username);
  await sendEmail(message);
  console.log("email sent pt2");
}

/**
 * Sends an email to notify the user of a change in their password.
 * @param {string} userEmail - The email address of the user.
 * @param {string} username - The username of the user.
 */
export async function sendChangePassword(userEmail, username) {
  let message = changePasswordFormatEmail(userEmail, username);
  await sendEmail(message);
  console.log("email sent pt2");
}
