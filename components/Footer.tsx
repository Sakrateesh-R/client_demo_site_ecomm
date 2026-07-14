"use client";

import React, { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thank you for subscribing to Aura.weaves dispatch!");
    setEmail("");
  };

  return (
    <footer className="bg-dark text-white pt-5 pb-4 mt-auto border-top border-secondary-subtle" style={{ fontFamily: "var(--font-body)", backgroundColor: "#15171a !important" }}>
      <div className="container pt-3">
        {/* Top Newsletter & Brand Grid */}
        <div className="row g-4 mb-5 border-bottom border-secondary pb-5">
          <div className="col-12 col-lg-5">
            <Link href="/" className="text-decoration-none d-flex align-items-center gap-2 mb-3">
              <span className="bg-primary text-white d-flex align-items-center justify-content-center rounded-sm font-monospace fw-bold" style={{ width: "36px", height: "36px", fontSize: "1.2rem" }}>A</span>
              <span className="h4 fw-bold mb-0 text-white tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
                Aura.weaves
              </span>
            </Link>
            <p className="text-secondary small mb-4" style={{ maxWidth: "380px", lineHeight: "1.7" }}>
              Experience the finest handpicked artisan textiles, heritage handloom sarees, luxury pashminas, and organic cotton fabrics crafted for true connoisseurs.
            </p>
            {/* Social Icons */}
            <div className="d-flex align-items-center gap-3">
              <a href="#" className="text-secondary hover-white fs-5"><i className="bi bi-instagram"></i></a>
              <a href="#" className="text-secondary hover-white fs-5"><i className="bi bi-pinterest"></i></a>
              <a href="#" className="text-secondary hover-white fs-5"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-secondary hover-white fs-5"><i className="bi bi-whatsapp"></i></a>
            </div>
          </div>

          <div className="col-12 col-md-8 col-lg-4 ms-lg-auto">
            <h6 className="fw-bold mb-3 text-uppercase tracking-wider small" style={{ color: "#f8f9fa" }}>Join the Atelier Circle</h6>
            <p className="text-secondary small mb-3">Subscribe to receive seasonal collections preview, catalog releases, and artisan stories.</p>
            <form onSubmit={handleSubscribe} className="input-group">
              <input 
                type="email" 
                required
                placeholder="Enter your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control bg-transparent border-secondary text-white small rounded-start-pill"
                style={{ fontSize: "0.85rem", height: "42px" }}
              />
              <button 
                type="submit" 
                className="btn btn-primary rounded-end-pill px-4 small fw-semibold"
                style={{ fontSize: "0.8rem" }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="row g-4 mb-5">
          {/* Col 1 */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold text-uppercase tracking-wider small mb-3" style={{ color: "#f8f9fa" }}>Shop Fabrics</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-secondary small">
              <li><Link href="/" className="text-decoration-none text-secondary hover-white">Heritage Silk Sarees</Link></li>
              <li><Link href="/" className="text-decoration-none text-secondary hover-white">Atelier Pashmina</Link></li>
              <li><Link href="/" className="text-decoration-none text-secondary hover-white">Organic Woven Linen</Link></li>
              <li><Link href="/" className="text-decoration-none text-secondary hover-white">Premium Brocades</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold text-uppercase tracking-wider small mb-3" style={{ color: "#f8f9fa" }}>Atelier Support</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-secondary small">
              <li><Link href="/checkout" className="text-decoration-none text-secondary hover-white">Order Tracking</Link></li>
              <li><Link href="#" className="text-decoration-none text-secondary hover-white">Shipping & Customs</Link></li>
              <li><Link href="#" className="text-decoration-none text-secondary hover-white">Returns & Exchanges</Link></li>
              <li><Link href="#" className="text-decoration-none text-secondary hover-white">Textile Maintenance Guide</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold text-uppercase tracking-wider small mb-3" style={{ color: "#f8f9fa" }}>The Chronicle</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-secondary small">
              <li><Link href="#" className="text-decoration-none text-secondary hover-white">Our Loom Journey</Link></li>
              <li><Link href="#" className="text-decoration-none text-secondary hover-white">Artisan Network</Link></li>
              <li><Link href="#" className="text-decoration-none text-secondary hover-white">Ethical Sourcing</Link></li>
              <li><Link href="#" className="text-decoration-none text-secondary hover-white">Atelier Journal</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold text-uppercase tracking-wider small mb-3" style={{ color: "#f8f9fa" }}>Atelier Concierge</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-secondary small">
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-geo-alt mt-0.5"></i>
                <span>12, Khader Nawaz Khan Rd, Nungambakkam, Chennai, India</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="bi bi-telephone"></i>
                <span>+91 44 4859 2910</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="bi bi-envelope"></i>
                <span>concierge@auraweaves.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-top border-secondary pt-4 mt-2 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <p className="text-secondary mb-0 small" style={{ fontSize: "0.75rem" }}>
            &copy; {new Date().getFullYear()} Aura.weaves. All rights reserved. Crafted by weavers, designed for modern elegance.
          </p>
          {/* Payment Methods */}
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-secondary text-dark border border-secondary font-monospace" style={{ fontSize: "0.65rem", padding: "4px 8px" }}>COD</span>
            <span className="badge bg-secondary text-dark border border-secondary font-monospace" style={{ fontSize: "0.65rem", padding: "4px 8px" }}>VISA</span>
            <span className="badge bg-secondary text-dark border border-secondary font-monospace" style={{ fontSize: "0.65rem", padding: "4px 8px" }}>MASTERCARD</span>
            <span className="badge bg-secondary text-dark border border-secondary font-monospace" style={{ fontSize: "0.65rem", padding: "4px 8px" }}>UPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
