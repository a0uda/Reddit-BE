/**
 * @module userAuth/controller
 */
import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
import {
  redirectToResetPassword,
  redirectToVerifyEmail,
  redirectToForgetUsername,
  sendChangeEmail,
  sendChangePassword,
} from "../utils/emailSending.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { generateResponse } from "../utils/generalUtils.js";
import axios from "axios";

/**
 * Check if a username is available or already exists in the database.
 * @param {string} username - The username to check for availability.
 * @returns {Object} An object indicating whether the username is available or already exists.
 * @throws {Error} Will throw an error if there's an issue with the database query.
 * @example
 * // Example of an available username.
 * {
 *   success: true,
 *   error: null,
 *   message: "Username is available"
 * }
 * // Example of an unavailable username.
 * {
 *   success: false,
 *   error: { status: 400, message: "Username already exists, choose another" }
 * }
 */
export async function isUsernameAvailable(username) {
  const user = await User.findOne({ username });
  if (user)
    return generateResponse(
      false,
      400,
      "Username already exists, choose another"
    );
  else return generateResponse(true, null, "Username is available");
}

/**
 * Check if an email address is available or already exists in the database.
 * @param {string} email - The email address to check for availability.
 * @returns {Object} An object indicating whether the email address is available or already exists.
 * @throws {Error} Will throw an error if there's an issue with the database query.
 * @example
 * // Example of an available email address.
 * {
 *   success: true,
 *   error: null,
 *   message: "Email is available"
 * }
 * // Example of an unavailable email address.
 * {
 *   success: false,
 *   error: { status: 400, message: "Email already exists, choose another" }
 * }
 * // Example of an invalid email address.
 * {
 *   success: false,
 *   error: { status: 400, message: "Invalid email" }
 * }
 */
export async function isEmailAvailable(email) {
  if (!validator.isEmail(email)) {
    return generateResponse(false, 400, "Invalid email");
  }
  const user = await User.findOne({ email });
  if (user)
    return generateResponse(false, 400, "Email already exists, choose another");
  else return generateResponse(true, null, "Email is available");
}

/**
 * Verify the authorization token from the request headers and retrieve the associated user.
 * @param {Object} request - The HTTP request object containing headers with an authorization token.
 * @returns {Object} An object indicating the success status and associated user or error details.
 * @throws {Error} Will throw an error if there's an issue with token verification or database query.
 * @example
 * // Example of a successful token verification.
 * {
 *   success: true,
 *   user: { _id: "user_id", username: "username", ... }
 * }
 * // Example of failed token verification due to an invalid token.
 * {
 *   success: false,
 *   err: "Invalid token",
 *   status: 400
 * }
 * // Example of failed token verification because the user is not found or token is not associated with the user.
 * {
 *   success: false,
 *   err: "User not found" | "Invalid token. User may have logged out",
 *   status: 404 | 400
 * }
 */
export async function verifyAuthToken(request) {
  const token = request?.headers?.authorization?.split(" ")[1];
  if (!token) {
    return { success: false, status: 401, err: "Access Denied" };
  }
  var userToken;
  try {
    userToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return { success: false, err, status: 400 };
  }
  if (!userToken) {
    return {
      success: false,
      err: "Invalid token",
      status: 400,
    };
  }
  const userId = userToken._id;
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, err: "User not found", status: 404 };
  }

  const inInTokenArray = user.token.includes(token);

  if (!inInTokenArray) {
    return {
      success: false,
      err: "Invalid token. User may have logged out",
      status: 400,
    };
  }

  return { success: true, user: user };
}

/**
 * Sign up a new user with the provided user information.
 * @param {Object} requestBody - The request body containing user signup details (username, email, password, gender).
 * @returns {Object} An object indicating the success status, user details, or error message.
 * @throws {Error} Will throw an error if there's an issue with user signup process.
 * @example
 * // Example of successful user signup:
 * {
 *   success: true,
 *   user: { _id: "user_id", username: "username", email: "user@example.com", gender: "male", ... },
 *   message: "User Signed up successfully"
 * }
 * // Example of failed user signup due to missing required fields:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing required field"
 * }
 * // Example of failed user signup due to username or email already existing:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Username already exists, choose another" | "Email already exists, choose another"
 * }
 */
export async function signupUser(requestBody) {
  try {
    const { username, email, password, gender } = requestBody;
    if (!username || !email || !password || !gender) {
      return generateResponse(false, 400, "Missing required field");
    }
    const usernameAvailableResponse = await isUsernameAvailable(username);
    const emailAvailableResponse = await isEmailAvailable(email);

    if (usernameAvailableResponse.success == false)
      return usernameAvailableResponse;
    if (emailAvailableResponse.success == false) return emailAvailableResponse;

    const user = new User({ username, email, password, gender });
    user.is_password_set_flag = true;

    await user.generateAuthToken();
    await user.save();
    console.log("saving user");
    //send verification email to user
    await redirectToVerifyEmail(user._id, user.email);
    return { success: true, user, message: "User Signed up successfully" };
  } catch (error) {
    return generateResponse(false, 400, error.message);
  }
}

/**
 * Log in a user with the provided username and password.
 * @param {Object} requestBody - The request body containing user login details (username, password).
 * @returns {Object} An object indicating the success status, user details, authentication token, or error message.
 * @throws {Error} Will throw an error if there's an issue with the user login process.
 * @example
 * // Example of successful user login:
 * {
 *   success: true,
 *   message: "User logged in successfully",
 *   user: { _id: "user_id", username: "username", email: "user@example.com", gender: "male", ... },
 *   token: "authentication_token"
 * }
 * // Example of failed user login due to missing required fields:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing required field"
 * }
 * // Example of failed user login due to incorrect username or password:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Username or password are incorrect"
 * }
 * // Example of failed user login due to deleted user account:
 * {
 *   success: false,
 *   status: 400,
 *   err: "User is deleted"
 * }
 */
export async function loginUser(requestBody) {
  const { username, password } = requestBody;
  if (!username || !password) {
    return generateResponse(false, 400, "Missing required field");
  }
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return generateResponse(false, 400, "Username or password are incorrect");
  }

  if (user.deleted) {
    return generateResponse(false, 400, "User is deleted");
  }
  const token = await user.generateAuthToken();
  await user.save();

  return {
    success: true,
    message: "User logged in successfully",
    user,
    token,
  };
}

/**
 * Log out a user by removing the specified authentication token from their user record.
 * @param {Object} request - The HTTP request object containing the authorization token.
 * @returns {Object} An object indicating the success status or error message upon logging out the user.
 * @throws {Error} Will throw an error if there's an issue with the user logout process.
 * @example
 * // Example of successful user logout:
 * {
 *   success: true,
 *   message: "Logged Out Successfully"
 * }
 * // Example of failed user logout due to missing token:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing token"
 * }
 * // Example of failed user logout due to verification error or invalid token:
 * {
 *   success: false,
 *   status: 401,
 *   err: "Access Denied"
 * }
 */
export async function logoutUser(request) {
  const token = request.headers?.authorization?.split(" ")[1];
  if (!token) return generateResponse(false, 400, "Missing token");
  const { success, err, status, user, msg } = await verifyAuthToken(request);
  if (!user) {
    return generateResponse(success, status, err);
  }

  const index = user.token.indexOf(token);
  user.token.splice(index, 1);

  await user.save();

  return generateResponse(true, null, "Logged Out Successfully");
}

/**
 * Disconnects a user's Google account by verifying their password and updating user data.
 * @param {Object} request - The HTTP request object containing user authentication and password.
 * @returns {Object} An object indicating the success status or error message upon disconnecting from Google.
 * @throws {Error} Will throw an error if there's an issue with the disconnect process or user verification.
 * @example
 * // Example of successful disconnection from Google:
 * {
 *   success: true,
 *   message: "Disconnected from Google successfully"
 * }
 * // Example of failed disconnection due to missing authentication or invalid user:
 * {
 *   success: false,
 *   status: 401,
 *   err: "Access Denied"
 * }
 * // Example of failed disconnection due to missing password or incorrect password:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Password is required" || "Password is incorrect"
 * }
 * // Example of failed disconnection due to internal server error:
 * {
 *   success: false,
 *   status: 500,
 *   err: "Internal server error"
 * }
 */
export async function disconnectGoogle(request) {
  try {
    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }
    if (!user.is_password_set_flag) {
      return generateResponse(false, 400, "User must set his password first");
    }

    const { password } = request?.body;
    if (!password) return generateResponse(false, 400, "Password is required");

    if (!(await bcrypt.compare(password, user.password))) {
      return generateResponse(false, 400, "Password is incorrect");
    }

    user.connected_google = false;
    user.gmail = null;
    await user.save();

    return generateResponse(
      true,
      null,
      "Disconnected from google successfully"
    );
  } catch (error) {
    console.log("Error:", error);
    return generateResponse(false, 500, "Internal server error");
  }
}

/**
 * Connects a user's account to Google using the provided access token.
 * @param {Object} request - The HTTP request object containing the Google access token.
 * @returns {Object} An object indicating the success status or error message upon connecting to Google.
 * @throws {Error} Will throw an error if there's an issue with Google OAuth or user verification.
 * @example
 * // Example of successful connection to Google:
 * {
 *   success: true,
 *   status: 200,
 *   message: "Connected to Google successfully."
 * }
 * // Example of failed connection due to missing authentication or invalid user:
 * {
 *   success: false,
 *   status: 401,
 *   err: "Access Denied"
 * }
 * // Example of failed connection due to existing Gmail association with another account:
 * {
 *   success: false,
 *   status: 409,
 *   err: "Gmail address is already connected to another account."
 * }
 * // Example of failed connection due to Google OAuth error:
 * {
 *   success: false,
 *   status: 500,
 *   err: "Google OAuth error"
 * }
 */
export async function connectToGoogle(request) {
  try {
    const accessToken = request.body.access_token;
    const { data: userData } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { success, err, status, user, msg } = await verifyAuthToken(request);
    if (!user) {
      return generateResponse(success, status, err);
    }

    // Check if a user with the same Gmail address already exists
    const existingUser = await User.findOne({
      gmail: userData.email,
      connected_google: true,
    });
    if (existingUser) {
      return generateResponse(
        false,
        409,
        "Gmail address is already connected to another account."
      );
    }

    // Update user data and save
    user.gmail = userData.email;
    user.connected_google = true;

    await user.save();

    return generateResponse(true, 200, "Connected to Google successfully.");
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    return generateResponse(false, 500, "Google OAuth error");
  }
}

/**
 * Verifies an email using the provided verification token.
 * @param {Object} requestParams - The request parameters containing the verification token.
 * @param {boolean} isUserEmailVerify - A flag indicating whether the verification is for user email or not.
 * @returns {Object} An object indicating the success status or error message upon email verification.
 * @throws {Error} Will throw an error if there's an issue with token validation or database operations.
 * @example
 * // Example of successful email verification:
 * {
 *   success: true,
 *   status: 200,
 *   msg: "Email is verified"
 * }
 * // Example of failed verification due to token not found:
 * {
 *   success: false,
 *   status: 404,
 *   err: "Token not found"
 * }
 * // Example of failed verification due to expired token:
 * {
 *   success: false,
 *   status: 404,
 *   err: "Token has expired"
 * }
 */
export async function verifyEmail(requestParams, isUserEmailVerify) {
  const token = await Token.findOne({
    token: requestParams.token,
  });
  //check if token exists
  if (!token) return { success: false, status: 404, err: "Token not found" };
  //check if token is't expired
  if (token.expires_at < Date.now())
    return { success: false, status: 404, err: "Token has expired" };

  try {
    if (isUserEmailVerify) {
      await User.updateOne(
        { _id: token.user_id },
        { $set: { verified_email_flag: true } }
      );
    }
    console.log("Delete token with id:", token._id);
    await Token.findByIdAndDelete(token._id);
    return { success: true, status: 200, msg: "Email is verified" };
  } catch (error) {
    return { succes: false, err: error.message };
  }
}

/**
 * Initiates the process to reset password by sending a reset password email.
 * @param {Object} requestBody - The request body containing the username and email for password reset.
 * @returns {Object} An object indicating the success status or error message after initiating the password reset process.
 * @throws {Error} Will throw an error if there's an issue with user lookup or email verification.
 * @example
 * // Example of successful initiation of password reset:
 * {
 *   success: true,
 *   message: "Forget password email is sent"
 * }
 * // Example of failure due to missing required fields:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing required field"
 * }
 * // Example of failure due to email not found in the database:
 * {
 *   success: false,
 *   status: 404,
 *   err: "Email not found"
 * }
 * // Example of failure due to username not matching the email:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Username doesn't match email"
 * }
 * // Example of failure due to unverified user email:
 * {
 *   success: false,
 *   status: 400,
 *   err: "User email is not verified yet"
 * }
 */
export async function forgetPassword(requestBody) {
  const { username, email } = requestBody;
  if (!username || !email) {
    return generateResponse(false, 400, "Missing required field");
  }
  const user = await User.findOne({ email });
  if (!user) {
    return generateResponse(false, 404, "Email not found");
  }
  if (user.username !== username) {
    return generateResponse(false, 400, "Username doesn't match email");
  }
  if (!user.verified_email_flag) {
    return generateResponse(false, 400, "User email is not verified yet");
  }
  await redirectToResetPassword(user._id, email);
  return generateResponse(true, null, "Forget password email is sent");
}

/**
 * Initiates the process to send an email containing the forgotten username.
 * @param {Object} requestBody - The request body containing the email for retrieving the forgotten username.
 * @returns {Object} An object indicating the success status or error message after initiating the username retrieval process.
 * @throws {Error} Will throw an error if there's an issue with user lookup or email verification.
 * @example
 * // Example of successful initiation of username retrieval:
 * {
 *   success: true,
 *   message: "Forget username email is sent"
 * }
 * // Example of failure due to missing email field:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing email field"
 * }
 * // Example of failure due to email not found in the database:
 * {
 *   success: false,
 *   status: 404,
 *   err: "Email not found"
 * }
 * // Example of failure due to unverified user email:
 * {
 *   success: false,
 *   status: 400,
 *   err: "User email is not verified yet"
 * }
 */
export async function forgetUsername(requestBody) {
  try {
    const { email } = requestBody;
    if (!email) {
      return generateResponse(false, 400, "Missing email field");
    }
    const user = await User.findOne({ email });
    if (!user) {
      return generateResponse(false, 404, "Email not found");
    }
    if (!user.verified_email_flag) {
      return generateResponse(false, 400, "User email is not verified yet");
    }
    await redirectToForgetUsername(user._id, email, user.username);
    return generateResponse(true, null, "Forget username email is sent");
  } catch (error) {
    return generateResponse(false, null, error);
  }
}

/**
 * Resets the password for a user based on a valid authorization token.
 * @param {Object} request - The request object containing the new password and verified password.
 * @returns {Object} An object indicating the success status, updated user object, or error message after resetting the password.
 * @throws {Error} Will throw an error if there's an issue with token verification or password reset.
 * @example
 * // Example of successful password reset:
 * {
 *   success: true,
 *   message: "User password has been reset successfully"
 * }
 * // Example of failure due to missing required fields:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing required fields"
 * }
 * // Example of failure due to password mismatch:
 * {
 *   success: false,
 *   status: 400,
 *   err: "New password and verified password don't match"
 * }
 * // Example of failure due to password length requirement:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Min length is 8"
 * }
 * // Example of failure due to invalid or expired token:
 * {
 *   success: false,
 *   status: 401,
 *   err: "Access Denied"
 * }
 * // Example of failure due to user not found:
 * {
 *   success: false,
 *   status: 404,
 *   err: "User not found"
 * }
 * // Example of failure due to unverified user email:
 * {
 *   success: false,
 *   status: 400,
 *   err: "User email is not verified yet"
 * }
 */
export async function resetPassword(request) {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) {
    return generateResponse(false, 401, "Access Denied");
  }
  const { new_password, verified_password } = request.body;
  if (!verified_password || !new_password) {
    return generateResponse(false, 400, "Missing required fields");
  }
  if (new_password != verified_password) {
    return generateResponse(
      false,
      400,
      "New password and verified password don't match"
    );
  }
  if (new_password.length < 8) {
    return generateResponse(false, 400, "Min length is 8");
  }
  const userToken = jwt.verify(token, process.env.JWT_SECRET);
  const userId = userToken._id;
  const user = await User.findById(userId);

  if (!user) {
    return generateResponse(false, 404, "User not found");
  }

  if (!user.verified_email_flag) {
    return generateResponse(false, 400, "User email is not verified yet");
  }

  try {
    user.password = new_password;
    user.is_password_set_flag = true;

    await user.save();

    return {
      success: true,
      user,
      message: "User password has been reset successfully",
    };
  } catch (error) {
    return generateResponse(false, null, error.message);
  }
}

/**
 * Changes the email address associated with a user account after verifying the authorization token.
 * @param {Object} request - The request object containing the new email address and user's password.
 * @returns {Object} An object indicating the success status, updated user object, or error message after changing the email.
 * @throws {Error} Will throw an error if there's an issue with password verification or updating the email address.
 * @example
 * // Example of successful email change:
 * {
 *   success: true,
 *   message: "User email has been changed successfully and a verification mail has been sent"
 * }
 * // Example of failure due to missing required field:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing required field"
 * }
 * // Example of failure due to incorrect password:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Password is wrong"
 * }
 * // Example of failure due to same email as current user email:
 * {
 *   success: false,
 *   status: 400,
 *   err: "This is already the user email"
 * }
 * // Example of failure due to email already existing:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Email already exists, choose another"
 * }
 * // Example of failure due to internal server error:
 * {
 *   success: false,
 *   status: 500,
 *   err: "Internal server error"
 * }
 */
export async function changeEmail(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return generateResponse(success, status, err);
  }

  const { new_email, password } = request.body;
  if (!new_email || !password) {
    return generateResponse(false, 400, "Missing required field");
  }
  const result = await bcrypt.compare(password, user.password);
  if (!result) {
    return generateResponse(false, 400, "Password is wrong");
  }

  const userOldEmail = user.email;
  if (userOldEmail == new_email) {
    return generateResponse(false, 400, "This is already the user email");
  }

  const emailAvailableResponse = await isEmailAvailable(new_email);

  if (emailAvailableResponse.success == false) return emailAvailableResponse;

  try {
    user.email = new_email;
    user.verified_email_flag = false;
    await user.save();

    if (user.verified_email_flag) {
      //send email to old email that user email has changed
      await sendChangeEmail(userOldEmail, user.username);
    }

    //send verification email to new user email
    await redirectToVerifyEmail(user._id, new_email);

    return generateResponse(
      true,
      null,
      "User email has been changed successfully and a verification mail has been sent"
    );
  } catch (error) {
    return generateResponse(false, null, error.message);
  }
}

/**
 * Changes the password for the authenticated user after verifying the authorization token.
 * @param {Object} request - The request object containing the current password, new password, and verified new password.
 * @returns {Object} An object indicating the success status, error details, or message after changing the password.
 * @throws {Error} Will throw an error if there's an issue with password verification or updating the password.
 * @example
 * // Example of successful password change:
 * {
 *   success: true,
 *   message: "User password has been changed successfully and a mail has been sent"
 * }
 * // Example of failure due to missing required field:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing required field"
 * }
 * // Example of failure due to new password not matching the verified new password:
 * {
 *   success: false,
 *   status: 400,
 *   err: "New password doesn't match new verified password"
 * }
 * // Example of failure due to password length being less than 8 characters:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Min length is 8"
 * }
 * // Example of failure due to incorrect current password:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Current password is wrong"
 * }
 * // Example of failure due to attempting to change the password to the current password:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Can't change password to current password"
 * }
 * // Example of failure due to internal server error:
 * {
 *   success: false,
 *   status: 400,
 * }
 */
export async function changePassword(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return generateResponse(success, status, err);
  }
  const { current_password, new_password, verified_new_password } =
    request.body;
  if (!current_password || !new_password || !verified_new_password) {
    return generateResponse(false, 400, "Missing required field");
  }

  if (new_password != verified_new_password) {
    return generateResponse(
      false,
      400,
      "New password doesn't match new verified password"
    );
  }

  if (new_password.length < 8) {
    return generateResponse(false, 400, "Min length is 8");
  }

  const result = await bcrypt.compare(current_password, user.password);
  if (!result) {
    return generateResponse(false, 400, "Current password is wrong");
  }

  const result2 = await bcrypt.compare(new_password, user.password);
  if (result2) {
    return generateResponse(
      false,
      400,
      "Can't change password to current password"
    );
  }

  try {
    user.password = new_password;
    user.is_password_set_flag = true;

    await user.save();

    if (user.verified_email_flag) {
      //send email to user that password has changed
      await sendChangePassword(user.email, user.username);
    }

    return generateResponse(
      true,
      null,
      "User password has been changed successfully and a mail has been sent"
    );
  } catch (error) {
    return generateResponse(false, 400, error.message);
  }
}

/**
 * Changes the username for the authenticated user after verifying the authorization token.
 * @param {Object} request - The request object containing the new username.
 * @returns {Object} An object indicating the success status, error details, or message after changing the username.
 * @throws {Error} Will throw an error if there's an issue with updating the username.
 * @example
 * // Example of successful username change:
 * {
 *   success: true,
 *   message: "Username has been changed successfully"
 * }
 * // Example of failure due to missing username field:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Missing username field"
 * }
 * // Example of failure due to attempting to change to the same username:
 * {
 *   success: false,
 *   status: 400,
 *   err: "This is already the user username"
 * }
 * // Example of failure due to username availability check:
 * {
 *   success: false,
 *   status: 400,
 *   err: "Username already exists, choose another"
 * }
 * // Example of failure due to internal server error:
 * {
 *   success: false,
 *   status: 400,
 * }
 */
export async function changeUsername(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return generateResponse(success, status, err);
  }

  const username = request.body.username;
  if (!username) {
    return generateResponse(false, 400, "Missing username field");
  }

  const userOldUsername = user.username;
  if (userOldUsername == username) {
    return generateResponse(false, 400, "This is already the user username");
  }

  const usernameAvailableResponse = await isUsernameAvailable(username);

  if (usernameAvailableResponse.success == false)
    return usernameAvailableResponse;

  try {
    user.username = username;

    await user.save();

    return generateResponse(
      true,
      null,
      "Username has been changed successfully"
    );
  } catch (error) {
    return generateResponse(false, 400, error.message);
  }
}
