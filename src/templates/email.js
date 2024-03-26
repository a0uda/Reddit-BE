// Template for verifying user's email
export function verifyEmailEmail(link, userEmail) {
  return {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "Verify your Reddit email address", // Subject line
    text: "Hello world?", // plain text body
    html: `<a href=${link}>Verify email</a>`, // html body
  };
}

// Template for forget password email sent to user
export function forgetPasswordEmail(link, userEmail) {
  return {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "Ask and you shall receive... a password reset", // Subject line
    text: "Hello world?", // plain text body
    html: `<a href=${link}>Reset Password</a>`, // html body
  };
}

// Template for forget username email sent to user
export function forgetUsernameEmail(link, userEmail, username) {
  return {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "So you wanna know your Reddit username, huh?", // Subject line
    html: `<p>Your username is <a href="${link}">${username}</a></p>`, // html body
  };
}

// Template for change email
export function changeOldEmail(userOldEmail, username) {
  return {
    from: process.env.EMAIL, // sender address
    to: userOldEmail, // list of receivers
    subject: "Your email address has been changed", // Subject line
    html: `<p>Your email for ${username} has been changed to ${userOldEmail}</p>`, // html body
  };
}

// Template for change password
export function changePasswordEmail(userEmail, username) {
  return {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "Your Reddit Password is updated", // Subject line
    html: `<p>The password for ${username} has been updated</p>`, // html body
  };
}

// Template for new follower request
export function newFollowerEmail(userEmail,followerUsername) {
  return {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "You have got a new follower", // Subject line
    html: `<p> ${followerUsername} has followed you. </p>`, // html body
  };
}

// Template for new chat request
export function newChatRequestEmail(userEmail,followerUsername) {
  return {
    from: process.env.EMAIL, // sender address
    to: userEmail, // list of receivers
    subject: "You have got a new chat request", // Subject line
    html: `<p> ${followerUsername} has sent  you a chat request. </p>`, // html body
  };
}