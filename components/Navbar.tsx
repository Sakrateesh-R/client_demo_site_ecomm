"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [mobileBrandOpen, setMobileBrandOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const updateCount = () => {
      try {
        const items = JSON.parse(localStorage.getItem("aura_cart") || "[]");
        const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    };
    updateCount();
    window.addEventListener("aura_cart_updated", updateCount);
    return () => {
      window.removeEventListener("aura_cart_updated", updateCount);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.filter((c: any) => c.is_active));
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    const fetchBrands = async () => {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = await res.json();
          setBrands(data);
        }
      } catch (err) {
        console.error("Failed to fetch brands", err);
      }
    };
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="sticky-top bg-white border-bottom border-light z-3 py-3">
      <div className="container-fluid px-lg-5">
        <div className="d-flex justify-content-between align-items-center">
          {/* Logo */}
          <Link href="/" className="text-decoration-none d-flex align-items-center gap-2">
            <span className="bg-primary text-white d-flex align-items-center justify-content-center rounded-sm font-monospace" style={{ width: "32px", height: "32px", fontWeight: "800", fontSize: "1.1rem" }}>A</span>
            <span className="h5 fw-bold mb-0 text-dark tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              Aura.weaves
            </span>
          </Link>

          {/* Desktop Nav Menu */}
          <nav className="d-none d-md-flex align-items-center gap-4">
            <div 
              className="position-relative"
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
            >
              <button 
                type="button"
                className="nav-link-wix text-decoration-none bg-transparent border-0 p-0 d-flex align-items-center gap-1"
                style={{ cursor: "pointer", fontWeight: "inherit", color: "inherit", outline: "none" }}
              >
                Categories <i className="bi bi-chevron-down small" style={{ fontSize: "0.75rem" }}></i>
              </button>

              {/* Hover Dropdown Menu */}
              {showCategoryDropdown && categories.length > 0 && (
                <div 
                  className="position-absolute top-100 start-0 bg-white border border-light shadow rounded-3 py-2 z-3"
                  style={{ zIndex: 1200, minWidth: "180px" }}
                >
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      className="dropdown-item text-start text-truncate small py-2 px-3 border-0 bg-transparent text-dark hover-light"
                      style={{ fontSize: "0.85rem", cursor: "pointer" }}
                      onClick={() => setShowCategoryDropdown(false)}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Brands Dropdown */}
            <div 
              className="position-relative"
              onMouseEnter={() => setShowBrandDropdown(true)}
              onMouseLeave={() => setShowBrandDropdown(false)}
            >
              <button 
                type="button"
                className="nav-link-wix text-decoration-none bg-transparent border-0 p-0 d-flex align-items-center gap-1"
                style={{ cursor: "pointer", fontWeight: "inherit", color: "inherit", outline: "none" }}
              >
                Brands <i className="bi bi-chevron-down small" style={{ fontSize: "0.75rem" }}></i>
              </button>

              {showBrandDropdown && brands.length > 0 && (
                <div 
                  className="position-absolute top-100 start-0 bg-white border border-light shadow rounded-3 py-2 z-3"
                  style={{ zIndex: 1200, minWidth: "180px" }}
                >
                  {brands.map((b) => (
                    <Link
                      key={b.id}
                      href={`/brand/${b.slug}`}
                      className="dropdown-item text-start text-truncate small py-2 px-3 border-0 bg-transparent text-dark hover-light"
                      style={{ fontSize: "0.85rem", cursor: "pointer" }}
                      onClick={() => setShowBrandDropdown(false)}
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/combos" className="nav-link-wix text-decoration-none">
              Combos
            </Link>

            <a href="#seasonal-picks" className="nav-link-wix text-decoration-none">
              Seasonal Picks
            </a>
            <a href="#best-offers" className="nav-link-wix text-decoration-none">
              Best Offers
            </a>
          </nav>

          {/* Desktop Search Bar */}
          <div className="position-relative d-none d-md-block">
            <div className="d-flex align-items-center bg-light px-3 py-1.5 rounded-pill border border-light" style={{ width: "220px" }}>
              <i className="bi bi-search text-muted small me-2" style={{ cursor: "pointer" }} onClick={handleSearchSubmit}></i>
              <input 
                type="text" 
                placeholder="Search fabrics..." 
                className="bg-transparent border-0 small w-100" 
                style={{ outline: "none", fontSize: "0.8rem", padding: "2px 0" }} 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              />
            </div>

            {/* Desktop Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="position-absolute top-100 start-0 w-100 bg-white border border-light shadow rounded-3 mt-1 py-1"
                style={{ zIndex: 1100, minWidth: "220px" }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(s.name);
                      router.push(`/search?q=${encodeURIComponent(s.name)}`);
                      setShowSuggestions(false);
                    }}
                    className="dropdown-item text-start text-truncate small py-2 px-3 border-0 bg-transparent text-dark hover-light"
                    style={{ fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    <i className="bi bi-search text-muted me-2 small"></i>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Icons & Mobile Toggle */}
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <Link href="/auth/login" className="text-dark fs-5 hover-link p-2">
              <i className="bi bi-person"></i>
            </Link>
            <button 
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("aura_cart_open"))}
              className="text-dark fs-5 hover-link p-2 position-relative bg-transparent border-0"
              style={{ outline: "none" }}
            >
              <i className="bi bi-bag"></i>
              {cartCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: "0.6rem" }}>
                  {cartCount}
                </span>
              )}
            </button>
            
            {/* Mobile Hamburger Button */}
            <button 
              onClick={toggleMenu} 
              className="btn border-0 p-2 d-md-none text-dark"
              aria-label="Toggle navigation"
            >
              <i className={`bi ${isOpen ? "bi-x" : "bi-list"} fs-3`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        <div 
          className={`d-md-none overflow-hidden transition-all duration-300 ${isOpen ? "max-h-500 py-3 mt-3 border-top border-light" : "max-h-0"}`}
          style={{ 
            transition: "max-height 0.3s ease-out, padding 0.3s ease-out",
            maxHeight: isOpen ? "360px" : "0",
            opacity: isOpen ? 1 : 0
          }}
        >
          <nav className="d-flex flex-column gap-3">
            {/* Mobile Search Bar */}
            <div className="position-relative">
              <div className="d-flex align-items-center bg-light px-3 py-2 rounded-pill border border-light mb-2">
                <i className="bi bi-search text-muted small me-2" style={{ cursor: "pointer" }} onClick={handleSearchSubmit}></i>
                <input 
                  type="text" 
                  placeholder="Search fabrics..." 
                  className="bg-transparent border-0 small w-100" 
                  style={{ outline: "none", fontSize: "0.85rem" }} 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                />
              </div>

              {/* Mobile Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  className="position-absolute top-100 start-0 w-100 bg-white border border-light shadow rounded-3 mt-n2 mb-3 py-1"
                  style={{ zIndex: 1100 }}
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(s.name);
                        router.push(`/search?q=${encodeURIComponent(s.name)}`);
                        setShowSuggestions(false);
                      }}
                      className="dropdown-item text-start text-truncate small py-2 px-3 border-0 bg-transparent text-dark hover-light"
                      style={{ fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      <i className="bi bi-search text-muted me-2 small"></i>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Categories Accordion */}
            <div className="mb-1">
              <button 
                type="button"
                onClick={() => setMobileCatOpen(!mobileCatOpen)}
                className="nav-link-wix w-100 text-start text-decoration-none py-2 bg-transparent border-0 d-flex align-items-center justify-content-between"
                style={{ outline: "none" }}
              >
                <span>Categories</span>
                <i className={`bi ${mobileCatOpen ? "bi-chevron-up" : "bi-chevron-down"} small text-secondary`}></i>
              </button>
              
              {mobileCatOpen && categories.length > 0 && (
                <div className="ps-3 d-flex flex-column gap-2 mt-1 border-start border-light ms-2">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="nav-link-wix text-decoration-none py-1.5 text-secondary fs-9"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Brands Accordion */}
            <div className="mb-1">
              <button 
                type="button"
                onClick={() => setMobileBrandOpen(!mobileBrandOpen)}
                className="nav-link-wix w-100 text-start text-decoration-none py-2 bg-transparent border-0 d-flex align-items-center justify-content-between"
                style={{ outline: "none" }}
              >
                <span>Brands</span>
                <i className={`bi ${mobileBrandOpen ? "bi-chevron-up" : "bi-chevron-down"} small text-secondary`}></i>
              </button>
              
              {mobileBrandOpen && brands.length > 0 && (
                <div className="ps-3 d-flex flex-column gap-2 mt-1 border-start border-light ms-2">
                  {brands.map((b) => (
                    <Link
                      key={b.id}
                      href={`/brand/${b.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="nav-link-wix text-decoration-none py-1.5 text-secondary fs-9"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link 
              href="/combos" 
              onClick={() => setIsOpen(false)} 
              className="nav-link-wix text-decoration-none py-2"
            >
              Combos
            </Link>

            <a 
              href="#seasonal-picks" 
              onClick={() => setIsOpen(false)} 
              className="nav-link-wix text-decoration-none py-2"
            >
              Seasonal Picks
            </a>
            <a 
              href="#best-offers" 
              onClick={() => setIsOpen(false)} 
              className="nav-link-wix text-decoration-none py-2"
            >
              Best Offers
            </a>
          </nav>
        </div>
      </div>
      <CartDrawer />
    </header>
  );
}
