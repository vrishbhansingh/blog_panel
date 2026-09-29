import React, { useEffect, useState } from "react";
import api from "../api";

const Profile = () => {
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const loadSettings = async () => {
    const { data } = await api.get("/api/settings");
    setCompanyName(data.companyName || "");
    setUsername(data.username || "");
    setLogoUrl(data.logoUrl || "");
  };

  useEffect(() => { loadSettings().catch(() => setNotice("Could not load profile settings")); }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true); setNotice("");
    try {
      await api.put("/api/settings", { companyName, username });
      localStorage.setItem("adminUsername", username);
      window.dispatchEvent(new Event("settings-updated"));
      setNotice("Profile updated successfully");
    } catch (error) {
      setNotice(error.response?.data?.error || "Profile could not be updated");
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!file) { setNotice("Choose a logo image first"); return; }
    setSavingLogo(true); setNotice("");
    try {
      const body = new FormData();
      body.append("logo", file);
      const { data } = await api.post("/api/settings/logo", body, { headers: { "Content-Type": "multipart/form-data" } });
      setLogoUrl(data.logoUrl);
      setLogoFile(null);
      window.dispatchEvent(new Event("settings-updated"));
      setNotice("Logo updated successfully");
    } catch (error) {
      setNotice(error.response?.data?.error || "Logo could not be uploaded");
    } finally {
      setSavingLogo(false);
    }
  };

  const chooseAndUploadLogo = (event) => {
    const file = event.target.files?.[0] || null;
    setLogoFile(file);
    // Upload immediately using the file straight from the change event, rather
    // than waiting for a separate button click and reading it back from state
    // (state wouldn't be updated yet at that point anyway). Some browsers also
    // swallow the very next click right after the native file picker closes,
    // which made the old two-step select-then-click flow feel broken.
    if (file) uploadLogo(file);
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (newPassword.length < 8) { setNotice("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setNotice("New password and confirmation do not match"); return; }
    setSavingPassword(true); setNotice("");
    try {
      await api.put("/api/settings/password", { currentPassword, newPassword });
      localStorage.setItem("adminApiKey", newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setNotice("Password updated successfully. Use the new password next time you log in.");
    } catch (error) {
      setNotice(error.response?.data?.error || "Password could not be updated");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-wrap">
      <header className="page-head">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>Profile</h1>
          <p>Manage your display name, company branding and login password.</p>
        </div>
      </header>
      {notice && <div className="notice">{notice}</div>}

      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head"><div><span className="eyebrow">IDENTITY</span><h2>Name &amp; company</h2></div></div>
        <form className="form-grid" onSubmit={saveProfile}>
          <label>Your display name<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Administrator" /></label>
          <label>Company name<input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="MMW Machine" /></label>
          <div className="save-bar wide"><span>Shown in the sidebar and login page</span><button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save changes"}</button></div>
        </form>
      </section>

      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head"><div><span className="eyebrow">BRANDING</span><h2>Logo</h2></div></div>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); uploadLogo(logoFile); }}>
          <div className="image-upload-box wide">
            <strong>Current logo</strong>
            {logoUrl ? <img src={logoUrl} alt="Company logo" style={{ maxWidth: 160, maxHeight: 80, objectFit: "contain" }} /> : <span>No custom logo uploaded — using the default</span>}
            <label>Choose new logo<input type="file" accept="image/*" onChange={chooseAndUploadLogo} disabled={savingLogo} /></label>
          </div>
          <div className="save-bar wide"><span>PNG, JPG, WebP, GIF or SVG · max 2 MB — uploads automatically once chosen</span>{logoFile && <button type="submit" disabled={savingLogo}>{savingLogo ? "Uploading…" : "Retry upload"}</button>}</div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head"><div><span className="eyebrow">SECURITY</span><h2>Change password</h2></div></div>
        <form className="form-grid" onSubmit={changePassword}>
          <label>Current password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
          <label>New password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <label>Confirm new password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <div className="save-bar wide"><span>At least 8 characters</span><button type="submit" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update password"}</button></div>
        </form>
      </section>
    </div>
  );
};

export default Profile;
