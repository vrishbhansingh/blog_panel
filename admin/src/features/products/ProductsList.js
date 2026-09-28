import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { API_BASE_URL } from "../../api";

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editImage, setEditImage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products"),
        api.get("/api/product-categories"),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      setNotice("Could not load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const categoryId = product.category?._id || product.category;
      const matchesCategory = !selectedCategory || categoryId === selectedCategory;
      const matchesSearch = !term || product.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    setSaving(true); setNotice("");
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((items) => items.filter((item) => item._id !== product._id));
      setNotice("Product deleted successfully");
    } catch (error) {
      setNotice(error.response?.data?.error || "Product could not be deleted");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (product) => {
    setEditProduct({ ...product });
    setEditCategory(product.category?._id || product.category || "");
    setEditImage(null);
    setNotice("");
    setShowModal(true);
  };

  const closeEdit = () => { setShowModal(false); setEditProduct(null); };

  const submitEdit = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice("");
    try {
      const formData = new FormData();
      formData.append("name", editProduct.name);
      formData.append("description", editProduct.description);
      formData.append("price", editProduct.price);
      formData.append("category", editCategory);
      if (editImage) formData.append("image", editImage);

      const { data } = await api.patch(`/products/${editProduct._id}`, formData);
      setProducts((items) => items.map((item) => (item._id === data._id ? data : item)));
      setNotice("Product updated successfully");
      closeEdit();
    } catch (error) {
      setNotice(error.response?.data?.error || "Product could not be updated");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <header className="page-head">
        <div>
          <span className="eyebrow">CATALOG</span>
          <h1>Products</h1>
          <p>Manage the products shown on the website, grouped by category.</p>
        </div>
        <Link to="/add-product" className="primary-action">+ Add Product</Link>
      </header>
      {notice && <div className="notice">{notice}</div>}

      <section className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">ALL PRODUCTS</span><h2>{filteredProducts.length} products</h2></div>
        </div>
        <div className="form-grid" style={{ marginBottom: 16 }}>
          <label>Search
            <input placeholder="Search by product name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </label>
          <label>Category
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </label>
        </div>

        {!categories.length && !loading && (
          <div className="notice">No product categories yet — <Link to="/product-categories">create one</Link> before adding products.</div>
        )}

        <div className="blog-table-scroll">
          <table className="table table-bordered">
            <thead><tr><th>Image</th><th>Name</th><th>Description</th><th>Price</th><th>Category</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center">Loading…</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No products found</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  const category = product.category;
                  return (
                    <tr key={product._id}>
                      <td>
                        {product.image ? (
                          <img src={`${API_BASE_URL}/uploads/products/${product.image}`} alt={product.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                        ) : "No image"}
                      </td>
                      <td>{product.name}</td>
                      <td>{(product.description || "").slice(0, 80)}{(product.description || "").length > 80 ? "…" : ""}</td>
                      <td>₹{Number(product.price).toFixed(2)}</td>
                      <td>{category?.name || "Uncategorized"}</td>
                      <td>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => openEdit(product)}>Edit</button>{" "}
                        <button type="button" className="btn btn-danger btn-sm" disabled={saving} onClick={() => handleDelete(product)}>Delete</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && editProduct && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head"><div><span className="eyebrow">EDIT PRODUCT</span><h2>{editProduct.name}</h2></div></div>
            <form className="form-grid" onSubmit={submitEdit}>
              <label>Name *<input required value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} /></label>
              <label>Price *<input type="number" min="0" required value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })} /></label>
              <label>Category *
                <select required value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                  <option value="">Choose category</option>
                  {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </label>
              <label className="wide">Description *
                <textarea rows={4} required value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} />
              </label>
              {editProduct.image && !editImage && (
                <div className="wide">
                  <img src={`${API_BASE_URL}/uploads/products/${editProduct.image}`} alt={editProduct.name} style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 6 }} />
                </div>
              )}
              <label className="wide">Replace Image
                <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files?.[0] || null)} />
              </label>
              <div className="save-bar wide">
                <span>Editing "{editProduct.name}"</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={closeEdit} disabled={saving}>Cancel</button>
                  <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
