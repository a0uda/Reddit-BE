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

export async function isEmailAvailable(email) {
  if (!validator.isEmail(email)) {
    return generateResponse(false, 400, "Invalid email");
  }
  const user = await User.findOne({ email });
  if (user)
    return generateResponse(false, 400, "Email already exists, choose another");
  else return generateResponse(true, null, "Email is available");
}

export async function verifyAuthToken(request) {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) {
    return { success: false, status: 401, err: "Access Denied" };
  }
  var userToken;
  try {
     userToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return { success: false, err, status: 400 };
  }
  const userId = userToken._id;
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, err: "User not found", status: 404 };
  }
  return { success: true, user: user };
}

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

export async function loginUser(requestBody) {
  const { username, password } = requestBody;
  if (!username || !password) {
    return generateResponse(false, 400, "Missing required field");
  }
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return generateResponse(false, 400, "Username or password are incorrect");
  }

  const refreshToken = await user.generateAuthToken();
  await user.save();

  return {
    success: true,
    message: "User logged in successfully",
    user,
    refreshToken: refreshToken,
  };
}

export async function logoutUser(requestBody) {
  const { username, token } = requestBody;
  if (!username || !token) {
    return generateResponse(false, 400, "Missing required field");
  }
  const user = await User.findOne({ username });
  if (!user || user.token != token) {
    return generateResponse(
      false,
      400,
      "Not a valid username or existing token"
    );
  }

  user.token = "";
  await user.save();

  return generateResponse(true, null, "Logged Out Successfully");
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
