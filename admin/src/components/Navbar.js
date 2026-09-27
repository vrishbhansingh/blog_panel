import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../api";

const links = [
  ["/", "Overview", "OV"], ["/websites", "Websites", "WS"], ["/seo", "SEO", "SE"], ["/enquiries", "Enquiries", "EN"],
  ["/add-blog", "Create blog", "CB"], ["/edit-blog", "Blog library", "BL"], ["/blog-categories", "Blog Categories", "BC"], ["/categories", "Categories", "CT"],
  ["/products", "Products", "PR"], ["/Accessory", "Pricing", "PC"], ["/profile", "Profile", "PF"],
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState({ companyName: "MMW Machine", username: "Administrator", logoUrl: "" });

  useEffect(() => {
    if (location.pathname === "/login") return undefined;
    const load = () => api.get("/api/inquiries/notifications").then((res) => setUnread(res.data.unread || 0)).catch(() => {});
    load(); const timer = setInterval(load, 30000); return () => clearInterval(timer);
  }, [location.pathname]);

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
    <NavLink to="/enquiries" className="notification-card"><span className="notification-bell">♢</span><span><strong>Notifications</strong><small>{unread ? `${unread} unread enquiries` : "You're all caught up"}</small></span>{unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}</NavLink>
    <nav className="side-nav"><span className="nav-label">Workspace</span>{links.map(([to,label,icon]) => <NavLink key={to} to={to} end={to === "/"} className={({isActive})=>`side-link ${isActive?"active":""}`}><span className="nav-icon">{icon}</span>{label}{to==="/enquiries"&&unread>0&&<b className="nav-count">{unread}</b>}</NavLink>)}</nav>
    <div className="sidebar-foot"><div className="admin-avatar">{avatarLetters}</div><div className="admin-meta"><strong>{displayName}</strong><small>SEO workspace</small></div><button onClick={logout} className="logout-btn" aria-label="Log out" title="Log out">↪</button></div>
    <button onClick={logout} className="sidebar-logout"><span>↪</span> Log out</button>
  </aside>;
};
export default Navbar;
