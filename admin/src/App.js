import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import CategoriesList from "./features/categories/CategoriesList";
import ProductsList from "./features/products/ProductsList";
import CategoryForm from "./components/CategoryForm";
import ProductForm from "./components/ProductForm";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./LoginPage";
import Home from "./Home";
import AccPriceManager from "./components/AccPriceManager";
import BlogEditor from "./components/BlogEditor";
import EditBlog from "./components/EditBlog";
import BlogList from "./components/BlogList";
import WebsiteManager from "./components/WebsiteManager";
import SEOManager from "./components/SEOManager";
import BlogCategoryManager from "./components/BlogCategoryManager";
import Enquiries from "./components/Enquiries";
import "./App.css";

const Guard = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
      <div className={`admin-shell${isLoginPage ? " login-shell" : ""}`}>
        <Navbar />
        <main className="admin-main">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Guard><Home /></Guard>} />
            <Route path="/websites" element={<Guard><WebsiteManager /></Guard>} />
            <Route path="/seo" element={<Guard><SEOManager /></Guard>} />
            <Route path="/enquiries" element={<Guard><Enquiries /></Guard>} />
            <Route path="/categories" element={<Guard><CategoriesList /></Guard>} />
            <Route path="/products" element={<Guard><ProductsList /></Guard>} />
            <Route path="/add-category" element={<Guard><CategoryForm /></Guard>} />
            <Route path="/add-product" element={<Guard><ProductForm /></Guard>} />
            <Route path="/Accessory" element={<Guard><AccPriceManager /></Guard>} />
            <Route path="/add-blog" element={<Guard><BlogEditor /></Guard>} />
            <Route path="/edit-blog" element={<Guard><BlogList /></Guard>} />
            <Route path="/edit-blog/:id" element={<Guard><EditBlog /></Guard>} />
            <Route path="/blog-categories" element={<Guard><BlogCategoryManager /></Guard>} />
          </Routes>
        </main>
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
