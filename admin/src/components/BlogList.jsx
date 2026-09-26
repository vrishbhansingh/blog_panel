import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

const API_BASE = "/api";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);

  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [searchText, setSearchText] = useState("");
  const [actionId, setActionId] = useState("");
  const [message, setMessage] = useState("");


  // Load blogs + websites
  useEffect(() => {
    fetchBlogs();
    fetchWebsites();
  }, []);

  const fetchBlogs = () => {
    api
      .get(`${API_BASE}/blogs`)
      .then((res) => {
        // Keep ONLY allowed blogs
        setBlogs(res.data);
        setFilteredBlogs(res.data);
      })
      .catch((err) => console.error(err));
  };

  const fetchWebsites = () => {
    api
      .get(`${API_BASE}/websites/all`)
      .then((res) => {
        // Keep ONLY allowed websites
        const allowed = res.data.websites;

        setWebsites(allowed);

        // Auto-select the first allowed website
        if (allowed.length > 0) {
          setSelectedWebsite(allowed[0]._id);
        }
      })
      .catch((err) => console.error(err));
  };

  const hideFromWebsite = async (blog) => {
    if (!window.confirm(`Hide "${blog.title}" from the public website? It will remain saved as a draft.`)) return;
    try {
      setActionId(blog._id);
      setMessage("");
      await api.put(`${API_BASE}/blogs/update/${blog._id}`, { status: "draft" });
      setMessage("Blog website se hide ho gaya hai aur Draft me safe hai.");
      fetchBlogs();
    } catch (error) {
      setMessage(error.response?.data?.error || "Blog hide nahi ho saka.");
    } finally {
      setActionId("");
    }
  };

  const deletePermanently = async (blog) => {
    if (!window.confirm(`Permanently delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      setActionId(blog._id);
      setMessage("");
      await api.delete(`${API_BASE}/blogs/delete/${blog._id}`);
      setMessage("Blog permanently delete ho gaya hai.");
      fetchBlogs();
    } catch (error) {
      setMessage(error.response?.data?.error || "Blog delete nahi ho saka.");
    } finally {
      setActionId("");
    }
  };

  // Filter blogs based on website + search
  useEffect(() => {
    let data = blogs;

    // Filter by website
    if (selectedWebsite) {
      data = data.filter((b) => (b.websiteId?._id || b.websiteId) === selectedWebsite);
    }

    // Search filter
    if (searchText.trim() !== "") {
      data = data.filter((b) =>
        b.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredBlogs(data);
  }, [selectedWebsite, searchText, blogs]);

  return (
    <div className="container mt-4 blog-library-page">
      <h2>Blogs</h2>

      {message && <div className="alert alert-info mt-3">{message}</div>}

      {/* Filters */}
      <div className="row mt-3 mb-4">
        {/* Website Filter */}
        <div className="col-md-3">
          <label>Filter by Website</label>
          <select
            className="form-control"
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
          >
            {websites.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Filter */}
        <div className="col-md-3">
          <label>Search Blog</label>
          <input
            className="form-control"
            placeholder="Search by blog title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Reset */}
        <div className="col-md-3 d-flex align-items-end">
          <button
            className="btn btn-secondary w-100"
            onClick={() => {
              if (websites.length > 0) {
                setSelectedWebsite(websites[0]._id); // Reset to first allowed website
              }
              setSearchText("");
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Blog Table */}
      <div className="blog-table-scroll"><table className="table table-bordered blog-library-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Slug</th>
            <th>Category</th>
            <th>Website</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredBlogs.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center">No blogs found</td>
            </tr>
          ) : (
            filteredBlogs.map((blog) => (
              <tr key={blog._id}>
                <td>{blog.featuredImage ? <img className="blog-library-thumb" src={blog.featuredImage} alt={blog.featuredImageAlt || blog.title} /> : <span className="no-blog-image">No image</span>}</td>
                <td>{blog.title}</td>
                <td>{blog.slug}</td>
                <td>{blog.category?.name || "—"}</td>
                <td>{blog.websiteId?.name || websites.find((w) => w._id === blog.websiteId)?.name}</td>
                <td>
                  <span className={`badge ${blog.status === "published" ? "bg-success" : "bg-secondary"}`}>
                    {blog.status || "draft"}
                  </span>
                </td>
                <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                <td><div className="blog-row-actions">
                  <Link
                    to={`/edit-blog/${blog._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Edit
                  </Link>
                  {blog.status === "published" && (
                    <button
                      type="button"
                      className="btn btn-warning btn-sm ms-2"
                      disabled={actionId === blog._id}
                      onClick={() => hideFromWebsite(blog)}
                    >
                      Hide from website
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm ms-2"
                    disabled={actionId === blog._id}
                    onClick={() => deletePermanently(blog)}
                  >
                    Delete permanently
                  </button>
                </div></td>
              </tr>
            ))
          )}
        </tbody>
      </table></div>
    </div>
  );
};

export default BlogList;
