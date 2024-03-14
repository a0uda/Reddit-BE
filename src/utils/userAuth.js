import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
import {
  redirectToResetPassword,
  redirectToVerifyEmail,
} from "./emailSending.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

export async function isUsernameAvailable(username) {
  const user = await User.findOne({ username });
  if (user)
    return { success: false, err: "Username already exists, choose another" };
  else return { success: true };
}

export async function isEmailAvailable(email) {
  const user = await User.findOne({ email });
  if (user)
    return { success: false, err: "Email already exists, choose another" };
  else return { success: true };
}

export async function verifyAuthToken(request) {
  try {
    const token = request.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      token: token,
    });
    if (!user) {
      throw new Error();
    }
    return user;
  } catch (error) {
    return null;
  }
}

export async function signupUser(requestBody) {
  const { username, email, password, gender } = requestBody;

  const usernameAvailableResponse = await isUsernameAvailable(username);
  const emailAvailableResponse = await isEmailAvailable(email);

  if (usernameAvailableResponse.success == false)
    return usernameAvailableResponse;
  if (emailAvailableResponse.success == false) return emailAvailableResponse;

  const user = new User({ username, email, password, gender });
  try {
    await user.generateAuthToken();
    await user.save();
    console.log("saving user");
  } catch (error) {
    if (error.name === "ValidationError") {
      // Handle validation errors
      return { succes: false, err: error.message };
    } else {
      // Handle other types of errors
      return { succes: false, err: error.message };
    }
  }
  //send verification email to user
  redirectToVerifyEmail(user._id, user.email);
  return { success: true, user };
}

export async function loginUser(requestBody) {
  const { username, password } = requestBody;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { success: false, err: "Username or password are incorrect" };
  }

  await user.generateAuthToken();
  await user.save();

  return { success: true, user };
}

export async function logoutUser(requestBody) {
  const { username, token } = requestBody;
  const user = await User.findOne({ username });
  if (!user || user.token != token) {
    console.log(token);
    console.log(user.token);
    return { success: false, err: "Not a valid username or existing token" };
  }

  user.token = undefined;
  await user.save();

  return { success: true, msg: "Logged Out Successfully" };
}

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

export async function forgetPassword(requestBody) {
  const { username, email } = requestBody;
  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, status: 404, err: "Email not found" };
  }
  if (user.username != username) {
    return { success: false, status: 400, err: "Username doesn't match email" };
  }
  console.log("ID:", user._id);
  console.log("email:", email);
  await redirectToResetPassword(user._id, email);
  return { success: true, user, msg: "Forget password email is sent" };
}

export async function resetPassword(request) {
  const token = request.headers.authorization.split(" ")[1];
  const { new_password, verified_password } = request.body;

  if (new_password != verified_password) {
    return {
      success: false,
      status: 400,
      err: "New password and verifed password does't match",
    };
  }

  const userToken = jwt.verify(token, process.env.JWT_SECRET);
  const userId = userToken._id;
  const user = await User.findById(userId);

  if (!user) {
    return { success: false, status: 404, err: "User not found" };
  }
  try {
    user.password = new_password;

    await user.save();

    return {
      success: true,
      user,
      msg: "User password has been reset sucessfully",
    };
  } catch (error) {
    return { succes: false, err: error.message };
  }
}
