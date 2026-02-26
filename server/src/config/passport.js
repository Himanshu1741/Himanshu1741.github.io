const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

// ─── Google Strategy (only if credentials are present) ───────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email)
            return done(new Error("No email returned from Google"), null);

          let user = await User.findOne({ where: { email } });

          if (!user) {
            user = await User.create({
              name: profile.displayName || email.split("@")[0],
              email,
              password: Math.random().toString(36).slice(-16),
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}

// ─── GitHub Strategy (only if credentials are present) ───────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = (
            profile.emails?.find((e) => e.primary)?.value ||
            profile.emails?.[0]?.value ||
            `${profile.username}@github.com`
          ).toLowerCase();

          let user = await User.findOne({ where: { email } });

          if (!user) {
            user = await User.create({
              name:
                profile.displayName || profile.username || email.split("@")[0],
              email,
              password: Math.random().toString(36).slice(-16),
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}

module.exports = passport;
