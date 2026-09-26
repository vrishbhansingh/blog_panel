import React, { useEffect, useMemo, useState } from "react";
import api, { API_BASE_URL } from "../api";

const blankSite = { name: "", domain: "", description: "", platform: "coded" };
const blankSettings = { seo: { siteTitle: "", metaDescription: "", defaultKeywords: [], canonicalBase: "", ogImage: "", twitterHandle: "", googleSiteVerification: "", bingSiteVerification: "", googleAnalyticsId: "", googleTagManagerId: "" }, technical: { robotsTxt: "User-agent: *\nAllow: /", htaccess: "", blogPath: "/blog", includeBlogsInSitemap: true } };

const WebsiteManager = () => {
  const [sites, setSites] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [newSite, setNewSite] = useState(blankSite);
  const [settings, setSettings] = useState(blankSettings);
  const [tab, setTab] = useState("general");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => sites.find((site) => site._id === selectedId), [sites, selectedId]);

  const loadSites = async () => {
    const { data } = await api.get("/api/websites/all");
    setSites(data.websites || []);
    setSelectedId((current) => current || data.websites?.[0]?._id || "");
  };

  useEffect(() => { loadSites().catch(() => setNotice("Could not load websites")); }, []);
  useEffect(() => { if (selected) setSettings({ seo: { ...blankSettings.seo, ...(selected.seo || {}) }, technical: { ...blankSettings.technical, ...(selected.technical || {}) } }); }, [selected]);

  const createSite = async (event) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try { const { data } = await api.post("/api/websites/create", newSite); setSites((items) => [...items, data.website]); setSelectedId(data.website._id); setNewSite(blankSite); setNotice("Website added successfully"); }
    catch (error) { setNotice(error.response?.data?.error || "Website could not be added"); }
    finally { setSaving(false); }
  };

  const saveSettings = async () => {
    if (!selectedId) return; setSaving(true); setNotice("");
    try { const { data } = await api.put(`/api/websites/${selectedId}/settings`, settings); setSites((items) => items.map((site) => site._id === selectedId ? data.website : site)); setNotice("SEO and technical settings saved"); }
    catch (error) { setNotice(error.response?.data?.error || "Settings could not be saved"); }
    finally { setSaving(false); }
  };

  const deleteWebsite = async () => {
    if (!selected || !window.confirm(`Delete "${selected.name}"? Blogs assigned to this website may stop appearing publicly.`)) return;
    setSaving(true); setNotice("");
    try {
      await api.delete(`/api/websites/${selected._id}`);
      const remaining = sites.filter((site) => site._id !== selected._id);
      setSites(remaining); setSelectedId(remaining[0]?._id || ""); setNotice("Website deleted successfully");
    } catch (error) { setNotice(error.response?.data?.error || "Website could not be deleted"); }
    finally { setSaving(false); }
  };

  const uploadFavicon = async (file) => {
    if (!file || !selectedId) return;
    const body = new FormData(); body.append("favicon", file);
    try { const { data } = await api.post(`/api/websites/${selectedId}/favicon`, body); setSites((items) => items.map((site) => site._id === selectedId ? data.website : site)); setNotice("Favicon uploaded"); }
    catch (error) { setNotice(error.response?.data?.error || "Favicon upload failed"); }
  };

  const setSeo = (key, value) => setSettings((old) => ({ ...old, seo: { ...old.seo, [key]: value } }));
  const setTechnical = (key, value) => setSettings((old) => ({ ...old, technical: { ...old.technical, [key]: value } }));
  const publicFile = (file) => selected ? `${API_BASE_URL}/api/websites/public/${selected.domain}/${file}` : "#";

  return <div className="page-wrap">
    <header className="page-head"><div><span className="eyebrow">SITE OPERATIONS</span><h1>Websites</h1><p>Manage properties, identity and technical files. SEO metadata lives on its own page.</p></div></header>
    {notice && <div className="notice">{notice}</div>}
    <div className="site-layout">
      <aside className="site-list panel"><div className="panel-head"><div><span className="eyebrow">PROPERTIES</span><h2>{sites.length} websites</h2></div></div>{sites.map((site) => <button key={site._id} onClick={() => setSelectedId(site._id)} className={`site-item ${site._id === selectedId ? "active" : ""}`}><span className="site-favicon">{site.faviconUrl ? <img src={site.faviconUrl} alt="" /> : site.name.charAt(0)}</span><span><strong>{site.name}</strong><small>{site.domain}</small></span><i>{site.platform === "wordpress" ? "WP" : "CODE"}</i></button>)}
        <details className="add-site"><summary>+ Add website</summary><form onSubmit={createSite}><input placeholder="Website name" value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} required /><input placeholder="example.com" value={newSite.domain} onChange={(e) => setNewSite({ ...newSite, domain: e.target.value })} required /><select value={newSite.platform} onChange={(e) => setNewSite({ ...newSite, platform: e.target.value })}><option value="coded">Coded website</option><option value="wordpress">WordPress</option></select><textarea placeholder="Description" value={newSite.description} onChange={(e) => setNewSite({ ...newSite, description: e.target.value })} /><button disabled={saving}>Add property</button></form></details>
      </aside>
      <section className="panel settings-panel">{selected ? <><div className="property-head"><div><span className="site-favicon large">{selected.faviconUrl ? <img src={selected.faviconUrl} alt="" /> : selected.name.charAt(0)}</span></div><div className="property-title"><span className="eyebrow">SELECTED PROPERTY</span><h2>{selected.name}</h2><a href={`https://${selected.domain}`} target="_blank" rel="noreferrer">{selected.domain} ↗</a></div><button className="delete-property" onClick={deleteWebsite} disabled={saving}>Delete website</button></div>
        <div className="tabs"><button className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}>Identity</button><button className={tab === "technical" ? "active" : ""} onClick={() => setTab("technical")}>Technical files</button></div>
        {tab === "general" && <div className="form-grid"><label className="wide">Favicon <span>ICO, PNG or SVG · max 1 MB</span><input type="file" accept=".ico,.png,.svg" onChange={(e) => uploadFavicon(e.target.files[0])} /></label><label>Canonical base<input value={settings.seo.canonicalBase} onChange={(e) => setSeo("canonicalBase", e.target.value)} placeholder={`https://${selected.domain}`} /></label><label>Default social image<input value={settings.seo.ogImage} onChange={(e) => setSeo("ogImage", e.target.value)} placeholder="https://.../social-cover.jpg" /></label></div>}
        {tab === "technical" && <div className="form-grid"><div className="wide file-links"><a href={publicFile("robots.txt")} target="_blank" rel="noreferrer">Open generated robots.txt ↗</a><a href={publicFile("sitemap.xml")} target="_blank" rel="noreferrer">Open generated sitemap.xml ↗</a></div><label>Blog URL path<input value={settings.technical.blogPath} onChange={(e) => setTechnical("blogPath", e.target.value)} placeholder="/blog" /></label><label className="check"><input type="checkbox" checked={settings.technical.includeBlogsInSitemap} onChange={(e) => setTechnical("includeBlogsInSitemap", e.target.checked)} /> Include published blogs in sitemap</label><label className="wide">robots.txt rules<textarea className="code-input" rows="8" value={settings.technical.robotsTxt} onChange={(e) => setTechnical("robotsTxt", e.target.value)} /></label><label className="wide">.htaccess template <span>Stored as a template; deploy manually or through a future authenticated connector.</span><textarea className="code-input" rows="10" value={settings.technical.htaccess} onChange={(e) => setTechnical("htaccess", e.target.value)} placeholder="# Apache rewrite rules" /></label></div>}
        <div className="save-bar"><span>Changes apply to {selected.domain}</span><button onClick={saveSettings} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></> : <div className="empty-state">Add a website to start configuring it.</div>}</section>
    </div>
  </div>;
};

export default WebsiteManager;
