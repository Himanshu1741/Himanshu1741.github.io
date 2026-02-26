const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");
const authController = require("../controllers/auth/authController");
const authMiddleware = require("../middleware/authMiddleware");

// ─── Email / Password ─────────────────────────────────────────────────────────
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get("/me", authMiddleware, authController.me);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/password", authMiddleware, authController.changePassword);

// ─── Helper: build JWT redirect URL ──────────────────────────────────────────
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

function oauthCallback(req, res) {
  const user = req.user;
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  const userData = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }),
  );
  res.redirect(`${CLIENT_URL}/login?token=${token}&user=${userData}`);
}

function notConfigured(provider) {
  return (_req, res) =>
    res.redirect(`${CLIENT_URL}/login?error=${provider}_not_configured`);
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    }),
  );
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${CLIENT_URL}/login?error=google_failed`,
    }),
    oauthCallback,
  );
} else {
  router.get("/google", notConfigured("google"));
  router.get("/google/callback", notConfigured("google"));
}

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"], session: false }),
  );
  router.get(
    "/github/callback",
    passport.authenticate("github", {
      session: false,
      failureRedirect: `${CLIENT_URL}/login?error=github_failed`,
    }),
    oauthCallback,
  );
} else {
  router.get("/github", notConfigured("github"));
  router.get("/github/callback", notConfigured("github"));
}

module.exports = router;
