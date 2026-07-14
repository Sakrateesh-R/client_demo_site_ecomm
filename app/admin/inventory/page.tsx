"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function InventoryPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("restock");
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, low_stock_threshold")
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (adjustmentQty === 0) {
      toast.error("Adjustment quantity cannot be zero");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Recording stock adjustment...");

    try {
      const isPositive = adjustmentQty > 0;
      const absoluteQty = Math.abs(adjustmentQty);
      const newStockQty = selectedProduct.stock_quantity + adjustmentQty;

      if (newStockQty < 0) {
        throw new Error("Adjusted stock quantity cannot fall below zero");
      }

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized staff session");

      // 1. Insert inventory transaction log
      const { error: txError } = await supabase
        .from("inventory_transactions")
        .insert({
          product_id: selectedProduct.id,
          type: isPositive ? "in" : "out",
          quantity: absoluteQty,
          notes: `Adjustment Reason: ${adjustmentReason}`,
          reference_id: null
        });

      if (txError) throw txError;

      // 2. Update stock_quantity in products table
      const { error: prodError } = await supabase
        .from("products")
        .update({ stock_quantity: newStockQty, updated_at: new Date().toISOString() })
        .eq("id", selectedProduct.id);

      if (prodError) throw prodError;

      toast.success("Inventory adjusted successfully!", { id: toastId });
      setSelectedProduct(null);
      setAdjustmentQty(0);
      fetchInventory(); // Refresh stock listings
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Title block */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Inventory stock ledger
        </h2>
        <p className="text-secondary small">Monitor stock quantity and execute warehouse adjustments.</p>
      </div>

      <div className="row g-4">
        {/* Stock status list table */}
        <div className={selectedProduct ? "col-12 col-lg-8" : "col-12"}>
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary my-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-secondary small">Loading inventory list...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-box-seam text-muted display-4 mb-3 d-block"></i>
                <h5 className="text-dark fw-bold mb-1">Stock ledger is empty</h5>
                <p className="text-secondary small">Add products in your catalog to manage stock levels.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-hover border-0">
                  <thead>
                    <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Safety Alert Status</th>
                      <th className="text-center">Stock Level</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const isLowStock = prod.stock_quantity <= prod.low_stock_threshold;
                      return (
                        <tr key={prod.id} className="small border-bottom border-light">
                          <td>
                            <div className="fw-semibold text-dark">{prod.name}</div>
                          </td>
                          <td className="font-monospace text-secondary">{prod.sku}</td>
                          <td>
                            {isLowStock ? (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle fs-9 text-uppercase" style={{ fontSize: "0.65rem" }}>
                                <i className="bi bi-exclamation-triangle me-1"></i> Low Stock
                              </span>
                            ) : (
                              <span className="badge bg-success-subtle text-success border border-success-subtle fs-9 text-uppercase" style={{ fontSize: "0.65rem" }}>
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <h6 className={`mb-0 fw-bold ${isLowStock ? "text-danger" : "text-dark"}`}>
                              {prod.stock_quantity}
                            </h6>
                            <span className="text-muted fs-9">Limit: {prod.low_stock_threshold}</span>
                          </td>
                          <td className="text-end">
                            <button 
                              onClick={() => {
                                setSelectedProduct(prod);
                                setAdjustmentQty(0);
                              }}
                              className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fs-8 fw-semibold"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Adjust Stock Slider/Form Card */}
        {selectedProduct && (
          <div className="col-12 col-lg-4 animate-fade-in">
            <div className="card border-0 p-4 rounded-4 shadow-sm bg-white sticky-top" style={{ top: "90px" }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 text-dark" style={{ fontFamily: "var(--font-heading)" }}>Adjust Stock</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>

              <div className="alert bg-light border border-light text-dark mb-4 py-3 rounded-3">
                <h6 className="fw-bold text-dark small mb-1">{selectedProduct.name}</h6>
                <span className="text-secondary small">SKU: {selectedProduct.sku}</span>
                <div className="d-flex justify-content-between mt-2 pt-2 border-top border-secondary-subtle">
                  <span className="small text-secondary">Current Stock:</span>
                  <span className="fw-bold small">{selectedProduct.stock_quantity} units</span>
                </div>
              </div>

              <form onSubmit={handleAdjustmentSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Adjustment Units</label>
                  <input 
                    type="number" 
                    step="1"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)}
                    className="form-control wix-input"
                    placeholder="e.g. +15 or -5"
                  />
                  <div className="form-text fs-9 text-muted">
                    Use positive numbers to add stock, and negative numbers to write-off/reduce stock.
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Adjustment Reason</label>
                  <select 
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="form-select"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="restock">Procurement / Restock (+)</option>
                    <option value="audit">Inventory Audit Correction (+/-)</option>
                    <option value="returns">Customer Returns (+)</option>
                    <option value="damaged">Damaged / Written-off (-)</option>
                    <option value="theft">Lost / Missing Stock (-)</option>
                  </select>
                </div>

                {/* Final preview calculations */}
                <div className="d-flex justify-content-between mb-4 p-2 bg-light rounded-sm">
                  <span className="small text-secondary">New Stock Level:</span>
                  <span className={`fw-bold small ${selectedProduct.stock_quantity + adjustmentQty < 0 ? "text-danger" : "text-dark"}`}>
                    {selectedProduct.stock_quantity + adjustmentQty} units
                  </span>
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-wix-outline w-100" onClick={() => setSelectedProduct(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || selectedProduct.stock_quantity + adjustmentQty < 0} className="btn btn-wix-primary w-100">
                    {saving ? "Saving..." : "Apply"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
