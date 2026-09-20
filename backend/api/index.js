// file for creation and configuration oof express app

require("dotenv").config();

const express = require("express");

const cors = require("cors"); // for communication between frontend and backend

const connectDB = require("../config/db");  

const authRoutes = require("../routes/authRoutes");
const interviewRoutes = require("../routes/interviewRoutes");

const app = express(); 
connectDB(); // DB Connection


//middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());


//routes 
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);

app.get("/", (req, res) => {
  res.send("InterviewForge API Running");
});

module.exports = app;