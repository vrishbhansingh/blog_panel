import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts, deleteProduct, updateProduct } from './ProductsSlice';
import { getCategories } from '../categories/CategoriesSlice';
import { Table, Container, Form, Row, Col, Modal, Button } from 'react-bootstrap';
import api, { API_BASE_URL } from '../../api';



const ProductsList = () => {
  const dispatch = useDispatch();
  const { items: products, status: productStatus } = useSelector((state) => state.products);
  const { items: categories } = useSelector((state) => state.categories);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
const [accessories, setAccessories] = useState([]);
const [selectedAccessories, setSelectedAccessories] = useState([]);

  const [level1, setLevel1] = useState('');
  const [level2, setLevel2] = useState('');
  const [level3, setLevel3] = useState('');
  const [level4, setLevel4] = useState('');
  const [level5, setLevel5] = useState('');

  useEffect(() => {
    if (productStatus === 'idle') dispatch(getProducts());
    if (!categories.length) dispatch(getCategories());
  }, [productStatus, dispatch, categories.length]);

  const getCategoryLevel = (category) => {
    let level = 1;
    let current = category;
    while (current?.parent) {
      const parent = categories.find((c) => c._id === current.parent._id || c._id === current.parent);
      if (!parent) break;
      level++;
      current = parent;
    }
    return level;
  };
useEffect(() => {
  api.get("/accprice")
    .then(res => setAccessories(res.data))
    .catch(err => console.error("Failed to fetch accessories:", err));
}, []);

  const fifthLevelCategories = categories.filter((cat) => getCategoryLevel(cat) === 5);

  const filteredProducts = products.filter((product) => {
    const productCategory = categories.find(c => c._id === product.category?._id || c._id === product.category);
    const matchesCategory = !selectedCategory || (productCategory && productCategory._id === selectedCategory);
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProduct(productId));
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    const findParents = (catId) => {
      const path = [];
      let current = categories.find(c => c._id === catId);
      while (current) {
        path.unshift(current._id);
        current = categories.find(c => c._id === current.parent || (c.parent?._id === current._id));
      }
      return path;
    };
    const path = findParents(product.category._id || product.category);
    setSelectedAccessories(product.accessories || []);
    setLevel1(path[0] || '');
    setLevel2(path[1] || '');
    setLevel3(path[2] || '');
    setLevel4(path[3] || '');
    setLevel5(path[4] || '');
    setShowModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editProduct.name);
    formData.append('description', editProduct.description);
    formData.append('price', editProduct.price);
    formData.append('category', level5);
    formData.append("accessories", JSON.stringify(selectedAccessories));

    if (editProduct.newImage) {
      formData.append('image', editProduct.newImage);
      
    }
    dispatch(updateProduct({ id: editProduct._id, data: formData }));
    setShowModal(false);
  };

  return (
    <Container className="mt-4">
      <h2>Products</h2>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search by product name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All 5th-Level Categories</option>
            {fifthLevelCategories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => {
            const productCategory = categories.find(c => c._id === product.category?._id || c._id === product.category);
            return (
              <tr key={product._id}>
                <td>
                  {product.image ? (
                    <img
                      src={`${API_BASE_URL}/uploads/products/${product.image}`}
                      alt={product.name}
                      style={{ width: '80px', height: 'auto', objectFit: 'cover' }}
                    />
                  ) : 'No Image'}
                </td>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>₹{product.price.toFixed(2)}</td>
                <td>{productCategory ? productCategory.name : 'Uncategorized'}</td>
                <td>
                  <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(product)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(product._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editProduct && (
            <Form onSubmit={handleEditSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                />
              </Form.Group>
<Form.Group className="mb-3">
  <Form.Label>Select Accessories</Form.Label>

  {accessories.length === 0 ? (
    <p>Loading accessories...</p>
  ) : (
    accessories.map((acc) => (
      <div key={acc._id} className="mb-1">
        <input
          type="checkbox"
          value={acc._id}
          checked={selectedAccessories.includes(acc._id)}
          onChange={(e) => {
            const id = e.target.value;
            if (selectedAccessories.includes(id)) {
              setSelectedAccessories(selectedAccessories.filter(x => x !== id));
            } else {
              setSelectedAccessories([...selectedAccessories, id]);
            }
          }}
        />
        <label className="ms-2">
          {acc.name} — ₹{acc.price}
        </label>
      </div>
    ))
  )}
</Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                />
              </Form.Group>

              {editProduct.image && (
                <div className="mb-3">
                  <img
                    src={`${API_BASE_URL}/uploads/products/${editProduct.image}`}
                    alt={editProduct.name}
                    style={{ width: '100px', height: 'auto', objectFit: 'cover' }}
                  />
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Change Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditProduct({ ...editProduct, newImage: e.target.files[0] })}
                />
              </Form.Group>

              {/* Category Dropdowns */}
              <Form.Group className="mb-3">
                <Form.Label>Category Level 1</Form.Label>
                <Form.Select value={level1} onChange={(e) => { setLevel1(e.target.value); setLevel2(''); }}>
                  <option value="">Select</option>
                  {categories.filter(c => !c.parent).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              {level1 && (
                <Form.Group className="mb-3">
                  <Form.Label>Category Level 2</Form.Label>
                  <Form.Select value={level2} onChange={(e) => { setLevel2(e.target.value); setLevel3(''); }}>
                    <option value="">Select</option>
                    {categories.filter(c => c.parent?._id === level1).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              {level2 && (
                <Form.Group className="mb-3">
                  <Form.Label>Category Level 3</Form.Label>
                  <Form.Select value={level3} onChange={(e) => { setLevel3(e.target.value); setLevel4(''); }}>
                    <option value="">Select</option>
                    {categories.filter(c => c.parent?._id === level2).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              {level3 && (
                <Form.Group className="mb-3">
                  <Form.Label>Category Level 4</Form.Label>
                  <Form.Select value={level4} onChange={(e) => { setLevel4(e.target.value); setLevel5(''); }}>
                    <option value="">Select</option>
                    {categories.filter(c => c.parent?._id === level3).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              {level4 && (
                <Form.Group className="mb-3">
                  <Form.Label>Category Level 5</Form.Label>
                  <Form.Select value={level5} onChange={(e) => setLevel5(e.target.value)}>
                    <option value="">Select</option>
                    {categories.filter(c => c.parent?._id === level4).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Button type="submit" variant="primary">Update</Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProductsList;
