const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Interview = require("../models/Interview");
const InterviewQuestion = require("../models/InterviewQuestion");

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
        if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
  console.error("REGISTER ERROR:", error);
  res.status(500).json({
    message: "Registration failed",
    error: error.message,
  });
}
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

exports.deleteAccount = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id });

    const interviewIds = interviews.map((interview) => interview._id);

    await InterviewQuestion.deleteMany({
      interview: { $in: interviewIds },
    });

    await Interview.deleteMany({
      user: req.user._id,
    });

    await req.user.deleteOne();

    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete account",
    });
  }
};