import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (brandError || !brand) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-white">
        <Navbar />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center py-5">
            <i className="bi bi-award text-muted display-1 mb-3"></i>
            <h1 className="h3 fw-bold text-dark mb-1">Brand Not Found</h1>
            <p className="text-secondary small mb-4">
              We couldn&apos;t find the brand catalog you are looking for.
            </p>
            <Link href="/" className="btn btn-wix-primary rounded-pill px-4">
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Fetch products under this brand
  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .is("deleted_at", null)
    .eq("is_active", true)
    .eq("brand_id", brand.id);

  const displayProducts = products || [];

  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      <Navbar />

      {/* Brand Banner / Header */}
      <section className="bg-dark text-white py-5 position-relative overflow-hidden" style={{ minHeight: "260px" }}>
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-60 z-0"></div>
        <div className="position-relative container py-4 z-1 text-center">
          {brand.logo_url && (
            <div className="mb-3">
              <img 
                src={brand.logo_url} 
                alt={`${brand.name} logo`} 
                className="bg-white p-2 rounded-circle object-fit-contain shadow" 
                style={{ width: "80px", height: "80px" }}
              />
            </div>
          )}
          <span className="text-uppercase tracking-widest text-accent small fw-bold mb-2 d-block">Brand Collection</span>
          <h1 className="display-4 fw-bold mb-3 text-white" style={{ fontFamily: "var(--font-heading)", color: "#ffffff" }}>{brand.name}</h1>
          {brand.description && (
            <p className="lead fs-6 text-light opacity-75 mx-auto" style={{ maxWidth: "600px" }}>
              {brand.description}
            </p>
          )}
        </div>
      </section>

      {/* Brand Products Catalog */}
      <main className="flex-grow-1 py-5 bg-light">
        <div className="container px-lg-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="text-secondary small">{displayProducts.length} fabrics found</span>
          </div>

          {displayProducts.length > 0 ? (
            <div className="row g-3 g-md-4">
              {displayProducts.map((prod) => {
                const mainImg = prod.product_images?.find((img: any) => img.sort_order === 0) || prod.product_images?.[0];
                return (
                  <div key={prod.id} className="col-6 col-md-3">
                    <Link href={`/product/${prod.id}`} className="text-decoration-none h-100 d-block">
                      <div className="wix-product-card p-3 h-100 d-flex flex-column justify-content-between bg-white shadow-sm border-0 rounded-3">
                        <div>
                          <div className="wix-product-image-container rounded-sm mb-3 overflow-hidden bg-light d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                            {mainImg ? (
                              <img src={mainImg.image_url} alt={prod.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="bi bi-image text-secondary fs-1"></i>
                            )}
                          </div>
                          <h5 className="h6 fw-semibold text-dark mb-1 text-truncate" title={prod.name}>{prod.name}</h5>
                          <div className="wix-stars mb-2">
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                            <i className="bi bi-star-fill"></i>
                          </div>
                        </div>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mt-2 pt-2 border-top border-light">
                          <span className="fw-bold text-dark">₹{Number(prod.price).toFixed(2)}</span>
                          <span className={`badge rounded-pill px-2 py-1 fs-9 ${
                            prod.stock_quantity > 0 
                              ? "bg-success-subtle text-success border border-success" 
                              : "bg-danger-subtle text-danger border border-danger"
                          }`}>
                            {prod.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
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
              <i className="bi bi-box-seam text-muted display-2 mb-3"></i>
              <h3 className="fw-bold text-dark">No Products Found</h3>
              <p className="text-secondary small">We currently do not have any active products listed under this brand.</p>
              <Link href="/" className="btn btn-wix-primary rounded-pill px-4 mt-3">
                Shop Other Weaves
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
