"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { addToCart } from "@/lib/cart";
import Footer from "@/components/Footer";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImgUrl, setSelectedImgUrl] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedLetterSize, setSelectedLetterSize] = useState<string>("");
  const [selectedInchSize, setSelectedInchSize] = useState<string>("");
  const [comboSelections, setComboSelections] = useState<Record<string, string>>({});

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];

  const getSelectedStock = () => {
    if (!product) return 0;
    if (!product.meta_keywords) return product.stock_quantity;
    
    try {
      const parsed = JSON.parse(product.meta_keywords);
      if (parsed.inventory_type !== "variant") {
        return product.stock_quantity;
      }
      
      if (selectedLetterSize) {
        const matched = parsed.letters_inventory?.find((i: any) => i.size === selectedLetterSize);
        return matched ? matched.quantity : 0;
      }
      
      if (selectedInchSize) {
        const matched = parsed.inches_inventory?.find((i: any) => i.size === selectedInchSize);
        return matched ? matched.quantity : 0;
      }
      
      return product.stock_quantity;
    } catch (e) {
      return product.stock_quantity;
    }
  };

  useEffect(() => {
    const stock = getSelectedStock();
    if (stock > 0) {
      if (quantity > stock) {
        setQuantity(stock);
      }
    } else {
      setQuantity(1);
    }
  }, [selectedLetterSize, selectedInchSize, product]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            categories:categories!category_id (id, name, slug),
            brands (id, name),
            product_images (*)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Product not found");

        setProduct(data);
        
        // Find main image or fallback
        const sortedImages = data.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
        const mainImg = sortedImages.find((img: any) => img.is_main) || sortedImages[0];
        setSelectedImgUrl(mainImg?.image_url || "");

        // Pre-select first options if present
        if (data.meta_keywords) {
          try {
            const parsed = JSON.parse(data.meta_keywords);
            if (parsed.colors) {
              const firstColor = parsed.colors.split(",")[0]?.trim();
              if (firstColor) setSelectedColor(firstColor);
            }
            if (parsed.sizes_letters && parsed.sizes_letters.length > 0) {
              const isVariant = parsed.inventory_type === "variant";
              const lettersInv = parsed.letters_inventory || [];
              const firstInStock = parsed.sizes_letters.find((sz: string) => {
                if (!isVariant) return true;
                const qty = lettersInv.find((i: any) => i.size === sz)?.quantity ?? 0;
                return qty > 0;
              }) || parsed.sizes_letters[0];
              
              if (firstInStock) setSelectedLetterSize(firstInStock);
            }
            if (parsed.sizes_inches) {
              const sizesInchesArr = parsed.sizes_inches.split(",").map((s: string) => s.trim()).filter(Boolean);
              const isVariant = parsed.inventory_type === "variant";
              const inchesInv = parsed.inches_inventory || [];
              const firstInStock = sizesInchesArr.find((sz: string) => {
                if (!isVariant) return true;
                const qty = inchesInv.find((i: any) => i.size === sz)?.quantity ?? 0;
                return qty > 0;
              }) || sizesInchesArr[0];
              
              if (firstInStock) setSelectedInchSize(firstInStock);
            }
            if (parsed.is_combo && parsed.combo_products) {
              const initialComboSel: Record<string, string> = {};
              parsed.combo_products.forEach((cp: any) => {
                if (cp.sizes && cp.sizes.length > 0) {
                  initialComboSel[cp.product_id] = cp.sizes[0];
                }
              });
              setComboSelections(initialComboSel);
            }
          } catch (e) {}
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, supabase]);

  const handleAddToCart = () => {
    const mainImg = product.product_images?.find((img: any) => img.is_main) || product.product_images?.[0];
    
    // Check if combo
    let isCombo = false;
    let comboProductsList: any[] = [];
    if (product.meta_keywords) {
      try {
        const parsed = JSON.parse(product.meta_keywords);
        if (parsed.is_combo) {
          isCombo = true;
          comboProductsList = parsed.combo_products || [];
        }
      } catch (e) {}
    }

    if (isCombo) {
      // Validate all sizes selected
      const unselected = comboProductsList.some((cp) => !comboSelections[cp.product_id]);
      if (unselected) {
        toast.error("Please select a size for all products in the combo.");
        return;
      }

      // Build selections array
      const selections = comboProductsList.map((cp) => ({
        product_id: cp.product_id,
        name: cp.name,
        selected_size: comboSelections[cp.product_id],
      }));

      addToCart({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: mainImg?.image_url || "",
        quantity,
        is_combo: true,
        combo_selections: selections,
      });
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: mainImg?.image_url || "",
        quantity,
        color: selectedColor || undefined,
        size_letter: selectedLetterSize || undefined,
        size_inch: selectedInchSize || undefined,
      });
    }
    toast.success("Added to shopping bag!");
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-white">
        <Navbar />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center py-5">
            <div className="spinner-border text-primary my-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary small">Assembling product profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-white">
        <Navbar />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center py-5">
            <i className="bi bi-box-seam text-muted display-1 mb-3"></i>
            <h1 className="h3 fw-bold text-dark mb-1">Product Not Found</h1>
            <p className="text-secondary small mb-4">The requested product could not be located in our catalog.</p>
            <Link href="/" className="btn btn-wix-primary rounded-pill px-4">
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const images = product.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      <Navbar />

      <main className="flex-grow-1 py-5 bg-light">
        <div className="container px-lg-5">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/" className="text-decoration-none text-secondary small">Home</Link></li>
              {product.categories && (
                <li className="breadcrumb-item">
                  <Link href={`/category/${product.categories.slug}`} className="text-decoration-none text-secondary small">
                    {product.categories.name}
                  </Link>
                </li>
              )}
              <li className="breadcrumb-item active small text-truncate" aria-current="page" style={{ maxWidth: "200px" }}>{product.name}</li>
            </ol>
          </nav>

          {/* Product Detail Layout */}
          <div className="row g-5">
            {/* Left Column: Image Gallery */}
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column gap-3">
                {/* Main Large Image Container */}
                <div className="bg-white border rounded-4 overflow-hidden d-flex align-items-center justify-content-center shadow-sm position-relative" style={{ height: "460px" }}>
                  {selectedImgUrl ? (
                    <img src={selectedImgUrl} alt={product.name} className="w-100 h-100 object-fit-cover animate-fade-in" />
                  ) : (
                    <i className="bi bi-image text-secondary display-1"></i>
                  )}
                  {product.stock_quantity === 0 && (
                    <div className="position-absolute top-0 start-0 bg-danger text-white px-3 py-1.5 fs-8 text-uppercase fw-bold rounded-bottom-end">
                      Sold Out
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {images.length > 1 && (
                  <div className="d-flex gap-2 justify-content-center flex-wrap">
                    {images.map((img: any, idx: number) => (
                      <button
                        key={img.id || idx}
                        onClick={() => setSelectedImgUrl(img.image_url)}
                        className={`border rounded-3 overflow-hidden bg-white p-0 position-relative ${selectedImgUrl === img.image_url ? "border-primary border-2 shadow-sm" : "border-light opacity-75"}`}
                        style={{ width: "80px", height: "80px", cursor: "pointer", outline: "none" }}
                      >
                        <img src={img.image_url} alt="" className="w-100 h-100 object-fit-cover" />
                        {img.is_main && (
                          <span className="position-absolute bottom-0 start-0 bg-primary text-white fs-10 px-1 py-0.5 rounded-top-end fw-bold">
                            Main
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Metadata & Actions */}
            <div className="col-12 col-md-6">
              <div className="p-2">
                {/* Brand & Category badges */}
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  {product.brands && (
                    <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-2 rounded-pill small fw-semibold">
                      {product.brands.name}
                    </span>
                  )}
                  {product.categories && (
                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2 rounded-pill small">
                      {product.categories.name}
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h1 className="h2 fw-bold text-dark mb-2" style={{ fontFamily: "var(--font-heading)" }}>{product.name}</h1>

                {/* Review Stars */}
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="wix-stars">
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <span className="text-secondary small">(5.0 Rating based on verified weavers review)</span>
                </div>

                {/* Price Display */}
                <div className="d-flex gap-3 align-items-center mb-4">
                  <span className="h3 fw-bold text-dark mb-0">₹{Number(product.price).toFixed(2)}</span>
                  {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted text-decoration-line-through fs-5">
                        ₹{Number(product.compare_at_price).toFixed(2)}
                      </span>
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle py-1 px-2 rounded-sm small fw-semibold">
                        Save ₹{ (Number(product.compare_at_price) - Number(product.price)).toFixed(2) }
                      </span>
                    </div>
                  )}
                </div>

                {/* Parse options */}
                {(() => {
                  let isCombo = false;
                  let comboProductsList: any[] = [];
                  if (product.meta_keywords) {
                    try {
                      const parsed = JSON.parse(product.meta_keywords);
                      if (parsed.is_combo) {
                        isCombo = true;
                        comboProductsList = parsed.combo_products || [];
                      }
                    } catch (e) {}
                  }

                  if (isCombo) {
                    return (
                      <div className="bg-white p-3 rounded-3 border border-light mb-4">
                        <h6 className="fw-bold text-dark mb-3 text-uppercase tracking-wider" style={{ fontSize: "0.75rem" }}>Configure Combo Items</h6>
                        {comboProductsList.map((cp) => (
                          <div key={cp.product_id} className="mb-3 pb-3 border-bottom border-light last-border-0">
                            <span className="text-secondary small fw-bold d-block mb-2 text-uppercase tracking-wider" style={{ fontSize: "0.7rem" }}>
                              {cp.name}
                            </span>
                            <div className="d-flex flex-wrap gap-2">
                              {cp.sizes.map((sz: string) => {
                                const isSelected = comboSelections[cp.product_id] === sz;
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => {
                                      setComboSelections((prev) => ({
                                        ...prev,
                                        [cp.product_id]: sz,
                                      }));
                                    }}
                                    className={`btn btn-sm rounded-3 transition-all fs-8 fw-semibold ${
                                      isSelected 
                                        ? "btn-primary shadow-sm" 
                                        : "btn-outline-secondary bg-white text-secondary"
                                    }`}
                                    style={{ minWidth: "42px" }}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  let sizesInchesArr: string[] = [];
                  let sizesLettersArr: string[] = [];
                  let colorsArr: string[] = [];
                  let inventoryType = "product";
                  let lettersInventory: { size: string; quantity: number }[] = [];
                  let inchesInventory: { size: string; quantity: number }[] = [];

                  if (product.meta_keywords) {
                    try {
                      const parsed = JSON.parse(product.meta_keywords);
                      if (parsed.sizes_inches) {
                        sizesInchesArr = parsed.sizes_inches.split(",").map((s: string) => s.trim()).filter(Boolean);
                      }
                      if (parsed.sizes_letters) {
                        sizesLettersArr = [...parsed.sizes_letters].sort((a, b) => {
                          const idxA = SIZE_ORDER.indexOf(a);
                          const idxB = SIZE_ORDER.indexOf(b);
                          return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
                        });
                      }
                      if (parsed.colors) {
                        colorsArr = parsed.colors.split(",").map((s: string) => s.trim()).filter(Boolean);
                      }
                      inventoryType = parsed.inventory_type || "product";
                      lettersInventory = parsed.letters_inventory || [];
                      inchesInventory = parsed.inches_inventory || [];
                    } catch (e) {}
                  }

                  if (colorsArr.length === 0 && sizesLettersArr.length === 0 && sizesInchesArr.length === 0) return null;

                  return (
                    <div className="bg-white p-3 rounded-3 border border-light mb-4">
                      {/* Color Options */}
                      {colorsArr.length > 0 && (
                        <div className="mb-3">
                          <span className="text-secondary small fw-semibold d-block mb-2 text-uppercase tracking-wider" style={{ fontSize: "0.75rem" }}>Select Color</span>
                          <div className="d-flex flex-wrap gap-2">
                            {colorsArr.map((col: string) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setSelectedColor(col)}
                                className={`btn btn-sm rounded-pill px-3 py-1.5 transition-all fs-8 fw-semibold ${
                                  selectedColor === col 
                                    ? "btn-primary shadow-sm" 
                                    : "btn-outline-secondary bg-white text-secondary"
                                }`}
                              >
                                {col}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size Options (Letters) */}
                      {sizesLettersArr.length > 0 && (
                        <div className="mb-3">
                          <span className="text-secondary small fw-semibold d-block mb-2 text-uppercase tracking-wider" style={{ fontSize: "0.75rem" }}>Select Size (Letter)</span>
                          <div className="d-flex flex-wrap gap-2">
                            {sizesLettersArr.map((sz: string) => {
                              const isVariant = inventoryType === "variant";
                              const matched = lettersInventory.find(i => i.size === sz);
                              const qty = matched ? matched.quantity : 0;
                              const isSoldOut = isVariant && qty <= 0;

                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  disabled={isSoldOut}
                                  onClick={() => setSelectedLetterSize(sz)}
                                  className={`btn btn-sm rounded-3 transition-all fs-8 fw-semibold ${
                                    selectedLetterSize === sz 
                                      ? "btn-primary shadow-sm" 
                                      : isSoldOut 
                                        ? "btn-outline-light text-muted border-light text-decoration-line-through cursor-not-allowed"
                                        : "btn-outline-secondary bg-white text-secondary"
                                  }`}
                                  style={{ minWidth: "42px" }}
                                  title={isSoldOut ? "Sold Out" : isVariant ? `${qty} in stock` : undefined}
                                >
                                  {sz}{isVariant && qty > 0 && qty <= 5 && <span className="ms-1 text-danger font-monospace" style={{ fontSize: "0.65rem" }}>({qty})</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Size Options (Inches) */}
                      {sizesInchesArr.length > 0 && (
                        <div className="mb-0">
                          <span className="text-secondary small fw-semibold d-block mb-2 text-uppercase tracking-wider" style={{ fontSize: "0.75rem" }}>Select Size (Inches)</span>
                          <div className="d-flex flex-wrap gap-2">
                            {sizesInchesArr.map((sz: string) => {
                              const isVariant = inventoryType === "variant";
                              const matched = inchesInventory.find(i => i.size === sz);
                              const qty = matched ? matched.quantity : 0;
                              const isSoldOut = isVariant && qty <= 0;

                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  disabled={isSoldOut}
                                  onClick={() => setSelectedInchSize(sz)}
                                  className={`btn btn-sm rounded-3 transition-all fs-8 fw-semibold ${
                                    selectedInchSize === sz 
                                      ? "btn-primary shadow-sm" 
                                      : isSoldOut 
                                        ? "btn-outline-light text-muted border-light text-decoration-line-through cursor-not-allowed"
                                        : "btn-outline-secondary bg-white text-secondary"
                                  }`}
                                  style={{ minWidth: "42px" }}
                                  title={isSoldOut ? "Sold Out" : isVariant ? `${qty} in stock` : undefined}
                                >
                                  {sz}&ldquo;{isVariant && qty > 0 && qty <= 5 && <span className="ms-1 text-danger font-monospace" style={{ fontSize: "0.65rem" }}>({qty})</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <hr className="my-4 border-light" />

                {/* Description */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2 small text-uppercase tracking-wider">Atelier Details</h6>
                  <p className="text-secondary small mb-3" style={{ lineHeight: "1.7" }}>
                    {product.description || "Crafted to premium handloom standards with detailed embroidery. This fabric has been hand-selected for high texture retention, premium comfort index, and durability."}
                  </p>
                  {product.short_description && (
                    <p className="text-secondary small border-start border-primary ps-3 my-3" style={{ fontStyle: "italic" }}>
                      {product.short_description}
                    </p>
                  )}
                </div>

                {/* Specs */}
                <div className="row g-2 mb-4 bg-white p-3 rounded-3 border border-light">
                  <div className="col-6">
                    <span className="text-muted small d-block">SKU Identifier</span>
                    <span className="fw-bold small text-dark">{product.sku}</span>
                  </div>
                  {product.barcode && (
                    <div className="col-6">
                      <span className="text-muted small d-block">Barcode</span>
                      <span className="fw-bold small text-dark">{product.barcode}</span>
                    </div>
                  )}
                  <div className="col-6">
                    <span className="text-muted small d-block">Stock Level</span>
                    <span className={`fw-bold small ${getSelectedStock() > 0 ? "text-success" : "text-danger"}`}>
                      {getSelectedStock() > 0 ? `${getSelectedStock()} available` : "Out of stock"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {product.stock_quantity > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {/* Quantity Picker */}
                    <div className="d-flex align-items-center gap-3">
                      <span className="small text-secondary fw-semibold">Quantity:</span>
                      <div className="d-flex align-items-center border rounded-pill bg-white px-2">
                        <button
                          type="button"
                          className="btn btn-sm border-0 p-2"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <span className="px-3 fw-bold small text-dark">{quantity}</span>
                        <button
                          type="button"
                          className="btn btn-sm border-0 p-2"
                          onClick={() => setQuantity(Math.min(getSelectedStock(), quantity + 1))}
                          disabled={quantity >= getSelectedStock()}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* Purchase buttons */}
                    <div className="d-flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="btn btn-wix-primary rounded-pill px-5 py-2.5 flex-grow-1 shadow-sm fw-semibold"
                      >
                        <i className="bi bi-bag-plus me-2"></i> Add to Bag
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toast.success("Initiating instant checkout!");
                        }}
                        className="btn btn-wix-outline rounded-pill px-4 py-2.5 fw-semibold"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="btn btn-secondary w-100 rounded-pill py-3 fw-semibold text-uppercase tracking-wider"
                  >
                    Sold Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
