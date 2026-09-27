const bcrypt = require("bcryptjs");
const Settings = require("../models/Settings.js");

module.exports = async function adminAuth(req, res, next) {
  const providedKey = req.get("x-admin-key");

  try {
    const settings = await Settings.findOne({});
    if (settings && settings.adminKeyHash) {
      const valid = providedKey && (await bcrypt.compare(providedKey, settings.adminKeyHash));
      if (!valid) return res.status(401).json({ error: "Invalid or missing admin key" });
      return next();
    }
  } catch (error) {
    console.error("adminAuth settings lookup failed:", error.message);
  }

  // No custom password set yet (or DB unreachable) — fall back to the env key.
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    if (process.env.NODE_ENV === "production") return res.status(503).json({ error: "ADMIN_API_KEY is not configured" });
    return next();
  }
  if (providedKey !== configuredKey) return res.status(401).json({ error: "Invalid or missing admin key" });
  next();
};
