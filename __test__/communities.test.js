const request = require("supertest");
const app = require("../src/app");
const db = require("./db");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("Community Rules Endpoint", () => {
  // it("should add a new rule to a community", async () => {
  //   const requestBody = {
  //     community_name: "community_2",
  //     rule_title: "Jest Rule 99",
  //     applies_to: "posts_only",
  //     report_reason: "Test Report Reason",
  //     full_description: "Test Description",
  //   };
  //   const response = await request("http://localhost:3000")
  //     .post("/communities/add-rule")
  //     .send(requestBody)
  //     .expect(200);
  //   expect(response.body).toEqual({ message: "OK" });
  // });

  it("should return error if community does not exist", async () => {
    const requestBody = {
      community_name: "nonexistent_community",
      rule_title: "Test Rule",
      applies_to: "Test Applies To",
      report_reason: "Test Report Reason",
      full_description: "Test Description",
    };

    const response = await request("http://localhost:3001")
      .post("/communities/add-rule")
      .send(requestBody)
      .expect(500);

    expect(response.body).toEqual({
      err: { status: 500, message: "community name does not exist " },
    });
  });
});
