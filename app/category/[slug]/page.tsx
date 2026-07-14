import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the category
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (catError || !category) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-white">
        <Navbar />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center py-5">
            <i className="bi bi-folder-x text-muted display-1 mb-3"></i>
            <h1 className="h3 fw-bold text-dark mb-1">Category Not Found</h1>
            <p className="text-secondary small mb-4">
              We couldn&apos;t find the category you are looking for.
            </p>
            <Link href="/" className="btn btn-wix-primary rounded-pill px-4">
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Fetch products under this category
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .is("deleted_at", null)
    .eq("is_active", true)
    .eq("category_id", category.id);

  const displayProducts = products || [];

  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      <Navbar />

      {/* Category Banner / Header */}
      <section className="bg-dark text-white py-5 position-relative overflow-hidden" style={{ minHeight: "260px" }}>
        {category.image_url && (
          <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25">
            <img src={category.image_url} alt="" className="w-100 h-100 object-fit-cover" />
          </div>
        )}
        <div className="container px-lg-5 position-relative z-1 d-flex flex-column justify-content-center h-100 pt-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/" className="text-decoration-none text-light opacity-75 small">Home</Link></li>
              <li className="breadcrumb-item active text-white small" aria-current="page">Category</li>
            </ol>
          </nav>
          <h1 className="display-5 fw-bold" style={{ fontFamily: "var(--font-heading)" }}>{category.name}</h1>
          {category.description && (
            <p className="lead small text-light opacity-75 max-w-600 mb-0 mt-2">{category.description}</p>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <main className="flex-grow-1 py-5 bg-light">
        <div className="container px-lg-5">
          <div className="mb-4">
            <p className="text-secondary small mb-0">
              Showing {displayProducts.length} {displayProducts.length === 1 ? "product" : "products"} in this category
            </p>
          </div>

          {displayProducts.length > 0 ? (
            <div className="row g-3 g-md-4">
              {displayProducts.map((prod) => {
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
              <i className="bi bi-box-seam text-muted display-4 mb-3 d-block"></i>
              <h4 className="text-dark fw-bold mb-1">No products found</h4>
              <p className="text-secondary small mb-4">
                There are currently no products available under this category. Check back later or browse other collections!
              </p>
              <Link href="/" className="btn btn-wix-primary rounded-pill px-4">
                Explore Homepage
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
