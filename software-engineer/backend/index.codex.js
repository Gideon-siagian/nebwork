require("dotenv").config();

const dns = require("dns");
const mongoose = require("mongoose");

const connectDB = require("./src/config/db");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missing.join(", ")}`);
  console.error("Please set these in your local or deployment environment variables.");
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 5001;
let server;

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");

      try {
        await mongoose.connection.close(false);
        console.log("MongoDB connection closed.");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    });
  }

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

const startServer = async () => {
  await connectDB();

  const app = require("./app");

  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
