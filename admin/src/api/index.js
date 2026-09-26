import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5014';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const adminKey = localStorage.getItem('adminApiKey') || process.env.REACT_APP_ADMIN_API_KEY;
  if (adminKey) config.headers['x-admin-key'] = adminKey;
  return config;
});

// --- Category APIs ---
export const fetchCategories = () => api.get('/categories');
export const createCategory = (categoryData) => api.post('/categories', categoryData);
export const updateCategoryById = (id, updatedData) => api.patch(`/categories/${id}`, updatedData);
export const deleteCategoryById = (id) => api.delete(`/categories/${id}`);

// --- Blog Category APIs ---
export const fetchBlogCategories = (params) => api.get('/api/blog-categories', { params });
export const createBlogCategory = (data) => api.post('/api/blog-categories', data);
export const updateBlogCategoryById = (id, data) => api.put(`/api/blog-categories/${id}`, data);
export const deleteBlogCategoryById = (id) => api.delete(`/api/blog-categories/${id}`);

// --- Product APIs ---
export const fetchProducts = () => api.get('/products');
export const createProduct = (productData) => api.post('/products', productData);
export const updateProduct = (id, updatedData) => api.put(`/products/${id}`, updatedData);
export const deleteProductById = (id) => api.delete(`/products/${id}`);
export const updateProductById = (id, data) => api.patch(`/products/${id}`, data);

export const fetchAccessories = () => api.get('/accprice');
export const createAccessory = (data) => api.post('/accprice', data);
export const deleteAccessoryById = (id) => api.delete(`/accprice/${id}`);
export const updateAccessoryById = (id, data) => api.patch(`/accprice/${id}`, data);


export default api;
