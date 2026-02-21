const express = require("express");
require("dotenv").config();
const app = express();
const connectDB = require("./config/databse");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());

// ==========================================
// 🕵️‍♂️ TRAP 1: THE GLOBAL SNIFFER
// Placed before CORS to prove the request actually arrives
// ==========================================
app.use((req, res, next) => {
  console.log(`[SNIFFER] ➡️  ${req.method} ${req.url} (Origin: ${req.headers.origin})`);
  next();
});

// CORS: allow local dev origins and optional env override
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow same-origin/non-browser requests
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
// middleware

// root route
app.get("/", (req, res) => {
  res.send("Hello");
});

const authRouter = require("./routes/auth");
const groupsRouter = require("./routes/groups");
const runRouter = require("./routes/run");
const problemsRouter = require("./routes/problems");
const contestsRouter = require("./routes/contests");
const chatRouter = require("./routes/chat");
const submitRouter = require("./routes/submit");
const usersRouter = require("./routes/users");

app.use("/", authRouter);
app.use("/code", runRouter);
app.use("/code", submitRouter);
app.use("/groups", groupsRouter);
app.use("/problems", problemsRouter);
app.use("/contests", contestsRouter);
app.use("/api/chat", chatRouter);

// ==========================================
// 🚨 TRAP 2: THE GLOBAL ERROR CATCHER
// Placed after all routes to catch silent crashes (like CORS)
// ==========================================
app.use((err, req, res, next) => {
  console.error("🚨 GLOBAL EXPRESS ERROR CAUGHT:", err.message);
  res.status(500).json({ 
    success: false, 
    message: "App.js Crash: " + err.message 
  });
});

app.use("/users", usersRouter);
// connect DB then start server
connectDB()
  .then(() => {
    console.log("DB connection Success");

    const PORT = 7777;
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
  });