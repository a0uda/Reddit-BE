require("./config/app");

run();
async function run() {
  const user = new User({
    // name: "Ahmed",
    // age: 22,
    // hobbies: ["Running", "Sleeping"],
    // address: { country: "Egypt" },
    // email: "asfasfs",
  });
  await user.save();
  console.log(user);
}