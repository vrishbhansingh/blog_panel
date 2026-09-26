import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const blankSeo = { siteTitle: "", metaDescription: "", defaultKeywords: [], canonicalBase: "", ogImage: "", twitterHandle: "", googleSiteVerification: "", bingSiteVerification: "", googleAnalyticsId: "", googleTagManagerId: "" };

const SEOManager = () => {
  const [sites, setSites] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [seo, setSeo] = useState(blankSeo);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => sites.find((site) => site._id === selectedId), [sites, selectedId]);

  const loadSites = async () => {
    const { data } = await api.get("/api/websites/all");
    setSites(data.websites || []);
    setSelectedId((current) => current || data.websites?.[0]?._id || "");
  };

  useEffect(() => { loadSites().catch(() => setNotice("Could not load websites")); }, []);
  useEffect(() => { if (selected) setSeo({ ...blankSeo, ...(selected.seo || {}) }); }, [selected]);

  const setField = (key, value) => setSeo((old) => ({ ...old, [key]: value }));

  const saveSeo = async () => {
    if (!selectedId) return;
    setSaving(true); setNotice("");
    try {
      const { data } = await api.put(`/api/websites/${selectedId}/settings`, { seo });
      setSites((items) => items.map((site) => (site._id === selectedId ? data.website : site)));
      setNotice("SEO settings saved");
    } catch (error) {
      setNotice(error.response?.data?.error || "SEO settings could not be saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <header className="page-head">
        <div>
          <span className="eyebrow">SEARCH & DISCOVERY</span>
          <h1>SEO</h1>
          <p>Site-wide metadata, verification tags and tracking IDs, website by website.</p>
        </div>
      </header>
      {notice && <div className="notice">{notice}</div>}

      <div className="site-layout">
        <aside className="site-list panel">
          <div className="panel-head"><div><span className="eyebrow">WEBSITE</span><h2>{sites.length} websites</h2></div></div>
          {sites.map((site) => (
            <button key={site._id} onClick={() => setSelectedId(site._id)} className={`site-item ${site._id === selectedId ? "active" : ""}`}>
              <span className="site-favicon">{site.faviconUrl ? <img src={site.faviconUrl} alt="" /> : site.name.charAt(0)}</span>
              <span><strong>{site.name}</strong><small>{site.domain}</small></span>
              <i>{site.platform === "wordpress" ? "WP" : "CODE"}</i>
            </button>
          ))}
        </aside>
        <section className="panel settings-panel">
          {selected ? (
            <>
              <div className="property-head">
                <div><span className="site-favicon large">{selected.faviconUrl ? <img src={selected.faviconUrl} alt="" /> : selected.name.charAt(0)}</span></div>
                <div className="property-title"><span className="eyebrow">SELECTED PROPERTY</span><h2>{selected.name}</h2><a href={`https://${selected.domain}`} target="_blank" rel="noreferrer">{selected.domain} ↗</a></div>
              </div>
              <div className="form-grid">
                <label>Site title <span>{seo.siteTitle.length}/60</span><input maxLength="60" value={seo.siteTitle} onChange={(e) => setField("siteTitle", e.target.value)} /></label>
                <label>Twitter handle<input value={seo.twitterHandle} onChange={(e) => setField("twitterHandle", e.target.value)} placeholder="@brand" /></label>
                <label className="wide">Default meta description <span>{seo.metaDescription.length}/160</span><textarea maxLength="160" rows="3" value={seo.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} /></label>
                <label className="wide">Default keywords<input value={seo.defaultKeywords.join(", ")} onChange={(e) => setField("defaultKeywords", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} placeholder="machines, manufacturing" /></label>
                <label>Canonical base<input value={seo.canonicalBase} onChange={(e) => setField("canonicalBase", e.target.value)} placeholder={`https://${selected.domain}`} /></label>
                <label>Default social image<input value={seo.ogImage} onChange={(e) => setField("ogImage", e.target.value)} placeholder="https://.../social-cover.jpg" /></label>
                <label>Google verification<input value={seo.googleSiteVerification} onChange={(e) => setField("googleSiteVerification", e.target.value)} /></label>
                <label>Bing verification<input value={seo.bingSiteVerification} onChange={(e) => setField("bingSiteVerification", e.target.value)} /></label>
                <label>Google Analytics ID<input value={seo.googleAnalyticsId} onChange={(e) => setField("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXX" /></label>
                <label>Tag Manager ID<input value={seo.googleTagManagerId} onChange={(e) => setField("googleTagManagerId", e.target.value)} placeholder="GTM-XXXXXXX" /></label>
              </div>
              <div className="save-bar"><span>Changes apply to {selected.domain}</span><button onClick={saveSeo} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
            </>
          ) : (
            <div className="empty-state">Add a website first to configure its SEO.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SEOManager;
