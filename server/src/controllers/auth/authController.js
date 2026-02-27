const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedName = (name || "").trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.is_suspended) {
      return res
        .status(403)
        .json({
          message: "Your account has been suspended. Contact an administrator.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const rememberMe =
      req.body.rememberMe === true || req.body.rememberMe === "true";
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "1d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET CURRENT USER
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE PROFILE (NAME/EMAIL)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextName = (name || "").trim();
    const nextEmail = (email || "").trim();

    if (!nextName || !nextEmail) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    if (nextEmail !== user.email) {
      const existingEmail = await User.findOne({ where: { email: nextEmail } });
      if (existingEmail && existingEmail.id !== user.id) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    user.name = nextName;
    user.email = nextEmail;
    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// FORGOT PASSWORD (DIRECT RESET)
exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({
      password: await bcrypt.hash(newPassword, 10),
      reset_token: null,
      reset_token_expiry: null,
    });

    return res.json({ message: "Password reset successful. Please login." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      where: {
        reset_token: token,
      },
    });

    if (!user || user.reset_token_expiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
