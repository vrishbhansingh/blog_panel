import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";

const quillFormats = ["header", "bold", "italic", "underline", "strike", "blockquote", "list", "indent", "link", "image", "video", "code-block"];

const tabs = ["Content", "SEO", "Images", "FAQ", "Related"];
const emptyLink = () => ({ label: "", url: "" });
const EditorFormContext = createContext(null);
const Input = ({ label, name, type = "text", placeholder = "", maxLength }) => {
  const { form, setField } = useContext(EditorFormContext);
  return <label className="seo-field">{label}{maxLength && <span>{(form[name] || "").length}/{maxLength}</span>}<input type={type} value={form[name]} maxLength={maxLength} placeholder={placeholder} onChange={(e) => setField(name, e.target.value)} /></label>;
};

const BlogEditor = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Content");
  const [saving, setSaving] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", websiteId: "", categoryId: "", tags: "", authorName: "Admin",
    publishDate: new Date().toISOString().slice(0, 10), status: "draft", focusKeyword: "", secondaryKeywords: "",
    metaTitle: "", metaDescription: "", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "",
    featuredImage: "", featuredImageAlt: "", images: [], faqs: [{ question: "", answer: "" }],
    relatedProducts: [], relatedBlogs: [], cta: { label: "Get Quote", url: "/contact" }, youtubeUrl: "",
    internalLinks: [emptyLink()], externalLinks: [emptyLink()], schemaType: "BlogPosting", robotsIndex: "index", robotsFollow: "follow",
  });

  useEffect(() => {
    Promise.allSettled([api.get("/api/websites/all"), api.get("/products"), api.get("/api/blogs")]).then(([sites, prods, posts]) => {
      if (sites.status === "fulfilled") setWebsites(sites.value.data.websites || []);
      if (prods.status === "fulfilled") setProducts(prods.value.data || []);
      if (posts.status === "fulfilled") setBlogs(posts.value.data || []);
    });
  }, []);

  // Categories are scoped per website, so refetch whenever the chosen website
  // changes, and drop any category picked for the previous website.
  useEffect(() => {
    if (!form.websiteId) { setCategories([]); return; }
    api.get("/api/blog-categories", { params: { status: "active", websiteId: form.websiteId } })
      .then(({ data }) => setCategories(data || []))
      .catch(() => setCategories([]));
    setForm((current) => ({ ...current, categoryId: "" }));
  }, [form.websiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const handleTitle = (value) => setForm((current) => ({ ...current, title: value, slug: slugify(value), metaTitle: current.metaTitle || value, ogTitle: current.ogTitle || value }));

  const uploadImage = async (file) => {
    const body = new FormData(); body.append("image", file);
    const response = await api.post("/api/blogs/upload-image", body, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data.url;
  };
  const uploadFor = async (file, field) => {
    if (!file) return;
    try { setField(field, await uploadImage(file)); } catch (error) { alert(error.response?.data?.error || "Image upload failed"); }
  };
  const uploadAdditional = async (files) => {
    try { const urls = await Promise.all(Array.from(files).map(uploadImage)); setForm((current) => ({ ...current, images: [...current.images, ...urls.filter((url) => !current.images.includes(url))] })); }
    catch (error) { alert(error.response?.data?.error || "Image upload failed"); }
  };

  const quillRef = useRef(null);
  const quillImageHandler = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection(true);
        editor?.insertEmbed(range ? range.index : 0, "image", url, "user");
        editor?.setSelection((range ? range.index : 0) + 1);
      } catch (error) { alert(error.response?.data?.error || "Image upload failed"); }
    };
    input.click();
  };
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: { image: quillImageHandler },
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateArrayItem = (field, index, key, value) => setForm((current) => ({ ...current, [field]: current[field].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  const removeArrayItem = (field, index) => setForm((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));
  const toggleId = (field, id) => setForm((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((value) => value !== id) : [...current[field], id] }));

  const handleSubmit = async () => {
    if (!form.title || !form.websiteId || !form.content) { alert("Blog title, website and content are required."); return; }
    if (!form.categoryId) { alert("Please select a category."); return; }
    setSaving(true);
    const payload = {
      ...form, tags: form.tags.split(",").map((v) => v.trim()).filter(Boolean),
      secondaryKeywords: form.secondaryKeywords.split(",").map((v) => v.trim()).filter(Boolean), metaKeyword: form.secondaryKeywords,
      faqs: form.faqs.filter((item) => item.question && item.answer), internalLinks: form.internalLinks.filter((item) => item.label && item.url),
      externalLinks: form.externalLinks.filter((item) => item.label && item.url), publishedAt: form.status === "published" ? form.publishDate : null,
    };
    try { await api.post("/api/blogs/create", payload); alert(form.status === "published" ? "Blog published successfully!" : "Draft saved successfully!"); }
    catch (error) { alert(error.response?.data?.error || "Blog could not be saved"); }
    finally { setSaving(false); }
  };

  return <EditorFormContext.Provider value={{ form, setField }}><div className="blog-editor-page seo-blog-editor">
    <header className="blog-editor-head"><div><span className="eyebrow">SEO CONTENT STUDIO</span><h2>Create Blog</h2><p>Build a complete search-ready article from one workspace.</p></div><div className="editor-actions"><select value={form.status} onChange={(e) => setField("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select><button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : form.status === "published" ? "Publish blog" : "Save draft"}</button></div></header>
    <nav className="editor-tabs">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav>
    {activeTab === "Content" && <div className="category-shortcut">Need a new category?<button type="button" onClick={() => navigate("/blog-categories")}>Manage blog categories</button></div>}
    <section className="blog-editor-card">
      {activeTab === "Content" && <div className="compact-featured-fields"><label className="seo-field">Blog Card Image *<input type="file" accept="image/*" onChange={(e) => uploadFor(e.target.files?.[0], "featuredImage")} /></label><Input label="Image ALT Text" name="featuredImageAlt" />{form.featuredImage && <img src={form.featuredImage} alt={form.featuredImageAlt || "Blog card preview"} />}</div>}
      {activeTab === "Content" && <div className="tab-pane"><div className="editor-grid"><label className="seo-field wide">Blog Title *<input value={form.title} onChange={(e) => handleTitle(e.target.value)} placeholder="Enter blog title" /></label><Input label="Slug / Page URL" name="slug" /><label className="seo-field">Website *<select value={form.websiteId} onChange={(e) => setField("websiteId", e.target.value)}><option value="">Choose website</option>{websites.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><label className="seo-field">Category *<select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)} required><option value="">Choose category</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><Input label="Tags (comma separated)" name="tags" /><Input label="Author Name" name="authorName" /><Input label="Publish Date" name="publishDate" type="date" /><label className="seo-field wide">Short Description / Excerpt <span>{form.excerpt.length}/500</span><textarea maxLength="500" value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} /></label></div><label className="editor-content-label">Main Blog Content *</label><div className="quill-editor-wrap"><ReactQuill ref={quillRef} theme="snow" value={form.content} onChange={(value) => setField("content", value)} modules={quillModules} formats={quillFormats} /></div></div>}
      {activeTab === "SEO" && <div className="tab-pane editor-grid"><Input label="Focus Keyword" name="focusKeyword" /><Input label="Secondary Keywords (comma separated)" name="secondaryKeywords" /><Input label="Meta Title" name="metaTitle" maxLength={60} /><label className="seo-field wide">Meta Description <span>{form.metaDescription.length}/160</span><textarea maxLength="160" value={form.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} /></label><Input label="Canonical URL" name="canonicalUrl" type="url" /><Input label="OG Title" name="ogTitle" maxLength={60} /><label className="seo-field wide">OG Description<textarea value={form.ogDescription} onChange={(e) => setField("ogDescription", e.target.value)} /></label><label className="seo-field">Schema Type<select value={form.schemaType} onChange={(e) => setField("schemaType", e.target.value)}><option>BlogPosting</option><option>Article</option></select></label><label className="seo-field">Indexing<select value={form.robotsIndex} onChange={(e) => setField("robotsIndex", e.target.value)}><option value="index">Index</option><option value="noindex">Noindex</option></select></label><label className="seo-field">Link crawling<select value={form.robotsFollow} onChange={(e) => setField("robotsFollow", e.target.value)}><option value="follow">Follow</option><option value="nofollow">Nofollow</option></select></label></div>}
      {activeTab === "Images" && <div className="tab-pane image-fields"><ImageUpload label="Featured Image" value={form.featuredImage} onFile={(file) => uploadFor(file,"featuredImage")} /><Input label="Featured Image ALT Text" name="featuredImageAlt" /><ImageUpload label="Open Graph Image" value={form.ogImage} onFile={(file) => uploadFor(file,"ogImage")} /><label className="seo-field wide">Additional Blog Images<input type="file" accept="image/*" multiple onChange={(e) => uploadAdditional(e.target.files)} /></label>{form.images.length > 0 && <div className="selected-images wide">{form.images.map((url,index)=><figure key={url}><img src={url} alt={`Selected ${index+1}`} /><figcaption>Image {index+1}<button onClick={()=>setField("images",form.images.filter((image)=>image!==url))}>Remove</button></figcaption></figure>)}</div>}</div>}
      {activeTab === "FAQ" && <div className="tab-pane"><div className="repeat-head"><div><h3>FAQ Section</h3><p>Add questions for users and FAQ schema.</p></div><button onClick={()=>setField("faqs",[...form.faqs,{question:"",answer:""}])}>+ Add FAQ</button></div>{form.faqs.map((item,index)=><div className="repeat-row" key={index}><input value={item.question} onChange={(e)=>updateArrayItem("faqs",index,"question",e.target.value)} placeholder={`Question ${index+1}`} /><textarea value={item.answer} onChange={(e)=>updateArrayItem("faqs",index,"answer",e.target.value)} placeholder="Answer" /><button onClick={()=>removeArrayItem("faqs",index)}>Remove</button></div>)}</div>}
      {activeTab === "Related" && <div className="tab-pane editor-grid"><Checklist title="Related Products" items={products} selected={form.relatedProducts} onToggle={(id)=>toggleId("relatedProducts",id)} /><Checklist title="Related Blogs" items={blogs} selected={form.relatedBlogs} onToggle={(id)=>toggleId("relatedBlogs",id)} /><Input label="YouTube Video URL" name="youtubeUrl" type="url" /><label className="seo-field">CTA Label<input value={form.cta.label} onChange={(e)=>setField("cta",{...form.cta,label:e.target.value})} /></label><label className="seo-field wide">CTA URL<input value={form.cta.url} onChange={(e)=>setField("cta",{...form.cta,url:e.target.value})} /></label><LinkEditor title="Internal Links" field="internalLinks" items={form.internalLinks} setField={setField} update={updateArrayItem} remove={removeArrayItem} /><LinkEditor title="External Links" field="externalLinks" items={form.externalLinks} setField={setField} update={updateArrayItem} remove={removeArrayItem} /></div>}
    </section>
  </div></EditorFormContext.Provider>;
};

const ImageUpload = ({ label, value, onFile }) => <div className="image-upload-box"><strong>{label}</strong>{value ? <img src={value} alt={label} /> : <span>No image selected</span>}<label>Choose image<input type="file" accept="image/*" onChange={(e)=>onFile(e.target.files?.[0])} /></label></div>;
const Checklist = ({ title, items, selected, onToggle }) => <div className="checklist"><h3>{title}</h3><div>{items.length ? items.map((item)=><label key={item._id}><input type="checkbox" checked={selected.includes(item._id)} onChange={()=>onToggle(item._id)} />{item.name || item.title}</label>) : <small>No items available</small>}</div></div>;
const LinkEditor = ({ title, field, items, setField, update, remove }) => <div className="link-editor wide"><div className="repeat-head"><h3>{title}</h3><button onClick={()=>setField(field,[...items,emptyLink()])}>+ Add link</button></div>{items.map((item,index)=><div className="link-row" key={index}><input value={item.label} onChange={(e)=>update(field,index,"label",e.target.value)} placeholder="Link label" /><input value={item.url} onChange={(e)=>update(field,index,"url",e.target.value)} placeholder="https:// or /page" /><button onClick={()=>remove(field,index)}>×</button></div>)}</div>;

export default BlogEditor;
