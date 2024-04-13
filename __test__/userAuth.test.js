import { signupUser, loginUser, logoutUser } from "../src/controller/userAuth";
import {
  isUsernameAvailable,
  isEmailAvailable,
} from "../src/controller/userAuth";
import { User } from "../src/db/models/User";
import { redirectToVerifyEmail } from "../src/utils/emailSending";
import bcrypt from "bcryptjs";

// jest.mock("../src/controller/userAuth");
jest.mock("../src/db/models/User");
jest.mock("../src/utils/emailSending");

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
    const requestBody = {
      username: "testUser",
      token: "validToken",
    };

    const mockUser = {
      username: requestBody.username,
      token: requestBody.token,
      save: jest.fn(),
    };
    User.findOne = jest.fn().mockReturnValue(mockUser);

    const result = await logoutUser(requestBody);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Logged Out Successfully");
  });

  it("should not log out a user with missing fields", async () => {
    const requestBody = {
      username: "testUser",
    };

    const result = await logoutUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Missing required field");
    expect(result.error.status).toBe(400);
  });

  it("should not log out a user with invalid credentials", async () => {
    const requestBody = {
      username: "testUser",
      token: "invalidToken",
    };

    User.findOne = jest.fn().mockReturnValue(null);

    const result = await logoutUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Not a valid username or existing token");
    expect(result.error.status).toBe(400);
  });

  it("should not log out an unauthenticated user", async () => {
    const requestBody = {
      username: "testUser",
      token: "asdasdasd",
    };
    const mockUser = {
      username: requestBody.username,
      token: "requestBody.token",
    };
    User.findOne = jest.fn().mockReturnValue(mockUser);
    const result = await logoutUser(requestBody);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Not a valid username or existing token");
    expect(result.error.status).toBe(400);
  });
});
