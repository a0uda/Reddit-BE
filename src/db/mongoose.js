import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const url = String(process.env.MONGODB_URL);
//const url = String(secrets.MONGODB_URL);
export async function connect_to_db() {
  console.log("url using secrets");
  console.log(process.env.MONGODB_URL);
  await mongoose.connect(url);
  console.log("Connected to db");
}
