import { signupUser, loginUser } from "../src/controller/userAuth";
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

