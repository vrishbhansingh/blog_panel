import React, { useState, useEffect } from "react";
import api from "../api";
import { Editor } from "@tinymce/tinymce-react";
import "../tinymceSetup";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "/api";

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeyword, setMetaKeyword] = useState("");

  const [websiteId, setWebsiteId] = useState("");
  const [websites, setWebsites] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  // Fetch websites
  useEffect(() => {
    api
      .get(`${API_BASE}/websites/all`)
      .then((res) => setWebsites(res.data.websites))
      .catch((err) => console.error(err));
  }, []);

  // Fetch blog categories (all, so an already-assigned but now-inactive
  // category still shows correctly when editing this blog)
  useEffect(() => {
    api
      .get(`${API_BASE}/blog-categories`)
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch blog details
  useEffect(() => {
  api
    .get(`${API_BASE}/blogs/${id}`)
    .then((res) => {
      const b = res.data;

      // 🚫 If blog is NOT from allowed websites → block it
      // ✅ Otherwise allow and set states
      setTitle(b.title);
      setSlug(b.slug);
      setContent(b.content);
      setMetaTitle(b.metaTitle);
      setMetaDescription(b.metaDescription);
      setMetaKeyword(b.metaKeyword);
      setWebsiteId(b.websiteId?._id || b.websiteId);
      setCategoryId(b.categoryId?._id || b.categoryId || "");
      setImages(b.images || []);

      setLoading(false);
    })
    .catch((err) => console.error(err));
}, [id]);


  // Upload new image
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post(`${API_BASE}/blogs/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = res.data.url;

      setImages((prev) => [...prev, imageUrl]);
      setContent((prev) => prev + `<img src="${imageUrl}" alt="Blog Image" />`);
    } catch (err) {
      console.error(err);
    }
  };

  // Remove image
  const removeImage = (img) => {
    setImages(images.filter((i) => i !== img));
  };

  // Update blog
  const handleUpdate = async () => {
    if (!title || !content || !websiteId || !categoryId) {
      alert("Please fill all required fields, including category");
      return;
    }

    const payload = {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      metaKeyword,
      websiteId,
      categoryId,
      images,
    };

    try {
      await api.put(`${API_BASE}/blogs/update/${id}`, payload);
      alert("Blog Updated Successfully!");
    } catch (err) {
      console.error(err);
      alert("Error while updating blog!");
    }
  };

  // DELETE BLOG
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this blog? This action cannot be undone!"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`${API_BASE}/blogs/delete/${id}`);
      alert("Blog deleted successfully!");

      // Redirect to blog list (change route as per your project)
      navigate("/edit-blog");
    } catch (err) {
      console.error(err);
      alert("Error deleting blog!");
    }
  };

  if (loading) return <h3>Loading Blog...</h3>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>Edit Blog</h2>

      {/* Title */}
      <label>Blog Title *</label>
      <input
        className="form-control mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Slug */}
      <label>Slug</label>
      <input
        className="form-control mb-3"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      {/* Website Select */}
      <label>Select Website *</label>
      <select
        className="form-control mb-3"
        value={websiteId}
        onChange={(e) => setWebsiteId(e.target.value)}
      >
        <option value="">Choose Website</option>
         {websites.map((w) => (
          <option key={w._id} value={w._id}>
            {w.name}
          </option>
        ))}
      </select>

      {/* Category Select */}
      <label>Category *</label>
      <select
        className="form-control mb-3"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">Choose Category</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}{c.status === "inactive" ? " (inactive)" : ""}
          </option>
        ))}
      </select>

      {/* Meta Title */}
      <label>Meta Title</label>
      <input
        className="form-control mb-3"
        value={metaTitle}
        onChange={(e) => setMetaTitle(e.target.value)}
      />

      {/* Meta Description */}
      <label>Meta Description</label>
      <textarea
        className="form-control mb-3"
        value={metaDescription}
        onChange={(e) => setMetaDescription(e.target.value)}
      ></textarea>

      {/* Meta Keywords */}
      <label>Meta Keyword</label>
      <textarea
        className="form-control mb-3"
        value={metaKeyword}
        onChange={(e) => setMetaKeyword(e.target.value)}
      ></textarea>

      {/* Existing Images */}
      <label>Existing Images</label>
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "15px",
        }}
      >
        {images.map((img) => (
          <div key={img} style={{ position: "relative" }}>
            <img src={img} alt="Blog upload" width="120" style={{ borderRadius: 5 }} />

            <button
              onClick={() => removeImage(img)}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: "red",
                color: "white",
                border: "none",
                padding: "2px 6px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Upload new image */}
      <label>Upload New Image</label>
      <input
        type="file"
        className="form-control mb-3"
        onChange={handleImageUpload}
      />

      {/* Editor */}
      <label>Blog Content *</label>
      <Editor
        licenseKey="gpl"
        value={content}
        init={{
          height: 500,
          menubar: true,
          plugins: [
            "link",
            "lists",
            "image",
            "table",
            "code",
            "autolink",
            "preview",
            "anchor",
            "fullscreen",
            "searchreplace",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | bold italic underline | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | link image table | code preview fullscreen",
        }}
        onEditorChange={(newContent) => setContent(newContent)}
      />

      {/* Buttons */}
      <div className="d-flex gap-3 mt-4">
        <button className="btn btn-primary" onClick={handleUpdate}>
          Update Blog
        </button>

        <button className="btn btn-danger" onClick={handleDelete}>
          Delete Blog
        </button>
      </div>
    </div>
  );
};

export default EditBlog;
