require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const categoryRoutes = require("./routes/categoryRoutes.js");
const productRoutes = require("./routes/productRoutes.js");
const productCategoryRoutes = require("./routes/productCategoryRoutes.js");
const accPriceRoutes = require("./routes/accpriceRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");
const blogCategoryRoutes = require("./routes/blogCategoryRoutes.js");
const websiteRoutes = require("./routes/websiteRoutes.js");
const inquiryRoutes = require("./routes/inquiryRoutes.js");
const settingsRoutes = require("./routes/settingsRoutes.js");
const Website = require("./models/Website.js");
const Blog = require("./models/Blog.js");

const app = express();
const PORT = process.env.PORT || 5014;
app.set("trust proxy", true);

app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((value) => value.trim())
    : "*",
}));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/api/product-categories", productCategoryRoutes);
app.use("/accprice", accPriceRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/blog-categories", blogCategoryRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true, database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// When the website domain proxies these two paths to this server, visitors and
// search engines get the conventional URLs: https://example.com/sitemap.xml
// and https://example.com/robots.txt. The /api/websites/public/... versions
// remain available for sites that cannot configure a reverse proxy.
const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;" }[char]));
const requestDomain = (req) => String(req.hostname || "").replace(/^www\./i, "").toLowerCase();
const getHostedWebsite = (req) => Website.findOne({ domain: requestDomain(req), active: { $ne: false } });

app.get("/robots.txt", async (req, res, next) => {
  try {
    const website = await getHostedWebsite(req);
    if (!website) return next();
    const robots = website.technical?.robotsTxt || "User-agent: *\nAllow: /";
    res.type("text/plain").send(`${robots.trim()}\nSitemap: https://${website.domain}/sitemap.xml\n`);
  } catch (error) { next(error); }
});

app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const website = await getHostedWebsite(req);
    if (!website) return next();
    const blogPath = (website.technical?.blogPath || "/blog").replace(/\/$/, "");
    const blogs = website.technical?.includeBlogsInSitemap === false ? [] : await Blog.find({
      websiteId: website._id, status: "published", robotsIndex: { $ne: "noindex" },
    }).select("slug createdAt publishedAt updatedAt").sort({ publishedAt: -1 });
    const urls = [
      `<url><loc>https://${escapeXml(website.domain)}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
      ...blogs.map((blog) => `<url><loc>https://${escapeXml(website.domain)}${blogPath}/${escapeXml(blog.slug)}</loc><lastmod>${(blog.updatedAt || blog.publishedAt || blog.createdAt).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
    ].join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  } catch (error) { next(error); }
});

// Serves the built admin panel (admin/build copied here as "public") from the same
// Node app, so shared hosting only needs one app/one domain for panel + API.
const adminBuildPath = path.join(__dirname, "public");
if (require("fs").existsSync(path.join(adminBuildPath, "index.html"))) {
  app.use(express.static(adminBuildPath));
  app.get(/^(?!\/(api|uploads|categories|products|accprice|health)\b).*/, (req, res) => {
    res.sendFile(path.join(adminBuildPath, "index.html"));
  });
}

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Copy .env.example to .env and add the Atlas URI.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    // Drops indexes no longer declared on a model (e.g. the old global-unique
    // slug index, replaced by a per-website one) and creates any new ones.
    await require("./models/BlogCategory.js").syncIndexes();
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}

start();
