"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  sort_order: z.number().min(0, "Sort order must be 0 or higher"),
  is_active: z.boolean(),
  is_popular: z.boolean(),
  is_new_collection: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catImageUrl, setCatImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      sort_order: 0,
      is_active: true,
      is_popular: false,
      is_new_collection: false,
    },
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (maximum size is 5MB)");
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading("Uploading category image...");

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
      setCatImageUrl(data.url);
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Error uploading image", { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditClick = (cat: any) => {
    setEditingCategory(cat);
    setCatImageUrl(cat.image_url || null);
    reset({
      name: cat.name,
      description: cat.description || "",
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active ?? true,
      is_popular: cat.is_popular ?? false,
      is_new_collection: cat.is_new_collection ?? false,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    setSubmitting(true);
    const toastId = toast.loading(editingCategory ? "Updating category..." : "Saving category...");

    try {
      const payload = {
        ...data,
        image_url: catImageUrl,
        ...(editingCategory ? { id: editingCategory.id } : {}),
      };

      const url = "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${editingCategory ? "update" : "create"} category`);
      }

      toast.success(editingCategory ? "Category updated successfully!" : "Category created successfully!", { id: toastId });
      setShowModal(false);
      setEditingCategory(null);
      reset();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || `Error ${editingCategory ? "updating" : "creating"} category`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const toastId = toast.loading("Deleting category...");

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully", { id: toastId });
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Error deleting category", { id: toastId });
    }
  };

  return (
    <div>
      {/* Title & Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Category Management
          </h2>
          <p className="text-secondary small mb-0">Organize and sort product families.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setCatImageUrl(null);
            reset({
              name: "",
              description: "",
              sort_order: 0,
              is_active: true,
              is_popular: false,
              is_new_collection: false,
            });
            setShowModal(true);
          }} 
          className="btn btn-wix-primary d-flex align-items-center gap-2 rounded-pill shadow-sm"
        >
          <i className="bi bi-plus-circle"></i>
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary my-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary small">Fetching categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-folder-x text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-dark fw-bold mb-1">No Categories Found</h5>
            <p className="text-secondary small">Add category groups to catalog your products.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover border-0">
              <thead>
                <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th>Image</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Homepage display</th>
                  <th>Status</th>
                  <th className="text-center">Sort Index</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="small border-bottom border-light">
                    <td>
                      <div 
                        className="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden" 
                        style={{ width: "36px", height: "36px" }}
                      >
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <i className="bi bi-folder text-secondary" style={{ fontSize: "1rem" }}></i>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{cat.name}</div>
                      <span className="text-muted fs-9 font-monospace">{cat.slug}</span>
                    </td>
                    <td className="text-secondary" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.description || <span className="text-muted small">No description</span>}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {cat.is_popular && (
                          <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: "0.6rem" }}>
                            Popular
                          </span>
                        )}
                        {cat.is_new_collection && (
                          <span className="badge rounded-pill bg-info-subtle text-info border border-info-subtle" style={{ fontSize: "0.6rem" }}>
                            New Collection
                          </span>
                        )}
                        {!cat.is_popular && !cat.is_new_collection && (
                          <span className="text-muted fs-9">None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill border ${
                        cat.is_active 
                          ? "bg-success-subtle text-success border-success" 
                          : "bg-secondary-subtle text-secondary border-secondary"
                      }`} style={{ fontSize: "0.65rem" }}>
                        {cat.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="text-center fw-semibold text-dark">{cat.sort_order}</td>
                    <td className="text-end">
                      <button 
                        onClick={() => handleEditClick(cat)}
                        className="btn btn-outline-primary btn-sm rounded-circle p-1 border-0 me-2"
                        style={{ width: "32px", height: "32px" }}
                        title="Edit Category"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="btn btn-outline-danger btn-sm rounded-circle p-1 border-0"
                        style={{ width: "32px", height: "32px" }}
                        title="Delete Category"
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

      {/* Add Category Modal Overlay */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom border-light p-4">
                <h5 className="modal-title fw-bold text-dark" style={{ fontFamily: "var(--font-heading)" }}>{editingCategory ? "Edit Category" : "Add Category"}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setEditingCategory(null); }}></button>
              </div>

              <div className="modal-body p-4 bg-light" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                <form id="category-form" onSubmit={handleSubmit(onSubmit)}>
                  {/* Cover Image Upload */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary d-block">Category Image</label>
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden" 
                        style={{ width: "80px", height: "80px", flexShrink: 0 }}
                      >
                        {catImageUrl ? (
                          <img src={catImageUrl} alt="Preview" className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <i className="bi bi-folder text-muted" style={{ fontSize: "1.5rem" }}></i>
                        )}
                      </div>
                      <div>
                        <label 
                          className="btn btn-wix-outline btn-sm m-0 cursor-pointer d-flex align-items-center gap-1"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {uploadingImage ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-cloud-arrow-up"></i>
                              Upload Image
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
                        {catImageUrl && (
                          <button 
                            type="button" 
                            onClick={() => setCatImageUrl(null)} 
                            className="btn btn-link text-danger btn-sm p-0 d-block mt-1"
                            style={{ fontSize: "0.75rem", textDecoration: "none" }}
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Category Name</label>
                    <input 
                      type="text" 
                      className={`form-control wix-input ${errors.name ? "is-invalid" : ""}`} 
                      {...register("name")} 
                      placeholder="e.g. Pashmina Cashmere" 
                    />
                    {errors.name && <div className="invalid-feedback small mt-1">{errors.name.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Description</label>
                    <textarea 
                      rows={3} 
                      className="form-control rounded-3" 
                      style={{ fontSize: "0.85rem" }} 
                      {...register("description")} 
                      placeholder="Describe the weaving materials, weights, etc." 
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Sort Priority Index</label>
                    <input 
                      type="number" 
                      step="1" 
                      className={`form-control wix-input ${errors.sort_order ? "is-invalid" : ""}`} 
                      {...register("sort_order", { valueAsNumber: true })} 
                    />
                    {errors.sort_order && <div className="invalid-feedback small mt-1">{errors.sort_order.message}</div>}
                  </div>

                  <hr className="my-3 text-muted" />

                  {/* Display Settings Toggles */}
                  <h6 className="fw-bold text-dark mb-3 small text-uppercase" style={{ letterSpacing: "0.5px" }}>Display Settings</h6>
                  
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="is_active" {...register("is_active")} />
                    <label className="form-check-label small fw-semibold text-secondary cursor-pointer" htmlFor="is_active">Publish Status (Active)</label>
                  </div>
                  
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="is_popular" {...register("is_popular")} />
                    <label className="form-check-label small fw-semibold text-secondary cursor-pointer" htmlFor="is_popular">Display in Popular Categories on Homepage</label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="is_new_collection" {...register("is_new_collection")} />
                    <label className="form-check-label small fw-semibold text-secondary cursor-pointer" htmlFor="is_new_collection">Display in New Collections on Homepage</label>
                  </div>
                </form>
              </div>

              <div className="modal-footer border-top border-light p-4">
                <button type="button" className="btn btn-wix-outline" onClick={() => { setShowModal(false); setEditingCategory(null); }}>Cancel</button>
                <button type="submit" form="category-form" disabled={submitting} className="btn btn-wix-primary">
                  {submitting ? "Saving..." : editingCategory ? "Update Category" : "Save Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
