import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../api";

const links = [
  ["/", "Overview", "OV"], ["/websites", "Websites", "WS"], ["/seo", "SEO", "SE"],
  ["/add-blog", "Create blog", "CB"], ["/edit-blog", "Blog library", "BL"], ["/blog-categories", "Blog Categories", "BC"],
  ["/add-product", "Add product", "AP"], ["/products", "Products", "PR"], ["/product-categories", "Product Categories", "PC"],
  ["/profile", "Profile", "PF"],
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ companyName: "MMW Machine", username: "Administrator", logoUrl: "" });

  useEffect(() => {
    const loadSettings = () => api.get("/api/settings").then((res) => setSettings((current) => ({ ...current, ...res.data }))).catch(() => {});
    loadSettings();
    window.addEventListener("settings-updated", loadSettings);
    return () => window.removeEventListener("settings-updated", loadSettings);
  }, []);

  if (location.pathname === "/login") return null;
  const logout = () => {
    if (!window.confirm(`Log out from ${settings.companyName} Admin Panel?`)) return;
    localStorage.removeItem("isLoggedIn"); localStorage.removeItem("adminApiKey"); localStorage.removeItem("adminUsername"); navigate("/login");
  };
  const displayName = localStorage.getItem("adminUsername") || settings.username;
  const avatarLetters = (displayName || "AD").slice(0, 2).toUpperCase();

  return <aside className="sidebar">
    <div className="brand mmw-sidebar-brand">{settings.logoUrl ? <img src={settings.logoUrl} alt={settings.companyName} /> : <img src="/mmw-logo.png" alt={settings.companyName} />}<div><strong>{settings.companyName}</strong><small>Content Manager</small></div></div>
    <nav className="side-nav"><span className="nav-label">Workspace</span>{links.map(([to,label,icon]) => <NavLink key={to} to={to} end={to === "/"} className={({isActive})=>`side-link ${isActive?"active":""}`}><span className="nav-icon">{icon}</span>{label}</NavLink>)}</nav>
    <div className="sidebar-foot"><div className="admin-avatar">{avatarLetters}</div><div className="admin-meta"><strong>{displayName}</strong><small>SEO workspace</small></div><button onClick={logout} className="logout-btn" aria-label="Log out" title="Log out">↪</button></div>
    <button onClick={logout} className="sidebar-logout"><span>↪</span> Log out</button>
  </aside>;
};
export default Navbar;
