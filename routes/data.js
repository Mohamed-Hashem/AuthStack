const express = require("express");
const bcrypt = require("bcryptjs");
const { verifyToken } = require("../middleware/auth");
const User = require("../models/User");
const { validateProfileUpdate } = require("../utils/validation");
const { formatUserResponse, handleError } = require("../utils/helpers");
const router = express.Router();

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User profile retrieved successfully",
      user: formatUserResponse(user),
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;

    const errors = validateProfileUpdate({ first_name, last_name, age });

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          age: parseInt(age, 10),
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: formatUserResponse(user),
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.get("/stats", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const createdDate = user.createdAt ? new Date(user.createdAt) : new Date();
    const accountAge = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));

    const stats = {
      accountAge: accountAge >= 0 ? accountAge : 0,
      memberSince: user.createdAt || new Date(),
      lastUpdated: user.updatedAt || new Date(),
    };

    res.json({
      message: "User statistics retrieved successfully",
      stats,
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must differ from current password" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
