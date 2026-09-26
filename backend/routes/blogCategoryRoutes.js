const express = require("express");
const BlogCategory = require("../models/BlogCategory.js");
const Blog = require("../models/Blog.js");
const adminAuth = require("../middleware/adminAuth.js");

const router = express.Router();

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function handleError(res, error) {
  if (error.code === 11000) return res.status(409).json({ error: "This slug already exists" });
  if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Server error" });
}

// Create a blog category
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, slug, status } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });
    const category = await BlogCategory.create({ name, slug: slugify(slug || name), status: status || "active" });
    res.status(201).json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// List blog categories; ?status=active to filter, ?search= to search by name
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };
    const categories = await BlogCategory.find(filter).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// Update a blog category
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.slug || updates.name) updates.slug = slugify(updates.slug || updates.name);
    const category = await BlogCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// Delete a blog category, but only when no blog currently uses it
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const inUse = await Blog.exists({ categoryId: req.params.id });
    if (inUse) return res.status(409).json({ error: "This category is used by existing blogs and cannot be deleted" });
    const category = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
