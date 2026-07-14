"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

interface ComboSubProduct {
  product_id: string;
  name: string;
  sizes: string[];
}

export default function CombosAdminPage() {
  const supabase = createClient();
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [comboName, setComboName] = useState("");
  const [comboPrice, setComboPrice] = useState("");
  const [comboDesc, setComboDesc] = useState("");
  const [comboImageUrl, setComboImageUrl] = useState("");
  
  // Track selected sub-products and their selected sizes
  // Format: { [productId]: { selected: boolean, name: string, availableSizes: string[], selectedSizes: { [size]: boolean } } }
  const [productSelections, setProductSelections] = useState<Record<string, any>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch combos (products with is_combo metadata)
      const { data: comboList, error: comboErr } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .is("deleted_at", null)
        .like("meta_keywords", "%\"is_combo\":true%")
        .order("created_at", { ascending: false });

      if (comboErr) throw comboErr;
      setCombos(comboList || []);

      // 2. Fetch all products (to build combos from)
      const { data: productList, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .eq("is_active", true)
        .not("meta_keywords", "like", "%\"is_combo\":true%")
        .order("name", { ascending: true });

      if (prodErr) throw prodErr;
      setProducts(productList || []);

      // Initialize product selections structure
      const initialSelections: Record<string, any> = {};
      (productList || []).forEach((p) => {
        let availableSizes: string[] = [];
        if (p.meta_keywords) {
          try {
            const parsed = JSON.parse(p.meta_keywords);
            if (parsed.sizes_letters) {
              availableSizes = parsed.sizes_letters;
            } else if (parsed.sizes_inches) {
              availableSizes = parsed.sizes_inches.split(",").map((s: string) => s.trim()).filter(Boolean);
            }
          } catch (e) {}
        }
        
        // Fallback generic sizes if no sizes are defined
        if (availableSizes.length === 0) {
          availableSizes = ["Standard"];
        }

        const sizeChecks: Record<string, boolean> = {};
        availableSizes.forEach((sz) => {
          sizeChecks[sz] = true; // Checked by default
        });

        initialSelections[p.id] = {
          selected: false,
          name: p.name,
          availableSizes,
          selectedSizes: sizeChecks,
        };
      });
      setProductSelections(initialSelections);

    } catch (err: any) {
      toast.error(err.message || "Failed to load database records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductCheckChange = (prodId: string, checked: boolean) => {
    setProductSelections((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        selected: checked,
      },
    }));
  };

  const handleSizeCheckChange = (prodId: string, size: string, checked: boolean) => {
    setProductSelections((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        selectedSizes: {
          ...prev[prodId].selectedSizes,
          [size]: checked,
        },
      },
    }));
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboName.trim() || !comboPrice.trim()) {
      toast.error("Please fill in the Combo Name and Price.");
      return;
    }

    const priceNum = Number(comboPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price greater than 0.");
      return;
    }

    // Build combo_products list
    const selectedComboProducts: ComboSubProduct[] = [];
    Object.entries(productSelections).forEach(([prodId, details]) => {
      if (details.selected) {
        const checkedSizes = Object.entries(details.selectedSizes)
          .filter(([_, checked]) => checked)
          .map(([size]) => size);
        
        selectedComboProducts.push({
          product_id: prodId,
          name: details.name,
          sizes: checkedSizes,
        });
      }
    });

    if (selectedComboProducts.length === 0) {
      toast.error("Please select at least one product to bundle in this combo.");
      return;
    }

    // Check if any product has no sizes selected
    const missingSizes = selectedComboProducts.some((p) => p.sizes.length === 0);
    if (missingSizes) {
      toast.error("Each selected product in the combo must have at least one size chosen.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving combo bundle...");

    try {
      const slug = `${comboName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")}-${Date.now().toString().slice(-4)}`;

      const metaKeywords = JSON.stringify({
        is_combo: true,
        combo_products: selectedComboProducts,
      });

      // 1. Insert into products
      const { data: newProd, error: insertError } = await supabase
        .from("products")
        .insert({
          name: comboName,
          slug,
          price: priceNum,
          description: comboDesc,
          sku: `COMBO-${Date.now().toString().slice(-8)}`,
          stock_quantity: 99, // default placeholder
          is_active: true,
          meta_keywords: metaKeywords,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Insert image if provided
      if (comboImageUrl.trim()) {
        const { error: imgError } = await supabase
          .from("product_images")
          .insert({
            product_id: newProd.id,
            image_url: comboImageUrl.trim(),
            sort_order: 0,
            is_main: true,
          });
        
        if (imgError) console.error("Error inserting image link", imgError);
      }

      toast.success("Combo bundle created successfully!", { id: toastId });
      
      // Reset Form
      setComboName("");
      setComboPrice("");
      setComboDesc("");
      setComboImageUrl("");
      setShowModal(false);
      
      // Refresh combos list
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create combo product", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCombo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this combo?")) return;
    
    const toastId = toast.loading("Deleting combo...");
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Combo deleted successfully", { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error deleting combo", { id: toastId });
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Combo Management</h1>
          <p className="text-secondary small mb-0">Bundle multiple catalog items into promotional sets with customized pricing and sizes.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary rounded-pill px-4"
        >
          <i className="bi bi-plus-lg me-2"></i>Create Combo
        </button>
      </div>

      {/* Combos Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary my-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary small">Loading active combos...</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light table-light border-bottom border-light">
                <tr>
                  <th className="px-4 py-3 text-secondary small text-uppercase">Combo Name</th>
                  <th className="px-4 py-3 text-secondary small text-uppercase">Price</th>
                  <th className="px-4 py-3 text-secondary small text-uppercase">Items Bundled</th>
                  <th className="px-4 py-3 text-secondary small text-uppercase text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {combos.length > 0 ? (
                  combos.map((c) => {
                    let itemsCount = 0;
                    let itemsList = "";
                    if (c.meta_keywords) {
                      try {
                        const parsed = JSON.parse(c.meta_keywords);
                        if (parsed.combo_products) {
                          itemsCount = parsed.combo_products.length;
                          itemsList = parsed.combo_products.map((p: any) => `${p.name} (${p.sizes.join(", ")})`).join(" + ");
                        }
                      } catch (e) {}
                    }

                    const mainImg = c.product_images?.[0]?.image_url;

                    return (
                      <tr key={c.id}>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded overflow-hidden bg-light border border-light" style={{ width: "48px", height: "48px" }}>
                              {mainImg ? (
                                <img src={mainImg} alt={c.name} className="w-100 h-100 object-fit-cover" />
                              ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted"><i className="bi bi-box"></i></div>
                              )}
                            </div>
                            <div>
                              <span className="fw-semibold text-dark d-block">{c.name}</span>
                              <span className="text-secondary small text-truncate d-block" style={{ maxWidth: "250px" }}>{c.description || "No description provided."}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 fw-bold text-dark">₹{Number(c.price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1.5 rounded-sm small fw-semibold d-inline-block mb-1">
                            {itemsCount} Items
                          </span>
                          <p className="text-muted mb-0 small text-truncate" style={{ maxWidth: "400px" }} title={itemsList}>
                            {itemsList}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <button 
                            onClick={() => handleDeleteCombo(c.id)} 
                            className="btn btn-outline-danger btn-sm rounded-circle p-2 border-0"
                            title="Delete Combo"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-secondary small">
                      <i className="bi bi-box display-4 d-block mb-2 text-muted"></i>
                      No product combo bundles found in records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Combo Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom border-light p-4">
                <h5 className="modal-title fw-bold text-dark">Create Combo Bundle</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleCreateCombo}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Basic Info */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-bold">Combo Name</label>
                      <input 
                        type="text" 
                        required 
                        className="form-control rounded-3" 
                        placeholder="e.g. Silk Saree & Shawl Set"
                        value={comboName}
                        onChange={(e) => setComboName(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-bold">Bundle Price (₹)</label>
                      <input 
                        type="number" 
                        required 
                        className="form-control rounded-3" 
                        placeholder="e.g. 2999"
                        value={comboPrice}
                        onChange={(e) => setComboPrice(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-secondary small fw-bold">Image URL (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control rounded-3" 
                        placeholder="https://example.com/image.jpg"
                        value={comboImageUrl}
                        onChange={(e) => setComboImageUrl(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-secondary small fw-bold">Description</label>
                      <textarea 
                        className="form-control rounded-3" 
                        rows={2} 
                        placeholder="Provide details about the matching bundle products..."
                        value={comboDesc}
                        onChange={(e) => setComboDesc(e.target.value)}
                      />
                    </div>

                    {/* Product Selection checklist */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-dark border-bottom border-light pb-2 mb-3">Select Products & Sizes for Bundle</h6>
                      <div style={{ maxHeight: "300px", overflowY: "auto" }} className="border rounded-3 p-3 bg-light">
                        {products.length > 0 ? (
                          products.map((p) => {
                            const isChecked = productSelections[p.id]?.selected;
                            const availableSizes = productSelections[p.id]?.availableSizes || [];
                            return (
                              <div key={p.id} className="p-3 mb-2 rounded bg-white border border-light shadow-sm">
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id={`check-${p.id}`}
                                    checked={!!isChecked}
                                    onChange={(e) => handleProductCheckChange(p.id, e.target.checked)}
                                  />
                                  <label className="form-check-label fw-semibold text-dark" htmlFor={`check-${p.id}`}>
                                    {p.name} <span className="text-secondary small fw-normal">(SKU: {p.sku || "N/A"})</span>
                                  </label>
                                </div>
                                
                                {isChecked && (
                                  <div className="mt-3 ps-4 border-start border-primary border-2 ms-2">
                                    <span className="text-secondary small fw-bold d-block mb-2">Available Sizes in Combo:</span>
                                    <div className="d-flex flex-wrap gap-2">
                                      {availableSizes.map((sz: string) => (
                                        <div key={sz} className="form-check form-check-inline border rounded px-2.5 py-1 bg-light">
                                          <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id={`size-${p.id}-${sz}`}
                                            checked={!!productSelections[p.id]?.selectedSizes[sz]}
                                            onChange={(e) => handleSizeCheckChange(p.id, sz, e.target.checked)}
                                          />
                                          <label className="form-check-label small font-monospace text-dark" htmlFor={`size-${p.id}-${sz}`}>
                                            {sz}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-secondary small">No active inventory products found to select.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top border-light p-4">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary rounded-pill px-4">
                    {submitting ? "Saving..." : "Save Combo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
