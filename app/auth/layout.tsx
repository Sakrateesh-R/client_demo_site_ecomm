import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column flex-md-row" style={{ backgroundColor: "#ffffff" }}>
      {/* Brand Side (Left panel) */}
      <div className="col-12 col-md-6 col-lg-7 d-none d-md-flex position-relative align-items-center justify-content-center text-center p-5 overflow-hidden" style={{ minHeight: "100vh" }}>
        <Image
          src="/images/auth-bg.png"
          alt="Premium Silk Weaves"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
        {/* Soft elegant warm overlay */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100" 
          style={{ 
            background: "linear-gradient(135deg, rgba(251, 249, 246, 0.85) 0%, rgba(27, 136, 229, 0.25) 100%)",
            zIndex: 1
          }} 
        />

        {/* Decorative elements */}
        <div className="position-relative z-2 bg-white p-5 rounded-4 shadow-sm" style={{ maxWidth: "480px", border: "var(--border-light)" }}>
          <Link href="/" className="text-decoration-none d-flex align-items-center justify-content-center gap-2 mb-3">
            <span className="bg-primary text-white d-flex align-items-center justify-content-center rounded-sm font-monospace" style={{ width: "32px", height: "32px", fontWeight: "800", fontSize: "1.1rem" }}>V</span>
            <span className="h4 fw-bold mb-0 text-dark tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              Vasantham Silks
            </span>
          </Link>
          <div className="w-25 bg-primary mx-auto my-3" style={{ height: "2px", opacity: 0.8 }} />
          <p className="lead fw-light mb-0 fs-6 text-secondary" style={{ letterSpacing: "0.5px", lineHeight: "1.7", fontWeight: "400" }}>
            Step into a world of premium women's fashion, comfortable leggings, and beautiful fabrics at affordable prices.
          </p>
        </div>
      </div>

      {/* Form Side (Right panel) */}
      <div className="col-12 col-md-6 col-lg-5 d-flex align-items-center justify-content-center p-4 p-sm-5" style={{ minHeight: "100vh", backgroundColor: "var(--bg-section)", borderLeft: "var(--border-light)" }}>
        <div className="w-100" style={{ maxWidth: "420px" }}>
          {/* Mobile Header */}
          <div className="d-md-none text-center mb-4">
            <h1 className="h3 text-uppercase mb-1 text-dark fw-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Vasantham Silks
            </h1>
            <p className="small text-secondary tracking-widest text-uppercase fs-8" style={{ letterSpacing: "2px" }}>Premium Fashion</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
