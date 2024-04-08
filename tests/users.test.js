const request = require("supertest");
const app = require("../src/app");
const db = require("./db");
const userAuth = require("../src/controller/userAuth");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("User Login Endpoint", () => {
  it("should login a user with correct credentials", async () => {
    const userData = {
      username: "malak12345",
      password: "malak123",
    };
    await userAuth.loginUser(userData);

    const response = await request("http://localhost:3001")
      .post("/users/login")
      .send(userData)
      .expect(200);

    expect(response.header.authorization).toBeDefined();
    expect(response.header.refreshtoken).toBeDefined();
    expect(response.body.username).toBe(userData.username);
  });

  it("should return 400 with incorrect credentials", async () => {
    const response = await request("http://localhost:3001")
      .post("/users/login")
      .send({ username: "invaliduser", password: "invalidpassword" })
      .expect(400);

    expect(response.body).toEqual({
      err: "Username or password are incorrect",
    });
  });
});
