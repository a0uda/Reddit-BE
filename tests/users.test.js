const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app"); // Assuming your Express app is exported from src/app.js
const db = require("./db");
const userAuth = require("../src/controller/userAuth");
const userModel = require("../src/db/models/User");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("User Login Endpoint", () => {
  it("should login a user with correct credentials", async () => {
    // Create a user
    const userData = {
      username: "malak12345",
      password: "malak123",
    };
    await userAuth.loginUser(userData);

    // Make a request to login endpoint
    const response = await request("http://localhost:3000")
      .post("/users/login")
      .send(userData)
      .expect(200);

    // Assert response contains necessary fields
    // expect(response.header.authorization)
    // expect(response.header.refreshToken).toBeDefined();
    // console.log(response.header.authorization);
    expect(response.body.username).toBe(userData.username);
  });

  it("should return 400 with incorrect credentials", async () => {
    // Make a request with incorrect credentials
    const response = await request("http://localhost:3000")
      .post("/users/login")
      .send({ username: "invaliduser", password: "invalidpassword" })
      .expect(400);

    // Assert response contains error message
    expect(response.body).toEqual({
      err: "Username or password are incorrect",
    });
  });

//   it("should return 500 in case of server error", async () => {
//     // Mock a server error by forcing a rejection in the controller
//     jest
//       .spyOn(userAuth, "loginUser")
//       .mockRejectedValueOnce(new Error("Some server error"));

//     // Make a request
//     const response = await request("http://localhost:3000")
//       .post("/users/login")
//       .send({ username: "testuser", password: "testpassword" });

//     // Assert response contains error message
//     expect(response.status).toBe(500);
//     expect(response.body).toEqual({ error: "Internal server error." });
//   });
});
