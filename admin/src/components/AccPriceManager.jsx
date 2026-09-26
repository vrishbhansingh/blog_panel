import React, { useState, useEffect } from 'react';
import api from '../api';

const API_URL = '/accprice';

const AccPriceManager = () => {
  const [prices, setPrices] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all records
  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await api.get(API_URL);
      setPrices(res.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or update record
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.patch(`${API_URL}/${editingId}`, formData);
      } else {
        await api.post(API_URL, formData);
      }
      setFormData({ name: '', price: '' });
      setEditingId(null);
      fetchPrices();
    } catch (err) {
      console.error('Error saving data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit existing record
  const handleEdit = (item) => {
    setFormData({ name: item.name, price: item.price });
    setEditingId(item._id);
  };

  // Delete record
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${API_URL}/${id}`);
      fetchPrices();
    } catch (err) {
      console.error('Error deleting data:', err);
    }
  };

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">Accessory Price Management</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-light border rounded shadow-sm mb-4"
      >
        <div className="row g-3 align-items-center">
          <div className="col-md-6">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              placeholder="Accessory Name"
              required
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="form-control"
              placeholder="Price"
              required
            />
          </div>
          <div className="col-md-2">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading
                ? 'Saving...'
                : editingId
                ? 'Update'
                : 'Add'}
            </button>
          </div>
        </div>
      </form>

      {/* Table */}
      <table className="table table-bordered table-striped align-middle">
        <thead className="table-dark text-center">
          <tr>
            <th>Accessory Name</th>
            <th>Price (₹)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {prices.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.price}</td>
              <td>
                <button
                  className="btn btn-sm btn-warning me-2"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {prices.length === 0 && (
            <tr>
              <td colSpan="3" className="text-muted py-3">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AccPriceManager;
