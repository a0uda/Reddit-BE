import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongod = new MongoMemoryServer();

module.exports.connect = async () => {
  if (!mongod.isRunning) {
    await mongod.start();
  }
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};
