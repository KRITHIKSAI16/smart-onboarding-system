const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");
const setupSocket = require("./socket/socketHandler");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const companyRoutes = require("./routes/companyRoutes");
const chatRoutes = require("./routes/chatRoutes");
const forumRoutes = require("./routes/forumRoutes");
const cohortRoutes = require("./routes/cohortRoutes");

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io accessible to controllers via req.app.get("io")
app.set("io", io);

// Initialize socket handlers
setupSocket(io);

// CONNECT DATABASE
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/cohorts", cohortRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Smart Onboarding API Running...");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});