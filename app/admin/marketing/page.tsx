"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

const couponSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  discount_type: z.enum(["fixed", "percentage"]),
  discount_value: z.number().min(0, "Discount value must be positive"),
  min_order_amount: z.number().min(0, "Minimum purchase must be positive"),
  expires_at: z.string().min(1, "Expiration date is required"),
  usage_limit: z.number().min(0).optional().or(z.literal("")),
  is_active: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function MarketingPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_amount: 0,
      expires_at: "",
      usage_limit: "",
      is_active: true,
    },
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      if (!res.ok) throw new Error("Failed to load campaigns");
      const data = await res.json();
      setCoupons(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleEditClick = (coupon: any) => {
    setEditingCoupon(coupon);
    
    // Format ISO string to YYYY-MM-DD
    let formattedDate = "";
    if (coupon.expires_at) {
      formattedDate = new Date(coupon.expires_at).toISOString().split('T')[0];
    }
    
    reset({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      min_order_amount: Number(coupon.min_order_amount),
      expires_at: formattedDate,
      usage_limit: coupon.usage_limit || "",
      is_active: coupon.is_active,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: CouponFormValues) => {
    setSubmitting(true);
    const toastId = toast.loading(editingCoupon ? "Updating coupon campaign..." : "Saving coupon campaign...");

    try {
      const payload = {
        ...data,
        starts_at: editingCoupon ? editingCoupon.starts_at : new Date().toISOString(),
        expires_at: new Date(data.expires_at).toISOString(),
        usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
      };

      const url = "/api/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${editingCoupon ? "update" : "create"} campaign`);
      }

      toast.success(editingCoupon ? "Coupon campaign updated successfully!" : "Coupon campaign created successfully!", { id: toastId });
      setShowModal(false);
      setEditingCoupon(null);
      reset();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || `Error ${editingCoupon ? "updating" : "creating"} coupon`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    const toastId = toast.loading("Deleting coupon...");

    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete coupon");
      }

      toast.success("Coupon deleted successfully", { id: toastId });
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Error deleting coupon", { id: toastId });
    }
  };

  return (
    <div>
      {/* Title & Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Campaign & Coupons
          </h2>
          <p className="text-secondary small mb-0">Create promotional discount codes and flash offers.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCoupon(null);
            reset({
              code: "",
              discount_type: "percentage",
              discount_value: 10,
              min_order_amount: 0,
              expires_at: "",
              usage_limit: "",
              is_active: true,
            });
            setShowModal(true);
          }} 
          className="btn btn-wix-primary d-flex align-items-center gap-2 rounded-pill shadow-sm"
        >
          <i className="bi bi-plus-circle"></i>
          Add Coupon Code
        </button>
      </div>

      {/* Coupons Table */}
      <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary my-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary small">Loading campaigns...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-percent text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-dark fw-bold mb-1">No Coupons Found</h5>
            <p className="text-secondary small">Create coupon campaigns to incentivize storefront transactions.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover border-0">
              <thead>
                <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th>Coupon Code</th>
                  <th>Discount Details</th>
                  <th>Min Spend</th>
                  <th>Expiration Date</th>
                  <th>Limit</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="small border-bottom border-light">
                    <td>
                      <div className="fw-bold text-primary font-monospace">{c.code}</div>
                    </td>
                    <td className="text-dark fw-semibold">
                      {c.discount_type === "percentage" 
                        ? `${c.discount_value}% Off` 
                        : `$${c.discount_value} Off`}
                    </td>
                    <td className="text-secondary">${Number(c.min_order_amount).toFixed(2)}</td>
                    <td className="text-secondary">
                      {c.expires_at 
                        ? new Date(c.expires_at).toLocaleDateString() 
                        : <span className="text-muted small">No Expiration</span>}
                    </td>
                    <td className="text-secondary">
                      {c.usage_limit ? `${c.usage_count || 0} / ${c.usage_limit}` : "Unlimited"}
                    </td>
                    <td>
                      <span className={`badge rounded-pill border ${
                        c.is_active 
                          ? "bg-success-subtle text-success border-success" 
                          : "bg-secondary-subtle text-secondary border-secondary"
                      }`} style={{ fontSize: "0.65rem" }}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button 
                        onClick={() => handleEditClick(c)}
                        className="btn btn-outline-primary btn-sm rounded-circle p-1 border-0 me-2"
                        style={{ width: "32px", height: "32px" }}
                        title="Edit Coupon"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="btn btn-outline-danger btn-sm rounded-circle p-1 border-0"
                        style={{ width: "32px", height: "32px" }}
                        title="Delete Coupon"
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

      {/* Add Coupon Modal Overlay */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom border-light p-4">
                <h5 className="modal-title fw-bold text-dark" style={{ fontFamily: "var(--font-heading)" }}>{editingCoupon ? "Edit Coupon Code" : "Add Coupon Code"}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditingCoupon(null); }}></button>
              </div>

              <div className="modal-body p-4 bg-light" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                <form id="coupon-form" onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Coupon Code</label>
                    <input 
                      type="text" 
                      className={`form-control wix-input ${errors.code ? "is-invalid" : ""}`} 
                      {...register("code")} 
                      placeholder="e.g. WELCOME50" 
                    />
                    {errors.code && <div className="invalid-feedback small mt-1">{errors.code.message}</div>}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Discount Type</label>
                      <select className="form-select" style={{ fontSize: "0.85rem" }} {...register("discount_type")}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Dollar ($)</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Value</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className={`form-control wix-input ${errors.discount_value ? "is-invalid" : ""}`} 
                        {...register("discount_value", { valueAsNumber: true })} 
                      />
                      {errors.discount_value && <div className="invalid-feedback small mt-1">{errors.discount_value.message}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Minimum Basket Purchase ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className={`form-control wix-input ${errors.min_order_amount ? "is-invalid" : ""}`} 
                      {...register("min_order_amount", { valueAsNumber: true })} 
                    />
                    {errors.min_order_amount && <div className="invalid-feedback small mt-1">{errors.min_order_amount.message}</div>}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Usage Count Limit</label>
                      <input 
                        type="number" 
                        step="1" 
                        className="form-control wix-input" 
                        {...register("usage_limit", { valueAsNumber: true })} 
                        placeholder="e.g. 100"
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Expiration Date</label>
                      <input 
                        type="date" 
                        className={`form-control wix-input ${errors.expires_at ? "is-invalid" : ""}`} 
                        {...register("expires_at")} 
                      />
                      {errors.expires_at && <div className="invalid-feedback small mt-1">{errors.expires_at.message}</div>}
                    </div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="is_active" {...register("is_active")} />
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="is_active">Enable Campaign (Active)</label>
                  </div>
                </form>
              </div>

              <div className="modal-footer border-top border-light p-4">
                <button type="button" className="btn btn-wix-outline" onClick={() => { setShowModal(false); setEditingCoupon(null); }}>Cancel</button>
                <button type="submit" form="coupon-form" disabled={submitting} className="btn btn-wix-primary">
                  {submitting ? "Saving..." : editingCoupon ? "Update Coupon" : "Save Coupon"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
