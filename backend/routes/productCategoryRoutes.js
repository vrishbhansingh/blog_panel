const express = require("express");
const ProductCategory = require("../models/ProductCategory.js");
const Product = require("../models/Product.js");
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

// Create a product category
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, slug, status } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });
    const category = await ProductCategory.create({ name, slug: slugify(slug || name), status: status || "active" });
    res.status(201).json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// List product categories; ?status=active to filter, ?search= to search by name
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };
    const categories = await ProductCategory.find(filter).sort({ createdAt: 1 });
    res.json(categories);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// Update a product category
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.slug || updates.name) updates.slug = slugify(updates.slug || updates.name);
    const category = await ProductCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// Delete a product category, but only when no product currently uses it
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const inUse = await Product.exists({ category: req.params.id });
    if (inUse) return res.status(409).json({ error: "This category is used by existing products and cannot be deleted" });
    const category = await ProductCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
