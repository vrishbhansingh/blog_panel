import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addCategory, getCategories } from '../features/categories/CategoriesSlice';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const CategoryForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [parentId, setParentId] = useState('');
  const [level, setLevel] = useState(1);

  const dispatch = useDispatch();
  const { items: categories, status } = useSelector((state) => state.categories);
const { addStatus } = useSelector((state) => state.categories);
useEffect(() => {
  if (addStatus === 'success') {
    alert('Category added successfully!');
    dispatch(getCategories()); // Refresh list

    // Reset form fields
    setName('');
    setDescription('');
    setImage(null);
    setParentId('');
    setLevel(1);
  }
}, [addStatus, dispatch]);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(getCategories());
    }
  }, [status, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (image) formData.append('image', image);
    if (parentId) formData.append('parent', parentId);

    dispatch(addCategory(formData));

    // Reset form
    setName('');
    setDescription('');
    setImage(null);
    setParentId('');
    setLevel(1);
  };

  const getFilteredCategories = () => {
  if (level === 1) {
    return []; // No parent needed
  }

  // We want to show categories with depth = level - 1
const getCategoryLevel = (category) => {
  let level = 1;
  let current = category;
  while (current.parent) {
    const parent = categories.find(
      c => c._id === current.parent._id || c._id === current.parent
    );
    if (!parent) break;
    current = parent;
    level++;
  }
  return level;
};

  return categories.filter(cat => getCategoryLevel(cat) === level - 1);
};


  return (
    <Container className="mt-4">
      <h2>Add Category</h2>
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="categoryName">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="categoryLevel">
              <Form.Label>Category Level</Form.Label>
              <Form.Select
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value))}
              >
                <option value={1}>Top-Level Category</option>
                <option value={2}>Subcategory</option>
                <option value={3}>Sub-Subcategory</option>
                <option value={4}>Sub-Sub-Subcategory</option>
              <option value={5}>Sub-Sub-Sub-Subcategory (Level 5)</option>
    {/* <option value={6}>Sub-Sub-Sub-Sub-Subcategory (Level 6)</option> */}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {level > 1 && (
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="parentCategory">
                <Form.Label>Parent Category</Form.Label>
                <Form.Select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  required={level > 1}
                >
                  <option value="">Select Parent Category</option>
                  {getFilteredCategories().map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        )}

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="categoryImage">
              <Form.Label>Category Image</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <Form.Group controlId="categoryDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <Button variant="primary" type="submit">
          Add Category
        </Button>
      </Form>
    </Container>
  );
};

export default CategoryForm;
