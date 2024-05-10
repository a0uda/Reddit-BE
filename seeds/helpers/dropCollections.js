import mongoose from "mongoose";

const url =
  "mongodb+srv://ahmedabdelgawad011:BackendReddit@cluster0.workift.mongodb.net/?retryWrites=true&w=majority";

export async function dropCollections() {
  try {
    console.log("Conneting to db");
    await mongoose.connect(url);
    console.log("Connected to db");

    console.log("The collections are");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(collections);

    for (const { name } of collections) {
      if (name === "users" || name === "tokens") {
        console.log(`Skipping ${name} collection`);
        continue;
      }

      console.log(`Dropping collection: ${name}`);
      await mongoose.connection.collection(name).drop();
    }
  } catch (error) {
    console.error("Error dropping collections:", error);
  } finally {
    mongoose.connection.close();
  }
}
