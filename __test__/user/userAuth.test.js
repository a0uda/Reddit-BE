import {
  signupUser,
  loginUser,
  logoutUser,
  isUsernameAvailable,
  isEmailAvailable,
  forgetPassword,
  forgetUsername,
  resetPassword,
  changeEmail,
  changeUsername,
  changePassword,
} from "../../src/controller/userAuth";
import { User } from "../../src/db/models/User";
import { redirectToResetPassword } from "../../src/utils/emailSending";
import jwt from "jsonwebtoken"; // Import jwt module
import bcrypt from "bcryptjs";

jest.mock("jsonwebtoken"); // Mock the jsonwebtoken module
jest.mock("../../src/db/models/User");
jest.mock("../../src/utils/emailSending");

describe("User Signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should sign up a user with correct details", async () => {
    const requestBody = {
      username: "malak12345",
      email: "test@example.com",
      password: "malak123",
      gender: "female",
    };

    const mockUser = {
      _id: "mockUserId",
      ...requestBody,
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.mockImplementation(() => mockUser);
    User.findOne = jest.fn().mockReturnValue(null); // User is not found (username and email are available)

    const result = await signupUser(requestBody);

    expect(result.success).toBe(true);
    expect(result.message).toBe("User Signed up successfully");
  });

  it("should not sign up a user with missing fields", async () => {
    const requestBody = {
      username: "malak12345",
      email: "test@example.com",
      gender: "female",
    };

    const result = await signupUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Missing required field");
    expect(result.error.status).toBe(400);
  });

  it("should not sign up a user with existing username", async () => {
    const requestBody = {
      username: "existingUser",
      email: "new@example.com",
      password: "password123",
      gender: "male",
    };

    User.findOne = jest.fn().mockReturnValue({}); // Simulate existing user

    const result = await signupUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe(
      "Username already exists, choose another"
    );
    expect(result.error.status).toBe(400);
  });

  it("should not sign up a user with existing email", async () => {
    const requestBody = {
      username: "newUserrrrr",
      email: "existing@example.com",
      password: "password123",
      gender: "male",
    };

    //User.findOne = jest.fn().mockReturnValue({}); // Simulate existing email
    User.findOne = jest.fn((query) => {
      if (query.email === requestBody.email) {
        return {}; // Mock existing email
      } else if (query.username === requestBody.username) {
        return null;
      }
      return null; // Mock available username/email
    });

    const result = await signupUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Email already exists, choose another");
    expect(result.error.status).toBe(400);
  });
});

describe("User Login", () => {
  beforeEach(() => {
    // Clear all mock implementations and reset mock calls
    jest.clearAllMocks();
  });

  it("should login a user with correct credentials", async () => {
    const requestBody = {
      username: "malak12345",
      password: "malak123",
    };

    // Mock user creation
    const mockUser = {
      _id: "mockUserId",
      username: requestBody.username,
      password: await bcrypt.hash(requestBody.password, 8), // Hash the password before assigning
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.mockImplementation(() => mockUser);
    User.findOne = jest.fn().mockReturnValue(mockUser);

    // Call the login function
    const result = await loginUser(requestBody);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.message).toBe("User logged in successfully");
  });

  it("should not login a user with incorrect credentials", async () => {
    const requestBody = {
      username: "malak12345",
      password: "wrongpassword",
    };

    // Mock user creation
    const mockUser = {
      _id: "mockUserId",
      username: requestBody.username,
      password: await bcrypt.hash("anotherwrongpass", 8), // Hash the password before assigning
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.mockImplementation(() => mockUser);
    User.findOne = jest.fn().mockReturnValue(mockUser);

    // Call the login function
    const result = await loginUser(requestBody);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Username or password are incorrect");
    expect(result.error.status).toBe(400);
  });

  it("should not login a user with missing credentials", async () => {
    const requestBody = {
      username: "malak12345",
    };

    // Mock user creation
    const mockUser = {
      _id: "mockUserId",
      username: requestBody.username,
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.mockImplementation(() => mockUser);
    User.findOne = jest.fn().mockReturnValue(mockUser);

    // Call the login function
    const result = await loginUser(requestBody);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Missing required field");
    expect(result.error.status).toBe(400);
  });
});

describe("User Logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log out a user with correct credentials", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
    };

    const mockUser = {
      _id: "userId",
      username: "malak",
      token: ["valid_token"],
      save: jest.fn(),
    };

    jwt.verify.mockReturnValue({ _id: mockUser._id });
    User.findOne = jest.fn().mockReturnValue(mockUser);
    User.findById.mockResolvedValue(mockUser);
    const result = await logoutUser(request);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Logged Out Successfully");
  });

  it("should not log out a user with missing fields", async () => {
    const request = {
      
    };

    const result = await logoutUser(request);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Missing token");
    expect(result.error.status).toBe(400);
  });

  it("should not log out a user with invalid credentials", async () => {
    const request = {
      headers: {
        authorization: "wrong token",
      },
    };
    jwt.verify.mockReturnValue(null);
    User.findOne = jest.fn().mockReturnValue(null);
    User.findById.mockResolvedValue(null);
    const result = await logoutUser(request);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid token");
    expect(result.error.status).toBe(400);
  });

  it("should not log out an unauthenticated user", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
    };
    const mockUser = {
      _id: "user_id",
      token: [""],
      save: jest.fn(),
    };

    jwt.verify.mockReturnValue({ _id: mockUser._id });
    User.findOne = jest.fn().mockReturnValue(mockUser);
    User.findById.mockResolvedValue(mockUser);
    const result = await logoutUser(request);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid token. User may have logged out");
    expect(result.error.status).toBe(400);
  });
});

describe("Check if Username is available", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });
  it("should return true and message if username is available", async () => {
    const username = "newUsername";
    const requestBody = {
      username: "username123",
    };

    User.findOne = jest.fn((query) => {
      if (query.username === requestBody.username) {
        return null;
      }
      return null;
    });

    const result = await isUsernameAvailable(username);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual("Username is available");
  });

  it("should return false and message if username is not available", async () => {
    const username = "newUsername";
    const mockUser = {
      _id: "mockUserId",
      username,
    };
    User.mockImplementation(() => mockUser);
    User.findOne = jest.fn().mockReturnValue(mockUser);

    const result = await isUsernameAvailable(username);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Username already exists, choose another"
    );
  });
});

describe("Check if email is available", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });
  it("should return true and message if email is available", async () => {
    const email = "email@gmail.com";

    User.findOne = jest.fn().mockReturnValue(null);

    const result = await isEmailAvailable(email);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual("Email is available");
  });

  it("should return false and message if email is invalid", async () => {
    const email = "wrong email";
    const result = await isEmailAvailable(email);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Invalid email");
  });

  it("should return false and message if email is not available", async () => {
    const email = "email@gmail.com";
    const mockUser = {
      _id: "mockUserId",
      email,
    };
    User.mockImplementation(() => mockUser);
    User.findOne = jest.fn().mockReturnValue(mockUser);

    const result = await isEmailAvailable(email);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Email already exists, choose another"
    );
  });
});

describe("Forget Password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });
  it("should return error if username or email is missing", async () => {
    const requestBody = {};

    const result = await forgetPassword(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Missing required field");
  });

  it("should return error if email is not found", async () => {
    const requestBody = {
      username: "example_username",
      email: "nonexistent_email@example.com",
    };

    User.findOne = jest.fn().mockReturnValue(null);

    const result = await forgetPassword(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Email not found");
  });

  it("should return error if username doesn't match email", async () => {
    const requestBody = {
      username: "mismatched_username",
      email: "existing_email@example.com",
    };

    const mockUser = {
      username: "different_username",
      email: "existing_email@example.com",
    };

    User.findOne = jest.fn().mockReturnValue(mockUser);

    const result = await forgetPassword(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Username doesn't match email");
  });

  it("should return error if user email is not verified", async () => {
    const requestBody = {
      username: "example_username",
      email: "existing_email@example.com",
    };

    const mockUser = {
      username: "example_username",
      email: "existing_email@example.com",
      verified_email_flag: false,
    };

    User.findOne = jest.fn().mockReturnValue(mockUser);

    const result = await forgetPassword(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("User email is not verified yet");
  });

  it("should return success if all conditions are met", async () => {
    const requestBody = {
      username: "example_username",
      email: "existing_email@example.com",
    };

    const mockUser = {
      _id: "mockUserId",
      username: "example_username",
      email: "existing_email@example.com",
      verified_email_flag: true,
    };

    User.findOne = jest.fn().mockReturnValue(mockUser);

    const redirectToResetPasswordMock = jest.fn();
    global.redirectToResetPassword = redirectToResetPasswordMock;

    const result = await forgetPassword(requestBody);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual("Forget password email is sent");
  });
});

describe("Forget Username", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });
  it("should return error if email is missing", async () => {
    const requestBody = {};

    const result = await forgetUsername(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Missing email field");
  });

  it("should return error if email is not found", async () => {
    const requestBody = {
      email: "nonexistent_email@example.com",
    };

    User.findOne.mockResolvedValue(null);

    const result = await forgetUsername(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("Email not found");
  });

  it("should return error if user email is not verified", async () => {
    const requestBody = {
      email: "existing_email@example.com",
    };

    const mockUser = {
      email: "existing_email@example.com",
      verified_email_flag: false,
    };

    User.findOne.mockResolvedValue(mockUser);

    const result = await forgetUsername(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("User email is not verified yet");
  });

  it("should return success if all conditions are met", async () => {
    const requestBody = {
      email: "existing_email@example.com",
    };

    const mockUser = {
      _id: "mockUserId",
      email: "existing_email@example.com",
      verified_email_flag: true,
    };

    User.findOne.mockResolvedValue(mockUser);

    const redirectToForgetUsernameMock = jest.fn();
    global.redirectToForgetUsername = redirectToForgetUsernameMock;

    const result = await forgetUsername(requestBody);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual("Forget username email is sent");
  });
});

describe("Reset Password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });
  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };

    const result = await resetPassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if new_password or verified_password is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {},
    };

    const result = await resetPassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Missing required fields");
  });

  it("should return error if new_password and verified_password don't match", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_password: "new_password",
        verified_password: "different_password",
      },
    };

    const result = await resetPassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "New password and verified password don't match"
    );
  });

  it("should return error if new_password length is less than 8 characters", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_password: "short",
        verified_password: "short",
      },
    };

    const result = await resetPassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Min length is 8");
  });

  it("should return error if user is not found", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_password: "new_password",
        verified_password: "new_password",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email: "existing_email@example.com",
      verified_email_flag: false,
    };
    User.findById.mockResolvedValue(null);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const result = await resetPassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(404);
    expect(result.error.message).toEqual("User not found");
  });

  it("should return error if user email is not verified", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_password: "new_password",
        verified_password: "new_password",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email: "existing_email@example.com",
      verified_email_flag: false,
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const result = await resetPassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("User email is not verified yet");
  });

  it("should reset password successfully", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_password: "new_password",
        verified_password: "new_password",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email: "existing_email@example.com",
      verified_email_flag: true,
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    jwt.verify.mockReturnValue({ _id: mockUser._id });

    const result = await resetPassword(request);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual("User password has been reset successfully");
  });
});

describe("Change Email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });
  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };

    const result = await changeEmail(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if new_email or password is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {},
    };

    const result = await changeEmail(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Missing required field");
  });

  it("should return error if password is wrong", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_email: "new_email@example.com",
        password: "password",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      password: await bcrypt.hash("wrong_password", 8), // Hash the password before assigning
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);

    const result = await changeEmail(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Password is wrong");
  });

  it("should return error if new_email is the same as current email", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_email: "existing_email@example.com", // Same as current email
        password: "password",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email: request.body.new_email,
      password: await bcrypt.hash(request.body.password, 8), // Hash the password before assigning
      generateAuthToken: jest.fn(),
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);

    const result = await changeEmail(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("This is already the user email");
  });

  it("should return success if all conditions are met", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        new_email: "new_email@example.com",
        password: "password",
      },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email: "existing_email@example.com",
      username: "example_username",
      verified_email_flag: true,
      password: await bcrypt.hash(request.body.password, 8), // Hash the password before assigning
      generateAuthToken: jest.fn(),
      save: jest.fn(), // Mock save function
    };
    User.mockImplementation(() => mockUser);
    User.findById = jest.fn().mockReturnValue(mockUser);
    User.findOne = jest.fn().mockReturnValue(null);

    const result = await changeEmail(request);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual(
      "User email has been changed successfully and a verification mail has been sent"
    );
    expect(mockUser.email).toEqual("new_email@example.com");
    expect(mockUser.verified_email_flag).toEqual(false);
    expect(mockUser.save).toHaveBeenCalled();
  });
});

describe("Change Password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });
  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };

    const result = await changePassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if required fields are missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {},
    };

    const result = await changePassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Missing required field");
  });

  it("should return error if new password doesn't match verified password", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        current_password: "current_password",
        new_password: "new_password",
        verified_new_password: "different_password",
      },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      password: await bcrypt.hash("current_password", 8),
    };
    User.findById.mockResolvedValue(mockUser);

    const result = await changePassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "New password doesn't match new verified password"
    );
  });

  it("should return error if current password is wrong", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        current_password: "wrong_password",
        new_password: "new_password",
        verified_new_password: "new_password",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      password: await bcrypt.hash("current_password", 8),
    };
    User.findById.mockResolvedValue(mockUser);

    const result = await changePassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Current password is wrong");
  });

  it("should return error if new password is the same as current password", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        current_password: "current_password",
        new_password: "current_password",
        verified_new_password: "current_password",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      password: await bcrypt.hash("current_password", 8),
    };
    User.findById.mockResolvedValue(mockUser);

    const result = await changePassword(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual(
      "Can't change password to current password"
    );
  });

  it("should return success if all conditions are met", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        current_password: "current_password",
        new_password: "new_password",
        verified_new_password: "new_password",
      },
    };

    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      password: await bcrypt.hash("current_password", 8),
      is_password_set_flag: true,
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);

    const result = await changePassword(request);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual(
      "User password has been changed successfully and a mail has been sent"
    );
    expect(mockUser.password).not.toEqual("current_password");
    expect(mockUser.is_password_set_flag).toEqual(true);
    expect(mockUser.save).toHaveBeenCalled();
  });
});

describe("Change Username", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.mockReset();
  });

  it("should return error if token is missing", async () => {
    const request = {
      headers: {},
    };
    const result = await changeUsername(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(401);
    expect(result.error.message).toEqual("Access Denied");
  });

  it("should return error if username is missing", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {},
    };
    const result = await changeUsername(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("Missing username field");
  });

  it("should return error if new username is the same as current username", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        username: "existing_username",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      username: request.body.username, // Same as new username
    };
    User.findById.mockResolvedValue(mockUser);

    const result = await changeUsername(request);

    expect(result.success).toBe(false);
    expect(result.error.status).toEqual(400);
    expect(result.error.message).toEqual("This is already the user username");
  });

  it("should return success if all conditions are met", async () => {
    const request = {
      headers: {
        authorization: "Bearer valid_token",
      },
      body: {
        username: "new_username",
      },
    };
    const mockUser = {
      _id: "mockUserId",
      token: ["valid_token"],
      email: "existing_email@example.com",
      username: "current_username",
      verified_email_flag: true,
      password: await bcrypt.hash("current_password", 8), // Hash the password before assigning
      generateAuthToken: jest.fn(),
      save: jest.fn(), // Mock save function
    };

    User.findById.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(null);

    const result = await changeUsername(request);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toEqual("Username has been changed successfully");
    expect(mockUser.username).toEqual("new_username");
    expect(mockUser.save).toHaveBeenCalled();
  });
});
