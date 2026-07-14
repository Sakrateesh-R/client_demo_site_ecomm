"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  logo_url: z.string().url("Please enter a valid URL").or(z.literal("")),
  description: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      logo_url: "",
      description: "",
    },
  });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands");
      if (!res.ok) throw new Error("Failed to load brands");
      const data = await res.json();
      setBrands(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleEditClick = (brand: any) => {
    setEditingBrand(brand);
    reset({
      name: brand.name,
      logo_url: brand.logo_url || "",
      description: brand.description || "",
    });
    setShowModal(true);
  };

  const onSubmit = async (data: BrandFormValues) => {
    setSubmitting(true);
    const toastId = toast.loading(editingBrand ? "Updating brand..." : "Saving brand...");

    try {
      const payload = {
        ...data,
        ...(editingBrand ? { id: editingBrand.id } : {}),
      };

      const url = "/api/brands";
      const method = editingBrand ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${editingBrand ? "update" : "create"} brand`);
      }

      toast.success(editingBrand ? "Brand updated successfully!" : "Brand created successfully!", { id: toastId });
      setShowModal(false);
      setEditingBrand(null);
      reset();
      fetchBrands();
    } catch (err: any) {
      toast.error(err.message || `Error ${editingBrand ? "updating" : "creating"} brand`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    const toastId = toast.loading("Deleting brand...");

    try {
      const res = await fetch(`/api/brands?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete brand");
      }

      toast.success("Brand deleted successfully", { id: toastId });
      fetchBrands();
    } catch (err: any) {
      toast.error(err.message || "Error deleting brand", { id: toastId });
    }
  };

  return (
    <div>
      {/* Title & Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Brand Management
          </h2>
          <p className="text-secondary small mb-0">Manage fabric mills, artisans, and weavers.</p>
        </div>
        <button 
          onClick={() => {
            setEditingBrand(null);
            reset({
              name: "",
              logo_url: "",
              description: "",
            });
            setShowModal(true);
          }} 
          className="btn btn-wix-primary d-flex align-items-center gap-2 rounded-pill shadow-sm"
        >
          <i className="bi bi-plus-circle"></i>
          Add Brand
        </button>
      </div>

      {/* Brands Table */}
      <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary my-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary small">Fetching brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-award text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-dark fw-bold mb-1">No Brands Found</h5>
            <p className="text-secondary small">Add weaver brands or fabric origins to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover border-0">
              <thead>
                <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th>Brand Name</th>
                  <th>Slug URL</th>
                  <th>Description</th>
                  <th>Logo Link</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((br) => (
                  <tr key={br.id} className="small border-bottom border-light">
                    <td>
                      <div className="fw-bold text-dark">{br.name}</div>
                    </td>
                    <td className="font-monospace text-secondary">{br.slug}</td>
                    <td className="text-secondary" style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {br.description || <span className="text-muted small">No description</span>}
                    </td>
                    <td className="text-secondary font-monospace" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {br.logo_url || <span className="text-muted small">None</span>}
                    </td>
                    <td className="text-end">
                      <button 
                        onClick={() => handleEditClick(br)}
                        className="btn btn-outline-primary btn-sm rounded-circle p-1 border-0 me-2"
                        style={{ width: "32px", height: "32px" }}
                        title="Edit Brand"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(br.id)}
                        className="btn btn-outline-danger btn-sm rounded-circle p-1 border-0"
                        style={{ width: "32px", height: "32px" }}
                        title="Delete Brand"
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

      {/* Add Brand Modal Overlay */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom border-light p-4">
                <h5 className="modal-title fw-bold text-dark" style={{ fontFamily: "var(--font-heading)" }}>{editingBrand ? "Edit Brand" : "Add Brand"}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditingBrand(null); }}></button>
              </div>

              <div className="modal-body p-4 bg-light" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                <form id="brand-form" onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Brand Name</label>
                    <input 
                      type="text" 
                      className={`form-control wix-input ${errors.name ? "is-invalid" : ""}`} 
                      {...register("name")} 
                      placeholder="e.g. Royal Handlooms" 
                    />
                    {errors.name && <div className="invalid-feedback small mt-1">{errors.name.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Logo Asset URL</label>
                    <input 
                      type="text" 
                      className={`form-control wix-input ${errors.logo_url ? "is-invalid" : ""}`} 
                      {...register("logo_url")} 
                      placeholder="https://example.com/logo.png" 
                    />
                    {errors.logo_url && <div className="invalid-feedback small mt-1">{errors.logo_url.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Description</label>
                    <textarea 
                      rows={3} 
                      className="form-control rounded-3" 
                      style={{ fontSize: "0.85rem" }} 
                      {...register("description")} 
                      placeholder="Describe the weaver mill's history, specialties, etc." 
                    />
                  </div>
                </form>
              </div>

              <div className="modal-footer border-top border-light p-4">
                <button type="button" className="btn btn-wix-outline" onClick={() => { setShowModal(false); setEditingBrand(null); }}>Cancel</button>
                <button type="submit" form="brand-form" disabled={submitting} className="btn btn-wix-primary">
                  {submitting ? "Saving..." : editingBrand ? "Update Brand" : "Save Brand"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
