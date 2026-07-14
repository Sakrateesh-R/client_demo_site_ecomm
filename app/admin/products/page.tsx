"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";


// Product Zod Schema matching database
const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  price: z.number().min(0, "Price must be positive"),
  compare_at_price: z.number().min(0, "Compare price must be positive").optional(),
  cost_price: z.number().min(0, "Cost price must be positive").optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  stock_quantity: z.number().min(0),
  low_stock_threshold: z.number().min(0),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  is_best_seller: z.boolean(),
  is_trending: z.boolean(),
  category_id: z.string().uuid().or(z.literal("")).nullable().optional(),
  brand_id: z.string().uuid().or(z.literal("")).nullable().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  meta_keywords: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [localImages, setLocalImages] = useState<{ image_url: string; is_main: boolean }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sizesInches, setSizesInches] = useState("");
  const [sizesLetters, setSizesLetters] = useState<string[]>([]);
  const [colors, setColors] = useState("");
  const [isVariantInventory, setIsVariantInventory] = useState(false);
  const [lettersInventory, setLettersInventory] = useState<{ size: string; quantity: number }[]>([]);
  const [inchesInventory, setInchesInventory] = useState<{ size: string; quantity: number }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      compare_at_price: undefined,
      cost_price: undefined,
      sku: "",
      barcode: "",
      stock_quantity: 0,
      low_stock_threshold: 10,
      is_active: true,
      is_featured: false,
      is_best_seller: false,
      is_trending: false,
      category_id: "",
      brand_id: "",
      description: "",
      short_description: "",
      meta_keywords: "",
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch products via API
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const productsData = await res.json();
      setProducts(productsData);

      // 2. Fetch categories via REST API
      const catRes = await fetch("/api/categories");
      if (!catRes.ok) throw new Error("Failed to load categories");
      const catData = await catRes.json();
      setCategories(catData || []);

      // 3. Fetch brands via REST API
      const brandRes = await fetch("/api/brands");
      if (!brandRes.ok) throw new Error("Failed to load brands");
      const brandData = await brandRes.json();
      setBrands(brandData || []);
    } catch (err: any) {
      toast.error(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetMainImage = (index: number) => {
    setLocalImages(prev => prev.map((img, idx) => ({
      ...img,
      is_main: idx === index
    })));
  };

  const handleRemoveImage = (index: number) => {
    setLocalImages(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (prev[index]?.is_main && updated.length > 0) {
        updated[0].is_main = true;
      }
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (maximum size is 5MB)");
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await res.json();
      
      setLocalImages(prev => {
        const isFirst = prev.length === 0;
        return [...prev, { image_url: data.url, is_main: isFirst }];
      });

      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Error uploading image", { id: toastId });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleEditClick = (prod: any) => {
    setEditingProduct(prod);

    // Prefill images
    const initialImages = prod.product_images
      ? prod.product_images.map((img: any) => ({
          image_url: img.image_url,
          is_main: img.sort_order === 0,
        }))
      : [];
    setLocalImages(initialImages);

    let inchesVal = "";
    let lettersVal: string[] = [];
    let colorsVal = "";
    let isVarInv = false;
    let lettersInvVal: { size: string; quantity: number }[] = [];
    let inchesInvVal: { size: string; quantity: number }[] = [];

    if (prod.meta_keywords) {
      try {
        const parsed = JSON.parse(prod.meta_keywords);
        inchesVal = parsed.sizes_inches || "";
        lettersVal = parsed.sizes_letters || [];
        colorsVal = parsed.colors || "";
        isVarInv = parsed.inventory_type === "variant";
        lettersInvVal = parsed.letters_inventory || [];
        inchesInvVal = parsed.inches_inventory || [];
      } catch (e) {}
    }
    setSizesInches(inchesVal);
    setSizesLetters(lettersVal);
    setColors(colorsVal);
    setIsVariantInventory(isVarInv);
    setLettersInventory(lettersInvVal);
    setInchesInventory(inchesInvVal);

    reset({
      name: prod.name,
      price: Number(prod.price),
      compare_at_price: prod.compare_at_price !== null && prod.compare_at_price !== undefined ? Number(prod.compare_at_price) : undefined,
      cost_price: prod.cost_price !== null && prod.cost_price !== undefined ? Number(prod.cost_price) : undefined,
      sku: prod.sku,
      barcode: prod.barcode || "",
      stock_quantity: prod.stock_quantity,
      low_stock_threshold: prod.low_stock_threshold,
      is_active: prod.is_active,
      is_featured: prod.is_featured,
      is_best_seller: prod.is_best_seller,
      is_trending: prod.is_trending,
      category_id: prod.category_id || "",
      brand_id: prod.brand_id || "",
      description: prod.description || "",
      short_description: prod.short_description || "",
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitting(true);
    const toastId = toast.loading(editingProduct ? "Updating product..." : "Saving product...");

    try {
      // Ensure one image is selected as main if there are images
      if (localImages.length > 0 && !localImages.some(img => img.is_main)) {
        localImages[0].is_main = true;
      }

      let totalStock = data.stock_quantity;

      const options: any = {
        sizes_inches: sizesInches,
        sizes_letters: sizesLetters,
        colors: colors,
        inventory_type: isVariantInventory ? "variant" : "product",
      };

      if (isVariantInventory) {
        options.letters_inventory = lettersInventory;
        options.inches_inventory = inchesInventory;
        totalStock = lettersInventory.reduce((acc, curr) => acc + curr.quantity, 0) +
                     inchesInventory.reduce((acc, curr) => acc + curr.quantity, 0);
        
        options.sizes_letters = lettersInventory.map(i => i.size);
        options.sizes_inches = inchesInventory.map(i => i.size).join(", ");
      }

      const payload = {
        ...data,
        stock_quantity: totalStock,
        category_id: data.category_id === "" ? null : data.category_id,
        brand_id: data.brand_id === "" ? null : data.brand_id,
        images: localImages,
        meta_keywords: JSON.stringify(options),
        ...(editingProduct ? { id: editingProduct.id } : {}),
      };

      const url = "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${editingProduct ? "update" : "create"} product`);
      }

      toast.success(editingProduct ? "Product updated successfully!" : "Product created successfully!", { id: toastId });
      setShowModal(false);
      setEditingProduct(null);
      reset();
      fetchData(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || `Error ${editingProduct ? "updating" : "creating"} product`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const toastId = toast.loading("Deleting product...");

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      toast.success("Product deleted successfully", { id: toastId });
      fetchData(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Error deleting product", { id: toastId });
    }
  };

  // Filter list by search term
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Title & Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Product Management
          </h2>
          <p className="text-secondary small mb-0">Create and organize fabrics, collections, and variants.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setLocalImages([]);
            setSizesInches("");
            setSizesLetters([]);
            setColors("");
            setIsVariantInventory(false);
            setLettersInventory([]);
            setInchesInventory([]);
            reset({
              name: "",
              price: 0,
              compare_at_price: undefined,
              cost_price: undefined,
              sku: "",
              barcode: "",
              stock_quantity: 0,
              low_stock_threshold: 10,
              is_active: true,
              is_featured: false,
              is_best_seller: false,
              is_trending: false,
              category_id: "",
              brand_id: "",
              description: "",
              short_description: "",
              meta_keywords: "",
            });
            setShowModal(true);
          }} 
          className="btn btn-wix-primary d-flex align-items-center gap-2 rounded-pill shadow-sm"
        >
          <i className="bi bi-plus-circle"></i>
          Add Product
        </button>
      </div>

      {/* Search Filter Banner */}
      <div className="card border-0 p-3 rounded-4 shadow-sm bg-white mb-4">
        <div className="d-flex align-items-center bg-light px-3 py-2 rounded-pill border-light" style={{ maxWidth: "320px" }}>
          <i className="bi bi-search text-muted small me-2"></i>
          <input 
            type="text" 
            placeholder="Search by name or SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 small w-100" 
            style={{ outline: "none", fontSize: "0.85rem" }} 
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary my-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary small">Fetching products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-tags text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-dark fw-bold mb-1">No Products Found</h5>
            <p className="text-secondary small">Add products to your catalog to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover border-0">
              <thead>
                <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="small border-bottom border-light">
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden" 
                          style={{ width: "36px", height: "36px", flexShrink: 0 }}
                        >
                          {(() => {
                            const mainImg = prod.product_images?.find((img: any) => img.sort_order === 0) || prod.product_images?.[0];
                            if (mainImg) {
                              return <img src={mainImg.image_url} alt={prod.name} className="w-100 h-100 object-fit-cover" />;
                            }
                            return <i className="bi bi-image text-secondary" style={{ fontSize: "1rem" }}></i>;
                          })()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{prod.name}</div>
                          <span className="text-muted fs-9 font-monospace">{prod.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-monospace text-secondary fw-semibold">{prod.sku}</td>
                    <td>{prod.categories?.name || <span className="text-muted small">None</span>}</td>
                    <td>{prod.brands?.name || <span className="text-muted small">None</span>}</td>
                    <td className="fw-bold text-dark">₹{Number(prod.price).toFixed(2)}</td>
                    <td>
                      <span className={`fw-bold ${prod.stock_quantity <= prod.low_stock_threshold ? "text-danger" : "text-success"}`}>
                        {prod.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge rounded-pill border ${
                        prod.is_active 
                          ? "bg-success-subtle text-success border-success" 
                          : "bg-secondary-subtle text-secondary border-secondary"
                      }`} style={{ fontSize: "0.65rem" }}>
                        {prod.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button 
                        onClick={() => handleEditClick(prod)}
                        className="btn btn-outline-primary btn-sm rounded-circle p-1 border-0 me-2"
                        style={{ width: "32px", height: "32px" }}
                        title="Edit Product"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(prod.id)}
                        className="btn btn-outline-danger btn-sm rounded-circle p-1 border-0"
                        style={{ width: "32px", height: "32px" }}
                        title="Delete Product"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Wix Style Add Product Modal Overlay */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom border-light p-4">
                <h5 className="modal-title fw-bold text-dark" style={{ fontFamily: "var(--font-heading)" }}>{editingProduct ? "Edit Product" : "Add New Product"}</h5>
                 <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditingProduct(null); setSizesInches(""); setSizesLetters([]); setColors(""); setIsVariantInventory(false); setLettersInventory([]); setInchesInventory([]); }}></button>
              </div>

              <div className="modal-body p-4 bg-light" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
                  <div className="row g-3">
                    
                    {/* Basic details */}
                    <div className="col-12 col-md-8">
                      <div className="card border-0 p-3 rounded-3 shadow-sm bg-white h-100">
                        <h6 className="fw-bold text-dark mb-3">General Details</h6>
                        
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-secondary">Product Name</label>
                          <input type="text" className={`form-control wix-input ${errors.name ? "is-invalid" : ""}`} {...register("name")} placeholder="e.g. Royal Banarasi Zari Silk" />
                          {errors.name && <div className="invalid-feedback small mt-1">{errors.name.message}</div>}
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-secondary">Description</label>
                          <textarea rows={3} className="form-control rounded-3" style={{ fontSize: "0.85rem" }} {...register("description")} placeholder="Describe weaving type, yarn composition, drape characteristics..." />
                        </div>
                      </div>
                    </div>

                    {/* Stock and flags */}
                    <div className="col-12 col-md-4">
                      <div className="card border-0 p-3 rounded-3 shadow-sm bg-white h-100">
                        <h6 className="fw-bold text-dark mb-3">Product Flags</h6>
                        
                        <div className="form-check form-switch mb-3">
                          <input className="form-check-input" type="checkbox" id="is_active" {...register("is_active")} />
                          <label className="form-check-label small fw-semibold text-secondary" htmlFor="is_active">Publish Status (Active)</label>
                        </div>
                        
                        <div className="form-check form-switch mb-3">
                          <input className="form-check-input" type="checkbox" id="is_featured" {...register("is_featured")} />
                          <label className="form-check-label small fw-semibold text-secondary" htmlFor="is_featured">Featured Showcase</label>
                        </div>

                        <div className="form-check form-switch mb-3">
                          <input className="form-check-input" type="checkbox" id="is_best_seller" {...register("is_best_seller")} />
                          <label className="form-check-label small fw-semibold text-secondary" htmlFor="is_best_seller">Best Seller Badge</label>
                        </div>

                        <div className="form-check form-switch mb-3">
                          <input className="form-check-input" type="checkbox" id="is_trending" {...register("is_trending")} />
                          <label className="form-check-label small fw-semibold text-secondary" htmlFor="is_trending">Trending Badge</label>
                        </div>
                      </div>
                    </div>

                    {/* Inventory and specs */}
                    <div className="col-12 col-md-6">
                      <div className="card border-0 p-3 rounded-3 shadow-sm bg-white">
                        <h6 className="fw-bold text-dark mb-3">Inventory Codes & Stock</h6>
                        
                        <div className="row g-2">
                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">SKU Code</label>
                            <input type="text" className={`form-control wix-input ${errors.sku ? "is-invalid" : ""}`} {...register("sku")} placeholder="e.g. SLK-BAN-ROY" />
                            {errors.sku && <div className="invalid-feedback small mt-1">{errors.sku.message}</div>}
                          </div>
                          
                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Barcode</label>
                            <input type="text" className="form-control wix-input" {...register("barcode")} placeholder="UPC / EAN" />
                          </div>

                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Stock Quantity</label>
                            <input 
                              type="number" 
                              step="1" 
                              disabled={isVariantInventory}
                              className={`form-control wix-input ${errors.stock_quantity ? "is-invalid" : ""}`} 
                              {...register("stock_quantity", { valueAsNumber: true })} 
                            />
                            {isVariantInventory && <span className="fs-10 text-muted mt-1 d-block">Calculated from variant stocks.</span>}
                            {errors.stock_quantity && <div className="invalid-feedback small mt-1">{errors.stock_quantity.message}</div>}
                          </div>

                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Low Alert Threshold</label>
                            <input type="number" step="1" className={`form-control wix-input ${errors.low_stock_threshold ? "is-invalid" : ""}`} {...register("low_stock_threshold", { valueAsNumber: true })} />
                            {errors.low_stock_threshold && <div className="invalid-feedback small mt-1">{errors.low_stock_threshold.message}</div>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="col-12 col-md-6">
                      <div className="card border-0 p-3 rounded-3 shadow-sm bg-white h-100">
                        <h6 className="fw-bold text-dark mb-3">Pricing details</h6>
                        
                        <div className="row g-2">
                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Selling Price (₹)</label>
                            <input type="number" step="0.01" className={`form-control wix-input ${errors.price ? "is-invalid" : ""}`} {...register("price", { valueAsNumber: true })} />
                            {errors.price && <div className="invalid-feedback small mt-1">{errors.price.message}</div>}
                          </div>

                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Compare Price (₹)</label>
                            <input type="number" step="0.01" className="form-control wix-input" {...register("compare_at_price", { valueAsNumber: true })} />
                          </div>

                          <div className="col-12 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Cost Price (₹)</label>
                            <input type="number" step="0.01" className="form-control wix-input" {...register("cost_price", { valueAsNumber: true })} />
                            <span className="fs-9 text-muted">Used to calculate net revenue margins (confidential).</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category and brand association */}
                    <div className="col-12">
                      <div className="card border-0 p-3 rounded-3 shadow-sm bg-white">
                        <h6 className="fw-bold text-dark mb-3">Relations & Tags</h6>
                        
                        <div className="row g-2">
                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Category Group</label>
                            <select className="form-select" style={{ fontSize: "0.85rem" }} {...register("category_id")}>
                              <option value="">Select Category</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-6 mb-3">
                            <label className="form-label small fw-semibold text-secondary">Fabric Brand / Weaver</label>
                            <select className="form-select" style={{ fontSize: "0.85rem" }} {...register("brand_id")}>
                              <option value="">Select Brand</option>
                              {brands.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sizes and Colors Options */}
                    <div className="col-12">
                      <div className="card border-0 p-3 rounded-3 shadow-sm bg-white">
                        <h6 className="fw-bold text-dark mb-3">Sizes & Colors Options</h6>

                        <div className="mb-4 p-3 border border-light rounded-3 bg-light d-flex align-items-center justify-content-between">
                          <div>
                            <span className="fw-bold mb-1 text-dark small d-block">Variant Level Inventory</span>
                            <span className="text-secondary fs-9">Manage stock counts individually for each size variant instead of a single product quantity.</span>
                          </div>
                          <div className="form-check form-switch">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={isVariantInventory} 
                              onChange={(e) => setIsVariantInventory(e.target.checked)} 
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                        
                        <div className="row g-3">
                          {/* Colors Option (Required for both modes) */}
                          <div className="col-12 mb-2">
                            <label className="form-label small fw-semibold text-secondary">Colors</label>
                            <input 
                              type="text" 
                              value={colors} 
                              onChange={(e) => setColors(e.target.value)} 
                              placeholder="e.g. Crimson, Ivory, Charcoal" 
                              className="form-control wix-input" 
                            />
                            <span className="fs-9 text-muted d-block mt-1">Comma-separated colors (e.g. Crimson, Ivory, Charcoal)</span>
                          </div>

                          {!isVariantInventory ? (
                            <>
                              {/* Standard Sizes (Inches) */}
                              <div className="col-12 col-md-6">
                                <label className="form-label small fw-semibold text-secondary">Sizes (Inches)</label>
                                <input 
                                  type="text" 
                                  value={sizesInches} 
                                  onChange={(e) => setSizesInches(e.target.value)} 
                                  placeholder="e.g. 28, 30, 32, 34, 36" 
                                  className="form-control wix-input" 
                                />
                                <span className="fs-9 text-muted d-block mt-1">Comma-separated numeric inches (e.g. 28, 30, 32)</span>
                              </div>

                              {/* Standard Sizes (Letters) */}
                              <div className="col-12">
                                <label className="form-label small fw-semibold text-secondary d-block mb-2">Sizes (Letters)</label>
                                <div className="d-flex flex-wrap gap-3">
                                  {["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"].map((sz) => {
                                    const isChecked = sizesLetters.includes(sz);
                                    return (
                                      <div key={sz} className="form-check form-check-inline">
                                        <input 
                                          className="form-check-input" 
                                          type="checkbox" 
                                          id={`sz-${sz}`} 
                                          checked={isChecked} 
                                          onChange={() => {
                                            if (isChecked) {
                                              setSizesLetters(sizesLetters.filter((item) => item !== sz));
                                            } else {
                                              setSizesLetters([...sizesLetters, sz]);
                                            }
                                          }}
                                        />
                                        <label className="form-check-label small text-dark" htmlFor={`sz-${sz}`}>{sz}</label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Variant-Level Letters Inventory */}
                              <div className="col-12">
                                <label className="form-label small fw-semibold text-secondary d-block mb-2">Sizes (Letters) & Quantities</label>
                                <div className="row g-2">
                                  {["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"].map((sz) => {
                                    const matched = lettersInventory.find(i => i.size === sz);
                                    const isChecked = !!matched;
                                    return (
                                      <div key={sz} className="col-12 col-sm-6 col-md-4 d-flex align-items-center gap-2 mb-2 p-2 border border-light rounded bg-white">
                                        <div className="form-check m-0">
                                          <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id={`sz-var-${sz}`} 
                                            checked={isChecked} 
                                            onChange={() => {
                                              if (isChecked) {
                                                setLettersInventory(lettersInventory.filter(i => i.size !== sz));
                                              } else {
                                                setLettersInventory([...lettersInventory, { size: sz, quantity: 10 }]);
                                              }
                                            }}
                                          />
                                          <label className="form-check-label small text-dark fw-semibold" htmlFor={`sz-var-${sz}`}>{sz}</label>
                                        </div>
                                        {isChecked && (
                                          <input 
                                            type="number"
                                            min="0"
                                            value={matched.quantity}
                                            onChange={(e) => {
                                              const qty = Math.max(0, parseInt(e.target.value) || 0);
                                              setLettersInventory(lettersInventory.map(i => i.size === sz ? { ...i, quantity: qty } : i));
                                            }}
                                            className="form-control form-control-sm wix-input ms-auto"
                                            style={{ maxWidth: "80px", height: "30px" }}
                                            placeholder="Qty"
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Variant-Level Inches Inventory */}
                              <div className="col-12 mt-3">
                                <label className="form-label small fw-semibold text-secondary d-block mb-2">Sizes (Inches) & Quantities</label>
                                <div className="d-flex flex-column gap-2 mb-3">
                                  {inchesInventory.map((item, idx) => (
                                    <div key={idx} className="d-flex align-items-center gap-2">
                                      <div className="input-group input-group-sm" style={{ maxWidth: "160px" }}>
                                        <input 
                                          type="text" 
                                          value={item.size} 
                                          onChange={(e) => {
                                            const newInches = [...inchesInventory];
                                            newInches[idx].size = e.target.value;
                                            setInchesInventory(newInches);
                                          }}
                                          className="form-control wix-input" 
                                          placeholder="Size (e.g. 32)" 
                                          style={{ height: "32px" }}
                                        />
                                        <span className="input-group-text bg-light text-secondary small">&ldquo;</span>
                                      </div>
                                      
                                      <input 
                                        type="number" 
                                        min="0"
                                        value={item.quantity} 
                                        onChange={(e) => {
                                          const newInches = [...inchesInventory];
                                          newInches[idx].quantity = Math.max(0, parseInt(e.target.value) || 0);
                                          setInchesInventory(newInches);
                                        }}
                                        className="form-control form-control-sm wix-input" 
                                        placeholder="Qty" 
                                        style={{ maxWidth: "90px", height: "32px" }}
                                      />

                                      <button 
                                        type="button" 
                                        onClick={() => setInchesInventory(inchesInventory.filter((_, i) => i !== idx))} 
                                        className="btn btn-outline-danger btn-sm p-1 border-0"
                                        style={{ width: "32px", height: "32px" }}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setInchesInventory([...inchesInventory, { size: "", quantity: 10 }])}
                                  className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 fs-9 fw-semibold text-uppercase"
                                >
                                  <i className="bi bi-plus-lg me-1"></i> Add Inch Variant
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Showcase Images (Max 4, with 1 main selection) */}
                    <div className="col-12">
                      <div className="card border-0 p-3 rounded-3 shadow-sm bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-dark mb-0">Showcase Images (Max 4)</h6>
                          <span className="text-secondary small">{localImages.length} / 4 Images</span>
                        </div>

                        {/* Image Grid */}
                        <div className="row g-2 mb-3">
                          {localImages.map((img, idx) => (
                            <div key={idx} className="col-6 col-sm-3">
                              <div className="position-relative border rounded p-1 d-flex flex-column align-items-center bg-light">
                                <div className="w-100 overflow-hidden rounded bg-white d-flex align-items-center justify-content-center" style={{ height: "120px" }}>
                                  <img src={img.image_url} alt={`Upload ${idx}`} className="w-100 h-100 object-fit-cover" />
                                </div>
                                <div className="d-flex justify-content-between align-items-center w-100 mt-2 px-1">
                                  <label className="d-flex align-items-center gap-1 small text-secondary cursor-pointer m-0">
                                    <input 
                                      type="radio" 
                                      name="main_image" 
                                      checked={img.is_main} 
                                      onChange={() => handleSetMainImage(idx)} 
                                      className="form-check-input mt-0"
                                      style={{ width: "0.85rem", height: "0.85rem" }}
                                    />
                                    <span style={{ fontSize: "0.75rem" }}>Main</span>
                                  </label>
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveImage(idx)}
                                    className="btn btn-link text-danger p-0 border-0" 
                                    style={{ fontSize: "0.8rem", textDecoration: "none" }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                                {img.is_main && (
                                  <span className="position-absolute top-0 start-0 m-2 badge bg-primary" style={{ fontSize: "0.6rem" }}>Main</span>
                                )}
                              </div>
                            </div>
                          ))}

                          {localImages.length < 4 && (
                            <div className="col-6 col-sm-3">
                              <label 
                                className="border border-dashed rounded d-flex flex-column align-items-center justify-content-center bg-white cursor-pointer hover-bg-light" 
                                style={{ height: "155px", borderStyle: "dashed", borderWidth: "2px", borderColor: "#dee2e6", transition: "all 0.2s" }}
                              >
                                {uploadingImage ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm text-secondary mb-2" role="status"></span>
                                    <span className="text-secondary small fw-semibold">Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-cloud-arrow-up text-muted display-6 mb-2"></i>
                                    <span className="text-secondary small fw-semibold text-center px-2">Upload Image</span>
                                    <span className="text-muted text-center px-2" style={{ fontSize: "0.65rem" }}>PNG, JPG up to 5MB</span>
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  disabled={uploadingImage} 
                                  onChange={handleImageUpload} 
                                  className="d-none" 
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </form>
              </div>

              <div className="modal-footer border-top border-light p-4">
                <button type="button" className="btn btn-wix-outline" onClick={() => { setShowModal(false); setEditingProduct(null); setSizesInches(""); setSizesLetters([]); setColors(""); setIsVariantInventory(false); setLettersInventory([]); setInchesInventory([]); }}>Cancel</button>
                <button type="submit" form="product-form" disabled={submitting} className="btn btn-wix-primary">
                  {submitting ? "Saving..." : editingProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
