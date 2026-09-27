const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: "MMW Machine", trim: true, maxlength: 80 },
  username: { type: String, default: "Administrator", trim: true, maxlength: 80 },
  logoUrl: { type: String, default: "" },
  adminKeyHash: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Settings", SettingsSchema);
