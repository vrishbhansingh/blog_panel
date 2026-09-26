import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import api from "../api";

const pair = (left, right) => ({ [left]: "", [right]: "" });

const ProductForm = () => {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", slug: "", price: "", category: "", shortDescription: "", description: "", youtubeUrl: "" });
  const [image, setImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [outputImages, setOutputImages] = useState([]);
  const [outputTitles, setOutputTitles] = useState([]);
  const [specs, setSpecs] = useState([pair("label", "value")]);
  const [faqs, setFaqs] = useState([pair("question", "answer")]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    Promise.allSettled([api.get("/categories"), api.get("/products")]).then(([cats, prods]) => {
      if (cats.status === "fulfilled") setCategories(cats.value.data || []);
      if (prods.status === "fulfilled") setProducts(prods.value.data || []);
    });
  }, []);

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const updatePair = (setter, index, key, value) => setter((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const toggleRelated = (id) => setRelatedProducts((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const submit = async (event) => {
    event.preventDefault();
    if (!image || !form.category) { alert("Main product image aur category required hai."); return; }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.append("image", image);
    galleryImages.forEach((file) => body.append("galleryImages", file));
    outputImages.forEach((file) => body.append("outputImages", file));
    body.append("outputTitles", JSON.stringify(outputImages.map((_, index) => outputTitles[index] || "")));
    body.append("technicalSpecifications", JSON.stringify(specs.filter((item) => item.label && item.value)));
    body.append("faqs", JSON.stringify(faqs.filter((item) => item.question && item.answer)));
    body.append("relatedProducts", JSON.stringify(relatedProducts));
    body.append("accessories", "[]");
    try {
      setSaving(true);
      await api.post("/products", body);
      alert("Product successfully add ho gaya.");
      window.location.reload();
    } catch (error) { alert(error.response?.data?.message || error.response?.data?.error || "Product save nahi hua."); }
    finally { setSaving(false); }
  };

  return <Container className="product-studio py-4">
    <div className="product-studio-head"><div><span>PRODUCT CONTENT STUDIO</span><h2>Add Machine Product</h2><p>Website product page ke liye complete information add karein.</p></div><Button form="product-editor-form" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Product"}</Button></div>
    <Form id="product-editor-form" onSubmit={submit}>
      <Section title="Basic Information"><Row className="g-3"><Field label="Product / Machine Name *" md={6}><Form.Control required value={form.name} onChange={(e) => { setField("name", e.target.value); setField("slug", slugify(e.target.value)); }} /></Field><Field label="Page URL / Slug" md={6}><Form.Control value={form.slug} onChange={(e) => setField("slug", slugify(e.target.value))} /></Field><Field label="Category *" md={6}><Form.Select required value={form.category} onChange={(e) => setField("category", e.target.value)}><option value="">Choose category</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Form.Select></Field><Field label="Price" md={6}><Form.Control type="number" min="0" value={form.price} onChange={(e) => setField("price", e.target.value)} required /></Field><Field label="Short Description" md={12}><Form.Control as="textarea" rows={2} value={form.shortDescription} onChange={(e) => setField("shortDescription", e.target.value)} /></Field><Field label="Full Description *" md={12}><Form.Control as="textarea" rows={7} required value={form.description} onChange={(e) => setField("description", e.target.value)} /></Field></Row></Section>
      <Section title="Product Images"><Row className="g-3"><Field label="Main Product Image *" md={6}><Form.Control type="file" accept="image/*" required onChange={(e) => setImage(e.target.files?.[0])} /></Field><Field label="Gallery Images (multiple choose kar sakte hain)" md={6}><Form.Control type="file" accept="image/*" multiple onChange={(e) => setGalleryImages(Array.from(e.target.files || []))} /></Field></Row></Section>
      <Section title="Technical Specifications" action="+ Add Specification" onAction={() => setSpecs([...specs, pair("label", "value")])}>{specs.map((item, index) => <RepeatRow key={index} onRemove={() => setSpecs(specs.filter((_, i) => i !== index))}><Form.Control placeholder="Specification e.g. Max Web Width" value={item.label} onChange={(e) => updatePair(setSpecs, index, "label", e.target.value)} /><Form.Control placeholder="Value e.g. 1300 mm" value={item.value} onChange={(e) => updatePair(setSpecs, index, "value", e.target.value)} /></RepeatRow>)}</Section>
      <Section title="Product Video"><Row><Field label="YouTube Video Link" md={12}><Form.Control type="url" placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={(e) => setField("youtubeUrl", e.target.value)} /></Field></Row>{form.youtubeUrl && <div className="youtube-note">Website par video YouTube player format me show hoga.</div>}</Section>
      <Section title="What This Machine Makes"><Row className="g-3"><Field label="Output / Manufactured Item Images" md={12}><Form.Control type="file" accept="image/*" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setOutputImages(files); setOutputTitles(files.map((file) => file.name.replace(/\.[^.]+$/, ""))); }} /></Field>{outputImages.map((file, index) => <Field key={`${file.name}-${index}`} label={`Image ${index + 1}: ${file.name}`} md={6}><Form.Control placeholder="Item name / caption" value={outputTitles[index] || ""} onChange={(e) => setOutputTitles((current) => current.map((title, i) => i === index ? e.target.value : title))} /></Field>)}</Row></Section>
      <Section title="Related Products"><div className="product-check-grid">{products.length ? products.map((item) => <Form.Check key={item._id} type="checkbox" label={item.name} checked={relatedProducts.includes(item._id)} onChange={() => toggleRelated(item._id)} />) : <p>Abhi related products available nahi hain.</p>}</div></Section>
      <Section title="Frequently Asked Questions" action="+ Add FAQ" onAction={() => setFaqs([...faqs, pair("question", "answer")])}>{faqs.map((item, index) => <RepeatRow key={index} onRemove={() => setFaqs(faqs.filter((_, i) => i !== index))}><Form.Control placeholder={`Question ${index + 1}`} value={item.question} onChange={(e) => updatePair(setFaqs, index, "question", e.target.value)} /><Form.Control as="textarea" rows={2} placeholder="Answer" value={item.answer} onChange={(e) => updatePair(setFaqs, index, "answer", e.target.value)} /></RepeatRow>)}</Section>
      <Button className="product-save-bottom" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Complete Product"}</Button>
    </Form>
  </Container>;
};

const Section = ({ title, action, onAction, children }) => <section className="product-editor-section"><div className="product-section-title"><h3>{title}</h3>{action && <Button type="button" size="sm" onClick={onAction}>{action}</Button>}</div>{children}</section>;
const Field = ({ label, md, children }) => <Col md={md}><Form.Group><Form.Label>{label}</Form.Label>{children}</Form.Group></Col>;
const RepeatRow = ({ children, onRemove }) => <div className="product-repeat-row">{children}<Button type="button" variant="outline-danger" onClick={onRemove}>Remove</Button></div>;

export default ProductForm;
