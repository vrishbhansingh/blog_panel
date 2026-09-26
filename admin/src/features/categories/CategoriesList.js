import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, deleteCategory, updateCategory } from './CategoriesSlice';
import { Table, Container, Button, Image, Modal, Form } from 'react-bootstrap';
import { API_BASE_URL } from '../../api';
import { Link } from 'react-router-dom';

const CategoriesList = () => {
  const dispatch = useDispatch();
  const { items: categories, status, error } = useSelector((state) => state.categories);

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [selectedParent, setSelectedParent] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(getCategories());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;

  const getCategoryLevel = (category) => {
    let level = 1;
    let current = category;
    while (current.parent) {
      const parent = categories.find(c => c._id === current.parent._id || c._id === current.parent);
      if (!parent) break;
      level++;
      current = parent;
    }
    return level;
  };

  const groupedByLevel = categories.reduce((acc, category) => {
    const level = getCategoryLevel(category);
    if (!acc[level]) acc[level] = [];
    acc[level].push({ ...category, level });
    return acc;
  }, {});

  const handleEdit = (category) => {
    setEditData(category);
    setSelectedParent(category.parent?._id || category.parent || '');
    setShowModal(true);
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch(deleteCategory(categoryId));
    }
  };

  const handleSaveChanges = () => {
    const formData = new FormData();
    formData.append('name', editData.name);
    formData.append('description', editData.description);
    if (selectedParent) formData.append('parent', selectedParent);
    if (newImage) formData.append('image', newImage);

    dispatch(updateCategory({
      id: editData._id,
      updatedData: formData
    }));
    setShowModal(false);
  };

  return (
    <Container className="mt-4">
      <div className="category-page-head"><h2>Categories</h2><Link className="primary-action" to="/add-category">+ Add Category</Link></div>

      {Object.keys(groupedByLevel)
        .sort((a, b) => a - b)
        .map((level) => (
          <div key={level} className="mb-5">
            <h4>Level {level}</h4>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedByLevel[level].map((category) => (
                  <tr key={category._id}>
                    <td>
                      {category.image ? (
                        <Image
                          src={`${API_BASE_URL}/uploads/categories/${category.image}`}
                          alt={category.name}
                          rounded
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                      ) : 'No Image'}
                    </td>
                    <td>{category.name}</td>
                    <td>{category.description}</td>
                    <td>{category.parent ? category.parent.name : 'None'}</td>
                    <td>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(category)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(category._id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editData && (
            <Form>
              <Form.Group controlId="editName" className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </Form.Group>

              <Form.Group controlId="editDescription" className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </Form.Group>

              <Form.Group controlId="editImage" className="mb-3">
                <Form.Label>Change Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImage(e.target.files[0])}
                />
              </Form.Group>

              <Form.Group controlId="editParent" className="mb-3">
                <Form.Label>Parent Category</Form.Label>
                <Form.Select
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                >
                  <option value="">None</option>
                  {categories
                    .filter(c => c._id !== editData._id)
                    .map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoriesList;
