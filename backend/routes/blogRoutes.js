const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const Blog = require("../models/Blog.js");
const Website = require("../models/Website.js");
const BlogCategory = require("../models/BlogCategory.js");
const adminAuth = require("../middleware/adminAuth.js");

const router = express.Router();
const uploadDirectory = path.join(__dirname, "..", "uploads", "blogs");

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)),
});

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function handleError(res, error) {
  if (error.code === 11000) return res.status(409).json({ error: "This slug already exists for the selected website" });
  if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Server error" });
}

// Adds a normalized `category` object ({ id, name, slug }) to a blog while
// keeping every existing field (including the populated categoryId) intact.
function withCategory(blogDoc) {
  if (!blogDoc) return blogDoc;
  const blog = blogDoc.toObject ? blogDoc.toObject() : blogDoc;
  const cat = blog.categoryId;
  blog.category = cat && cat.name ? { id: cat._id, name: cat.name, slug: cat.slug } : null;
  return blog;
}

const CATEGORY_POPULATE = { path: "categoryId", select: "name slug status" };

async function requireCategoryId(categoryId) {
  if (!categoryId) return "Category is required";
  const category = await BlogCategory.findById(categoryId).catch(() => null);
  if (!category) return "Valid categoryId is required";
  return null;
}

router.post("/create", adminAuth, async (req, res) => {
  try {
    const website = await Website.findById(req.body.websiteId);
    if (!website) return res.status(400).json({ error: "Valid websiteId is required" });
    const categoryError = await requireCategoryId(req.body.categoryId);
    if (categoryError) return res.status(400).json({ error: categoryError });
    const payload = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    if (payload.status === "published") payload.publishedAt = new Date();
    let blog = await Blog.create(payload);
    blog = await blog.populate(CATEGORY_POPULATE);
    res.status(201).json({ message: "Blog created successfully", blog: withCategory(blog) });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/upload-image", adminAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "A JPG, PNG, WebP or GIF image is required" });
  const relativeUrl = `/uploads/blogs/${req.file.filename}`;
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  res.status(201).json({ url: `${baseUrl}${relativeUrl}`, relativeUrl });
});

// Admin list; in production this requires x-admin-key.
router.get("/", adminAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.websiteId) filter.websiteId = req.query.websiteId;
    if (req.query.category) {
      const category = await BlogCategory.findOne({ slug: req.query.category.toLowerCase() });
      if (!category) return res.json([]);
      filter.categoryId = category._id;
    }
    const blogs = await Blog.find(filter).populate("websiteId", "name domain platform").populate(CATEGORY_POPULATE).sort({ createdAt: -1 });
    res.json(blogs.map(withCategory));
  } catch (error) {
    handleError(res, error);
  }
});

// Public feed used by coded sites and WordPress integrations.
router.get("/public/:domain", async (req, res) => {
  try {
    const domain = req.params.domain.replace(/^www\./i, "").toLowerCase();
    const website = await Website.findOne({ domain, active: { $ne: false } });
    if (!website) return res.status(404).json({ error: "Website not found" });
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const filter = { websiteId: website._id, status: "published" };
    if (req.query.category) {
      const category = await BlogCategory.findOne({ slug: req.query.category.toLowerCase() });
      if (!category) return res.json({ website, blogs: [], pagination: { page, limit, total: 0, pages: 0 } });
      filter.categoryId = category._id;
    }
    if (req.query.search) {
      const term = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: term, $options: "i" };
    }
    const [blogs, total] = await Promise.all([
      Blog.find(filter).populate(CATEGORY_POPULATE).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Blog.countDocuments(filter),
    ]);
    res.json({ website, blogs: blogs.map(withCategory), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/public/:domain/:slug", async (req, res) => {
  try {
    const domain = req.params.domain.replace(/^www\./i, "").toLowerCase();
    const website = await Website.findOne({ domain, active: { $ne: false } });
    if (!website) return res.status(404).json({ error: "Website not found" });
    const blog = await Blog.findOne({ websiteId: website._id, slug: req.params.slug.toLowerCase(), status: "published" })
      .populate(CATEGORY_POPULATE)
      .populate("relatedProducts", "name image price slug shortDescription")
      .populate("relatedBlogs", "title slug featuredImage");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ website, blog: withCategory(blog) });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/website/:websiteId", async (req, res) => {
  try {
    const filter = { websiteId: req.params.websiteId, status: "published" };
    if (req.query.category) {
      const category = await BlogCategory.findOne({ slug: req.query.category.toLowerCase() });
      if (!category) return res.json([]);
      filter.categoryId = category._id;
    }
    const blogs = await Blog.find(filter).populate(CATEGORY_POPULATE).sort({ publishedAt: -1, createdAt: -1 });
    res.json(blogs.map(withCategory));
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const filter = { slug: req.params.slug.toLowerCase(), status: "published" };
    if (req.query.websiteId) filter.websiteId = req.query.websiteId;
    const blog = await Blog.findOne(filter).populate(CATEGORY_POPULATE);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(withCategory(blog));
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/update/:id", adminAuth, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.categoryId) {
      const categoryError = await requireCategoryId(payload.categoryId);
      if (categoryError) return res.status(400).json({ error: categoryError });
    }
    if (payload.slug || payload.title) payload.slug = slugify(payload.slug || payload.title);
    if (payload.status === "published") payload.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate(CATEGORY_POPULATE);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog updated", blog: withCategory(blog) });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/delete/:id", adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/:id", adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("websiteId", "name domain platform").populate(CATEGORY_POPULATE).populate("relatedProducts", "name image").populate("relatedBlogs", "title slug");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(withCategory(blog));
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
