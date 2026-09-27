const express = require("express");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const Settings = require("../models/Settings.js");
const adminAuth = require("../middleware/adminAuth.js");

const router = express.Router();
const uploadDirectory = path.join(__dirname, "..", "uploads", "branding");

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"].includes(file.mimetype)),
});

async function getOrCreateSettings() {
  let settings = await Settings.findOne({});
  if (!settings) settings = await Settings.create({});
  return settings;
}

function publicShape(settings) {
  return { companyName: settings.companyName, username: settings.username, logoUrl: settings.logoUrl };
}

// Public read — the login page and sidebar need the company name/logo before auth.
router.get("/", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(publicShape(settings));
  } catch (error) {
    res.status(500).json({ error: "Could not load settings" });
  }
});

router.put("/", adminAuth, async (req, res) => {
  try {
    const { companyName, username } = req.body;
    const settings = await getOrCreateSettings();
    if (companyName !== undefined) settings.companyName = String(companyName).trim().slice(0, 80) || settings.companyName;
    if (username !== undefined) settings.username = String(username).trim().slice(0, 80) || settings.username;
    settings.updatedAt = new Date();
    await settings.save();
    res.json(publicShape(settings));
  } catch (error) {
    res.status(400).json({ error: "Could not update settings" });
  }
});

router.post("/logo", adminAuth, upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "A JPG, PNG, WebP, GIF or SVG image is required" });
    const relativeUrl = `/uploads/branding/${req.file.filename}`;
    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const settings = await getOrCreateSettings();
    settings.logoUrl = `${baseUrl}${relativeUrl}`;
    settings.updatedAt = new Date();
    await settings.save();
    res.status(201).json({ logoUrl: settings.logoUrl });
  } catch (error) {
    res.status(400).json({ error: "Logo upload failed" });
  }
});

router.put("/password", adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const settings = await getOrCreateSettings();
    const configuredKey = process.env.ADMIN_API_KEY;
    const currentValid = settings.adminKeyHash
      ? await bcrypt.compare(currentPassword || "", settings.adminKeyHash)
      : currentPassword === configuredKey;
    if (!currentValid) return res.status(401).json({ error: "Current password is incorrect" });

    settings.adminKeyHash = await bcrypt.hash(String(newPassword), 10);
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(400).json({ error: "Could not update password" });
  }
});

module.exports = router;
