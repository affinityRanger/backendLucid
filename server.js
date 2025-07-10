// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");

// Load environment variables from .env
dotenv.config();

// Import middlewares
const { errorHandler } = require("./middleware/errorMiddleware");

// Import route files
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const listingRoutes = require("./routes/listingsRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ----------- Middleware -----------
app.use(cors());
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: false })); // Parse form-encoded data
app.use(morgan("dev")); // Log HTTP requests

// ----------- Serve Static Files -----------
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images

// ----------- API Routes -----------
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/community", communityRoutes);

// ----------- Global Error Handler -----------
app.use(errorHandler); // Should always be last

// ----------- Connect to MongoDB & Start Server -----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit process if connection fails
  });
