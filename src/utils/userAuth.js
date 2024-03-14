import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

async function sendEmail(link, userEmail) {
  console.log("link: ", link);
  console.log("user email: ", userEmail);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  let message = {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "Verify your Reddit email address", // Subject line
    text: "Hello world?", // plain text body
    html: `<a href=${link}>Verify email</a>`, // html body
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("email sent");
    })
    .catch((error) => {
      console.log("ERROR", error);
    });
}

async function verifyEmail(userId) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 3); // Adding 3 days
  const token = new Token({
    user_id: userId,
    token: jwt.sign({ _id: userId.toString() }, process.env.JWT_SECRET1),
    expires_at: expirationDate,
  });
  await token.save();
  const link = `http://localhost:3000/users/verify-email/${token.token}`;
  // console.log("Link",link)
  await sendEmail(link, "malakyasser8@gmail.com");
  console.log("email sent pt2");
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
  verifyEmail(user._id);
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
