import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const supabase = await createClient();

  // Fetch products where meta_keywords contains is_combo: true
  const { data: products, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .is("deleted_at", null)
    .eq("is_active", true)
    .like("meta_keywords", "%\"is_combo\":true%");

  const combos = products || [];

  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-dark text-white py-5 position-relative overflow-hidden" style={{ minHeight: "260px" }}>
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-50 z-0"></div>
        <div className="position-relative container py-5 z-1 text-center">
          <span className="text-uppercase tracking-widest text-accent small fw-bold mb-2 d-block">Exclusive Bundles</span>
          <h1 className="display-4 fw-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>Artisan Combos</h1>
          <p className="lead fs-6 text-light opacity-75 mx-auto" style={{ maxWidth: "600px" }}>
            Handpicked matching fabrics and weaves curated together for a complete matching outfit set.
          </p>
        </div>
      </section>

      {/* Catalog Grid */}
      <main className="flex-grow-1 py-5 bg-light">
        <div className="container px-lg-5">
          {combos.length > 0 ? (
            <div className="row g-4">
              {combos.map((combo) => {
                const mainImg = combo.product_images?.find((img: any) => img.sort_order === 0) || combo.product_images?.[0];
                return (
                  <div key={combo.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <Link href={`/product/${combo.id}`} className="text-decoration-none h-100 d-block">
                      <div className="card border-0 rounded-4 shadow-sm overflow-hidden p-3 bg-white h-100 d-flex flex-column justify-content-between hover-shadow transition-all">
                        <div>
                          <div className="w-100 rounded-3 overflow-hidden bg-light mb-3 position-relative" style={{ height: "260px" }}>
                            {mainImg ? (
                              <img src={mainImg.image_url} alt={combo.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted"><i className="bi bi-image fs-1"></i></div>
                            )}
                            <span className="position-absolute top-0 end-0 m-3 badge bg-primary rounded-pill px-3 py-1.5 fs-9 fw-semibold text-uppercase">
                              Bundle Save
                            </span>
                          </div>
                          
                          <h5 className="fw-bold text-dark mb-1 text-truncate" style={{ fontFamily: "var(--font-heading)" }}>
                            {combo.name}
                          </h5>
                          
                          <p className="text-secondary small mb-3 text-truncate-2" style={{ fontSize: "0.8rem", height: "36px", overflow: "hidden" }}>
                            {combo.description || "Matching luxury handwoven textile bundle."}
                          </p>
                        </div>
                        
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <span className="text-primary fw-bold fs-5">₹{Number(combo.price).toFixed(2)}</span>
                              {combo.compare_at_price && Number(combo.compare_at_price) > Number(combo.price) && (
                                <span className="text-muted text-decoration-line-through small ms-2">
                                  ₹{Number(combo.compare_at_price).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className={`badge rounded-pill px-2 py-1 fs-9 ${
                              combo.stock_quantity > 0 
                                ? "bg-success-subtle text-success border border-success" 
                                : "bg-danger-subtle text-danger border border-danger"
                            }`}>
                              {combo.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                          
                          <span className="btn btn-outline-primary btn-sm w-100 rounded-pill py-2 text-uppercase tracking-wider fw-semibold" style={{ fontSize: "0.75rem" }}>
                            Customize Combo
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-box-seam text-muted display-1 mb-3"></i>
              <h3 className="fw-bold text-dark mb-1">No Combos Available</h3>
              <p className="text-secondary small mb-4">Our artisans are curating new matching sets. Check back soon!</p>
              <Link href="/" className="btn btn-wix-primary rounded-pill px-4">
                Back to Store
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
