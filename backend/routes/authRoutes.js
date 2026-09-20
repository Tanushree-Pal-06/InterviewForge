const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.delete("/delete-account", protect, deleteAccount);


module.exports = router;