import { User } from "../../src/db/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Mock bcrypt and jsonwebtoken
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("User Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should hash the password before saving", async () => {
    const plainPassword = "mypassword";
    const hashedPassword = "hashedPassword123";

    // Mock bcrypt hash function to resolve with the hashed password
    bcrypt.hash.mockResolvedValue(hashedPassword);

    // Create a new User instance
    const user = new User({
      username: "testuser",
      email: "test@example.com",
      password: plainPassword,
      social_links: [{ username: "test" }],
    });

    // Mock the save method to test its behavior
    const saveMock = jest.fn();
    user.save = saveMock;

    // Call the save method (which is now mocked)
    await user.save();

  });

  it("should generate authentication token", async () => {
    const user = new User({
      _id: "someuserid",
      username: "testuser",
      profile_picture: "profile.jpg",
    });

    const expectedToken = "mockedToken123";

    // Mock jwt.sign to return a specific token
    jwt.sign.mockReturnValue(expectedToken);

    // Call the generateAuthToken method directly
    const token = await user.generateAuthToken();

    // Assert that jwt.sign was called with the correct arguments
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        _id: user._id.toString(),
        username: user.username,
        profile_picture: user.profile_picture,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Assert that the token returned matches the expected token
    expect(token).toEqual(expectedToken);

    // Assert that the generated token was added to the user's token array
    expect(user.token).toContain(expectedToken);
  });

});
