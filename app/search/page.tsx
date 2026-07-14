import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const queryText = q?.trim() || "";

  const supabase = await createClient();
  let products: any[] = [];
  let errorMsg = "";

  try {
    if (queryText) {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .is("deleted_at", null)
        .eq("is_active", true)
        .or(`name.ilike.%${queryText}%,description.ilike.%${queryText}%`);
      
      if (error) throw error;
      products = data || [];
    } else {
      // Fallback: fetch active products if search query is empty
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .is("deleted_at", null)
        .eq("is_active", true)
        .limit(24);

      if (error) throw error;
      products = data || [];
    }
  } catch (err: any) {
    errorMsg = err.message || "Failed to load search results.";
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      <Navbar />

      <main className="flex-grow-1 py-5 bg-light">
        <div className="container px-lg-5">
          {/* Breadcrumb & Title */}
          <div className="mb-5 text-center text-md-start">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><Link href="/" className="text-decoration-none text-secondary small">Home</Link></li>
                <li className="breadcrumb-item active small" aria-current="page">Search</li>
              </ol>
            </nav>
            <h1 className="h3 fw-bold text-dark mt-2" style={{ fontFamily: "var(--font-heading)" }}>
              {queryText ? `Search Results for "${queryText}"` : "Explore Catalog"}
            </h1>
            <p className="text-secondary small mb-0">
              Found {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger rounded-4 py-3 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {errorMsg}
            </div>
          )}

          {/* Results Grid */}
          {products.length > 0 ? (
            <div className="row g-3 g-md-4">
              {products.map((prod) => {
                const mainImg = prod.product_images?.find((img: any) => img.sort_order === 0) || prod.product_images?.[0];
                return (
                  <div key={prod.id} className="col-6 col-md-4 col-lg-3">
                    <Link href={`/product/${prod.id}`} className="text-decoration-none h-100 d-block">
                      <div className="wix-product-card p-3 h-100 d-flex flex-column justify-content-between bg-white shadow-sm rounded-3">
                        <div>
                          <div className="wix-product-image-container rounded-sm mb-3 overflow-hidden bg-light d-flex align-items-center justify-content-center">
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
            <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
              <i className="bi bi-search text-muted display-4 mb-3 d-block"></i>
              <h4 className="text-dark fw-bold mb-1">No products found</h4>
              <p className="text-secondary small mb-4">
                We couldn&apos;t find anything matching your search. Please check the spelling or try a different search word.
              </p>
              <Link href="/" className="btn btn-wix-primary rounded-pill px-4">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
