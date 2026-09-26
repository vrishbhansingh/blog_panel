import React, { useState } from "react";
import api from "../api";

const AddWebsite = () => {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/api/websites/create", {
        name,
        domain,
        description,
      });

      setMessage("✅ Website added successfully!");
      setName("");
      setDomain("");
      setDescription("");
    } catch (err) {
      setMessage("❌ Error: " + err.response?.data?.error || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "550px", margin: "40px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h3>Add New Website</h3>

      {message && (
        <div style={{ margin: "10px 0", padding: "10px", background: "#f3f3f3", borderRadius: "5px" }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        <div style={{ marginBottom: "15px" }}>
          <label>Website Name</label>
          <input
            type="text"
            placeholder="e.g. Bharat Transformers"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-control"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Domain URL</label>
          <input
            type="text"
            placeholder="e.g. https://bharattransformers.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
            className="form-control"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Description (optional)</label>
          <textarea
            placeholder="Short description about the website..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="form-control"
          ></textarea>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Website"}
        </button>
      </form>
    </div>
  );
};

export default AddWebsite;
