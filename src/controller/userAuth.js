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

export async function isUsernameAvailable(username) {
  console.log(username);
  const user = await User.findOne({ username });
  if (user)
    return {
      success: false,
      status: 400,
      err: "Username already exists, choose another",
    };
  else return { success: true, msg: "Username is available" };
}

export async function isEmailAvailable(email) {
  if (!validator.isEmail(email)) {
    return {
      success: false,
      status: 400,
      err: "Invalid email",
    };
  }
  const user = await User.findOne({ email });
  if (user)
    return {
      success: false,
      status: 400,
      err: "Email already exists, choose another",
    };
  else return { success: true, msg: "Email is available" };
}

export async function verifyAuthToken(request) {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) {
    return { success: false, status: 401, err: "Access Denied" };
  }

  const userToken = jwt.verify(token, process.env.JWT_SECRET);
  const userId = userToken._id;
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, err: "User not found", status: 404 };
  }
  return { success: true, user: user };
}

export async function signupUser(requestBody) {
  const { username, email, password, gender } = requestBody;

  const usernameAvailableResponse = await isUsernameAvailable(username);
  const emailAvailableResponse = await isEmailAvailable(email);

  if (usernameAvailableResponse.success == false)
    return usernameAvailableResponse;
  if (emailAvailableResponse.success == false) return emailAvailableResponse;

  const user = new User({ username, email, password, gender });
  user.is_password_set_flag = true;
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
  await redirectToVerifyEmail(user._id, user.email);
  return { success: true, user };
}

export async function loginUser(requestBody) {
  const { username, password } = requestBody;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { success: false, err: "Username or password are incorrect" };
  }

  const refreshToken = await user.generateAuthToken();
  await user.save();

  return { success: true, user, refreshToken: refreshToken };
}

export async function logoutUser(requestBody) {
  const { username, token } = requestBody;
  console.log(username, token);
  const user = await User.findOne({ username });
  if (!user || user.token != token) {
    console.log(token);
    console.log(user.token);
    return { success: false, err: "Not a valid username or existing token" };
  }

  user.token = "";
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
  if (!user.verified_email_flag) {
    return {
      success: false,
      status: 400,
      err: "User email is not verified yet",
    };
  }
  await redirectToResetPassword(user._id, email);
  return { success: true, user, msg: "Forget password email is sent" };
}

export async function forgetUsername(requestBody) {
  const { email } = requestBody;
  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, status: 404, err: "Email not found" };
  }
  if (!user.verified_email_flag) {
    return {
      success: false,
      status: 400,
      err: "User email is not verified yet",
    };
  }
  try {
    await redirectToForgetUsername(user._id, email, user.username);
    return { success: true, user, msg: "Forget username email is sent" };
  } catch (error) {
    return { success: false, err: error };
  }
}

export async function resetPassword(request) {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) {
    return { success: false, status: 401, err: "Access Denied" };
  }
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

  if (!user.verified_email_flag) {
    return {
      success: false,
      status: 400,
      err: "User email is not verified yet",
    };
  }

  try {
    user.password = new_password;
    user.is_password_set_flag = true;

    await user.save();

    return {
      success: true,
      user,
      msg: "User password has been reset successfully",
    };
  } catch (error) {
    return { succes: false, err: error.message };
  }
}

export async function changeEmail(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }

  const result = await bcrypt.compare(password, user.password);
  if (!result) {
    return {
      success: false,
      status: 400,
      err: "Password is wrong",
    };
  }

  const userOldEmail = user.email;
  if (userOldEmail == new_email) {
    return {
      success: false,
      status: 400,
      err: "This is already the user email",
    };
  }

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

    return {
      success: true,
      user,
      msg: "User email has been changed successfully and a verification mail has been sent",
    };
  } catch (error) {
    return { succes: false, err: error.message };
  }
}

export async function changePassword(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }

  const result = await bcrypt.compare(current_password, user.password);
  if (!result) {
    return {
      success: false,
      status: 400,
      err: "Current password is wrong",
    };
  }

  const result2 = await bcrypt.compare(new_password, user.password);
  console.log(result2);
  if (result2) {
    return {
      success: false,
      status: 400,
      err: "Can't change password to current password",
    };
  }

  if (new_password != verified_new_password) {
    return {
      success: false,
      status: 400,
      err: "New password doesn't match new verified password",
    };
  }

  try {
    user.password = new_password;
    user.is_password_set_flag = true;

    await user.save();

    if (user.verified_email_flag) {
      //send email to user that password has changed
      await sendChangePassword(user.email, user.username);
    }

    return {
      success: true,
      user,
      msg: "User password has been changed successfully and a mail has been sent",
    };
  } catch (error) {
    return { succes: false, status: 403, err: error.message };
  }
}

export async function changeUsername(request) {
  const { success, err, status, user, msg } = await verifyAuthToken(request);

  if (!user) {
    return { success, err, status, user, msg };
  }

  const username = request.body.username;
  const usernameAvailableResponse = await isUsernameAvailable(username);

  if (usernameAvailableResponse.success == false)
    return usernameAvailableResponse;

  try {
    user.username = username;

    await user.save();

    return {
      success: true,
      user,
      msg: "Username has been changed successfully",
    };
  } catch (error) {
    return { succes: false, status: 400, err: error.message };
  }
}
