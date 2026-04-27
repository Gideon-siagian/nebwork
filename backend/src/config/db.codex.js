const dns = require("dns");
const mongoose = require("mongoose");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async (retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${attempt}/${retries})...`);

      const conn = await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 15,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      });

      console.log(`MongoDB connected: ${conn.connection.host}`);

      mongoose.connection.on("error", (error) => {
        console.error("MongoDB connection error:", error.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected. Will attempt to reconnect automatically...");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconnected successfully");
      });

      return conn;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);

      if (attempt < retries) {
        const delay = attempt * 2000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(`All MongoDB connection attempts failed: ${error.message}`);
    }
  }

  throw new Error("Failed to initialize MongoDB connection.");
};

module.exports = connectDB;
