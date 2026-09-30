import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const blankForm = { name: "", slug: "", status: "active" };
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const BlogCategoryManager = () => {
  const [websites, setWebsites] = useState([]);
  const [websiteId, setWebsiteId] = useState("");
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/websites/all")
      .then(({ data }) => {
        setWebsites(data.websites || []);
        setWebsiteId((current) => current || data.websites?.[0]?._id || "");
      })
      .catch(() => setNotice("Could not load websites"));
  }, []);

  const loadCategories = async () => {
    if (!websiteId) { setCategories([]); return; }
    const { data } = await api.get("/api/blog-categories", { params: { websiteId } });
    setCategories(data || []);
  };

  useEffect(() => {
    resetForm();
    if (websiteId) loadCategories().catch(() => setNotice("Could not load blog categories"));
  }, [websiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((item) => item.name.toLowerCase().includes(term) || item.slug.toLowerCase().includes(term));
  }, [categories, search]);

  const startEdit = (category) => {
    setEditingId(category._id);
    setForm({ name: category.name, slug: category.slug, status: category.status });
    setNotice("");
  };

  const resetForm = () => { setEditingId(null); setForm(blankForm); };

  const handleNameChange = (value) => setForm((current) => ({ ...current, name: value, slug: editingId ? current.slug : slugify(value) }));

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) { setNotice("Category name is required"); return; }
    if (!websiteId) { setNotice("Choose a website first"); return; }
    setSaving(true); setNotice("");
    try {
      const payload = { name: form.name.trim(), slug: slugify(form.slug || form.name), status: form.status, websiteId };
      if (editingId) {
        const { data } = await api.put(`/api/blog-categories/${editingId}`, payload);
        setCategories((items) => items.map((item) => (item._id === editingId ? data : item)));
        setNotice("Category updated successfully");
      } else {
        const { data } = await api.post("/api/blog-categories", payload);
        setCategories((items) => [...items, data]);
        setNotice("Category added successfully");
      }
      resetForm();
    } catch (error) {
      setNotice(error.response?.data?.error || "Category could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setSaving(true); setNotice("");
    try {
      await api.delete(`/api/blog-categories/${category._id}`);
      setCategories((items) => items.filter((item) => item._id !== category._id));
      if (editingId === category._id) resetForm();
      setNotice("Category deleted successfully");
    } catch (error) {
      setNotice(error.response?.data?.error || "Category could not be deleted");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <header className="page-head">
        <div>
          <span className="eyebrow">CONTENT TAXONOMY</span>
          <h1>Blog Categories</h1>
          <p>Each website has its own category list. Choose a website to manage its categories.</p>
        </div>
        <select value={websiteId} onChange={(e) => setWebsiteId(e.target.value)} style={{ height: "fit-content" }}>
          <option value="">Choose website</option>
          {websites.map((site) => <option key={site._id} value={site._id}>{site.name}</option>)}
        </select>
      </header>
      {notice && <div className="notice">{notice}</div>}
      {!websiteId && <div className="empty-state">Choose a website above to see and manage its categories.</div>}

      {websiteId && <>
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head"><div><span className="eyebrow">{editingId ? "EDIT CATEGORY" : "ADD CATEGORY"}</span><h2>{editingId ? "Update category" : "New category"}</h2></div></div>
        <form className="form-grid" onSubmit={submitForm}>
          <label>Category Name *<input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Technology" required /></label>
          <label>URL Slug *<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="technology" required /></label>
          <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <div className="save-bar wide">
            <span>{editingId ? `Editing "${form.name}"` : "New categories are active by default"}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {editingId && <button type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
              <button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add category"}</button>
            </div>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head"><div><span className="eyebrow">ALL CATEGORIES</span><h2>{visible.length} categories</h2></div><input placeholder="Search categories…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="blog-table-scroll">
          <table className="table table-bordered">
            <thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan="4" className="text-center">No categories found</td></tr>
              ) : (
                visible.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td><span className={`badge ${category.status === "active" ? "bg-success" : "bg-secondary"}`}>{category.status}</span></td>
                    <td>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => startEdit(category)}>Edit</button>{" "}
                      <button type="button" className="btn btn-danger btn-sm" disabled={saving} onClick={() => deleteCategory(category)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      </>}
    </div>
  );
};

export default BlogCategoryManager;
