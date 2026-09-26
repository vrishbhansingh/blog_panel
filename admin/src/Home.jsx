import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";

const Home = () => {
  const [data, setData] = useState({ websites: [], blogs: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/api/websites/all"), api.get("/api/blogs")])
      .then(([sites, blogs]) => setData({ websites: sites.data.websites || [], blogs: blogs.data || [] }))
      .catch((err) => setError(err.response?.data?.error || "Dashboard data could not be loaded"));
  }, []);

  const published = data.blogs.filter((blog) => blog.status === "published").length;
  const drafts = data.blogs.filter((blog) => blog.status !== "published").length;
  const recent = data.blogs.slice(0, 5);

  return (
    <div className="page-wrap">
      <header className="page-head"><div><span className="eyebrow">CONTENT COMMAND CENTER</span><h1>Good work starts with a clear view.</h1><p>Manage every website, publication and SEO setting from one workspace.</p></div><Link className="primary-action" to="/add-blog">+ Create blog</Link></header>
      {error && <div className="notice error">{error}</div>}
      <section className="metric-grid">
        <article className="metric-card accent"><span>Active websites</span><strong>{data.websites.length}</strong><small>Connected properties</small></article>
        <article className="metric-card"><span>Published</span><strong>{published}</strong><small>Live articles</small></article>
        <article className="metric-card"><span>Drafts</span><strong>{drafts}</strong><small>Awaiting review</small></article>
        <article className="metric-card"><span>SEO coverage</span><strong>{data.blogs.length ? Math.round((data.blogs.filter((b) => b.metaTitle && b.metaDescription).length / data.blogs.length) * 100) : 0}%</strong><small>Metadata completed</small></article>
      </section>
      <section className="dashboard-grid">
        <article className="panel"><div className="panel-head"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Latest content</h2></div><Link to="/edit-blog">View all</Link></div>
          <div className="content-list">{recent.length ? recent.map((blog) => <div className="content-row" key={blog._id}><div className="content-dot">{blog.title?.charAt(0)}</div><div><strong>{blog.title}</strong><small>{blog.websiteId?.name || "Website"} · {new Date(blog.createdAt).toLocaleDateString()}</small></div><span className={`status ${blog.status || "draft"}`}>{blog.status || "draft"}</span></div>) : <div className="empty-state">No content yet. Create your first blog.</div>}</div>
        </article>
        <article className="panel quick-panel"><span className="eyebrow">QUICK ACTIONS</span><h2>Move faster</h2><Link to="/websites">Configure a website <b>→</b></Link><Link to="/add-blog">Write a new article <b>→</b></Link><Link to="/add-product">Add a product <b>→</b></Link><Link to="/categories">Organize categories <b>→</b></Link></article>
      </section>
    </div>
  );
};

export default Home;
