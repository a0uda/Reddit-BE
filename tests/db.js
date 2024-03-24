// tests/db-handler.js

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongod = new MongoMemoryServer();

/**
 * Connect to the in-memory database.
 */

module.exports.connect = async () => {
  if (!mongod.isRunning) {
    // Start the server if it's not already running
    await mongod.start();
  }

  const uri = mongod.getUri(); // Use getUri() directly without awaiting

  await mongoose.connect(uri);
};

/**
 * Drop database, close the connection and stop mongod.
 */
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

/**
 * Remove all the data for all db collections.
 */
module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};
