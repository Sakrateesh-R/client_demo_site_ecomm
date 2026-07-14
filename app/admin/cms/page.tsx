"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function CMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Layout section switches
  const [showHero, setShowHero] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showCollections, setShowCollections] = useState(true);
  const [showSeasonal, setShowSeasonal] = useState(true);
  const [showOffers, setShowOffers] = useState(true);
  const [showWhyChooseUs, setShowWhyChooseUs] = useState(true);
  const [showTestimonial, setShowTestimonial] = useState(true);
  const [showInstagram, setShowInstagram] = useState(true);
  const [enableFreeShipping, setEnableFreeShipping] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("100");

  // Hero Banners slide configurations
  const [heroBanners, setHeroBanners] = useState<any[]>([
    {
      id: "card-1",
      title: "Royal Banarasi Silk",
      subtitle: "Saree Collection",
      image_url: "/images/hero-silk.png",
      redirection_url: "#seasonal-picks",
      bg_color: "#2b568c",
      is_double_width: true,
    },
    {
      id: "card-2",
      title: "Artisan Pashmina",
      subtitle: "Fine Cashmere",
      image_url: "/images/hero-cashmere.png",
      redirection_url: "#seasonal-picks",
      bg_color: "#cf6752",
      is_double_width: false,
    },
    {
      id: "card-3",
      title: "Organic Weaves",
      subtitle: "Linens",
      image_url: "/images/hero-linen.png",
      redirection_url: "#seasonal-picks",
      bg_color: "#e8c973",
      is_double_width: false,
    },
  ]);

  const fetchCMSConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load CMS settings");
      const data = await res.json();

      if (data.cms) {
        setShowHero(data.cms.show_hero_section !== "false");
        setShowCategories(data.cms.show_categories_section !== "false");
        setShowCollections(data.cms.show_collections_section !== "false");
        setShowSeasonal(data.cms.show_seasonal_section !== "false");
        setShowOffers(data.cms.show_offers_section !== "false");
        setShowWhyChooseUs(data.cms.show_why_choose_us_section !== "false");
        setShowTestimonial(data.cms.show_testimonial_section !== "false");
        setShowInstagram(data.cms.show_instagram_section !== "false");
        setEnableFreeShipping(data.cms.enable_free_shipping !== "false");
        setFreeShippingThreshold(data.cms.free_shipping_threshold || "100");

        if (data.cms.hero_banners_json) {
          try {
            setHeroBanners(JSON.parse(data.cms.hero_banners_json));
          } catch (e) {
            // Fallback to default state
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load layouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSConfigs();
  }, []);

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (maximum size is 5MB)");
      return;
    }

    setUploadingIndex(idx);
    const toastId = toast.loading(`Uploading image for slide ${idx + 1}...`);

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
      
      const updatedBanners = [...heroBanners];
      updatedBanners[idx] = {
        ...updatedBanners[idx],
        image_url: data.url,
      };
      setHeroBanners(updatedBanners);
      
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Error uploading image", { id: toastId });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Updating homepage layout configurations...");

    try {
      const settingsList = [
        { key: "show_hero_section", value: showHero ? "true" : "false", group: "cms" },
        { key: "show_categories_section", value: showCategories ? "true" : "false", group: "cms" },
        { key: "show_collections_section", value: showCollections ? "true" : "false", group: "cms" },
        { key: "show_seasonal_section", value: showSeasonal ? "true" : "false", group: "cms" },
        { key: "show_offers_section", value: showOffers ? "true" : "false", group: "cms" },
        { key: "show_why_choose_us_section", value: showWhyChooseUs ? "true" : "false", group: "cms" },
        { key: "show_testimonial_section", value: showTestimonial ? "true" : "false", group: "cms" },
        { key: "show_instagram_section", value: showInstagram ? "true" : "false", group: "cms" },
        { key: "enable_free_shipping", value: enableFreeShipping ? "true" : "false", group: "cms" },
        { key: "free_shipping_threshold", value: freeShippingThreshold, group: "cms" },
        { key: "hero_banners_json", value: JSON.stringify(heroBanners), group: "cms" },
      ];

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsList }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save CMS layout");
      }

      toast.success("Storefront layout updated successfully!", { id: toastId });
      fetchCMSConfigs();
    } catch (err: any) {
      toast.error(err.message || "Failed to update layout configurations", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary my-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary small">Loading modular CMS engine...</p>
      </div>
    );
  }

  const sections = [
    { title: "Hero Banner", desc: "Topographic grid showing portrait textile collection image blocks and primary calls-to-action.", checked: showHero, setChecked: setShowHero },
    { title: "Popular Categories", desc: "Horizontal circular oval cropped image blocks showing fabric catalog categories.", checked: showCategories, setChecked: setShowCategories },
    { title: "New Collections", desc: "Three-column showcases featuring winter shawls, bridal silks, and organic linen packs.", checked: showCollections, setChecked: setShowCollections },
    { title: "Seasonal Picks", desc: "Four-column product listing featuring fabric ratings, prices, and direct checkout routes.", checked: showSeasonal, setChecked: setShowSeasonal },
    { title: "Best Offers Group", desc: "Sales catalog layout displaying active discounts, margins, and comparative price tag indicators.", checked: showOffers, setChecked: setShowOffers },
    { title: "Value Grid (Why Choose Us)", desc: "Four-column layout showing delivery speeds, concierge assistance, and ratings.", checked: showWhyChooseUs, setChecked: setShowWhyChooseUs },
    { title: "Client Testimonials", desc: "Artistic Playfair display layout presenting reviews and endorsements from fashion houses.", checked: showTestimonial, setChecked: setShowTestimonial },
    { title: "Instagram Connect Gallery", desc: "Photographic gallery displaying handloom manufacturing processes.", checked: showInstagram, setChecked: setShowInstagram },
  ];

  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Homepage Layout Builder
        </h2>
        <p className="text-secondary small">Enable, disable, or adjust frontend showroom sections dynamically without code deployments.</p>
      </div>

      <form onSubmit={handleSaveCMS}>
        {/* Modular Sections Switcher */}
        <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
          <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">Modular Homepage Sections</h5>

          <div className="d-flex flex-column gap-3">
            {sections.map((sec, idx) => (
              <div 
                key={idx} 
                className="p-3 border border-light rounded-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-3"
              >
                <div style={{ maxWidth: "580px" }}>
                  <h6 className="fw-bold mb-1 text-dark small">{sec.title}</h6>
                  <span className="text-secondary fs-9">{sec.desc}</span>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={sec.checked} 
                    onChange={(e) => sec.setChecked(e.target.checked)} 
                    style={{ cursor: "pointer" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Promotions Settings */}
        <div className="card border-0 p-4 rounded-4 shadow-sm bg-white mt-4">
          <h5 className="h6 fw-bold text-dark mb-1 text-uppercase tracking-wider">Shipping Promotions</h5>
          <p className="text-secondary small mb-4">Configure free shipping thresholds displayed in client shopping bags.</p>

          <div className="p-3 border border-light rounded-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div style={{ maxWidth: "480px" }}>
              <h6 className="fw-bold mb-1 text-dark small">Enable Free Shipping Promotion</h6>
              <span className="text-secondary fs-9">When toggled on, show the shipping target progress bar in the shopping cart.</span>
            </div>
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={enableFreeShipping} 
                onChange={(e) => setEnableFreeShipping(e.target.checked)} 
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          {enableFreeShipping && (
            <div className="mt-3 p-3 border border-light rounded-3 bg-white" style={{ maxWidth: "340px" }}>
              <label className="form-label small fw-semibold text-secondary mb-1">Free Shipping Threshold ($)</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-secondary small border-end-0 rounded-start-pill">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={freeShippingThreshold} 
                  onChange={(e) => setFreeShippingThreshold(e.target.value)} 
                  className="form-control wix-input rounded-end-pill border-start-0" 
                  style={{ fontSize: "0.85rem", height: "38px" }}
                  placeholder="e.g. 100.00" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Hero Section Banners Management */}
        <div className="card border-0 p-4 rounded-4 shadow-sm bg-white mt-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="h6 fw-bold text-dark mb-1 text-uppercase tracking-wider">Hero Section Banner Slides</h5>
              <p className="text-secondary small mb-0">Manage the three primary billboard slides displayed at the top of the homepage.</p>
            </div>
            <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-2 rounded-pill small fw-semibold">3 Slots Active</span>
          </div>

          <div className="row g-4">
            {heroBanners.map((banner, idx) => (
              <div key={banner.id || idx} className="col-12 col-lg-4">
                <div className="p-3 border border-light rounded-3 bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold text-dark small">
                        Banner {idx + 1} {banner.is_double_width ? "(Double Width)" : "(Single Width)"}
                      </span>
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle fs-9">
                        {banner.id}
                      </span>
                    </div>

                    {/* Image Preview / Upload Container */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary d-block">Slide Image</label>
                      <div className="position-relative bg-white border rounded overflow-hidden mb-2 d-flex align-items-center justify-content-center" style={{ height: "140px" }}>
                        {banner.image_url ? (
                          <img src={banner.image_url} alt="Banner Preview" className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <i className="bi bi-image text-muted fs-1"></i>
                        )}
                        {uploadingIndex === idx && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center text-white">
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            <span className="small">Uploading...</span>
                          </div>
                        )}
                      </div>
                      <label className="btn btn-wix-outline btn-sm w-100 cursor-pointer text-center m-0">
                        <i className="bi bi-cloud-arrow-up me-1"></i> Replace Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={uploadingIndex !== null} 
                          onChange={(e) => handleBannerImageUpload(e, idx)} 
                          className="d-none" 
                        />
                      </label>
                    </div>

                    {/* Form Fields */}
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-secondary">Subtitle / Label (e.g. SAREE COLLECTION)</label>
                      <input 
                        type="text" 
                        className="form-control wix-input bg-white"
                        value={banner.subtitle || ""}
                        onChange={(e) => {
                          const updated = [...heroBanners];
                          updated[idx] = { ...updated[idx], subtitle: e.target.value };
                          setHeroBanners(updated);
                        }}
                        placeholder="e.g. SAREE COLLECTION"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-secondary">Main Title (e.g. Royal Banarasi Silk)</label>
                      <input 
                        type="text" 
                        className="form-control wix-input bg-white"
                        value={banner.title || ""}
                        onChange={(e) => {
                          const updated = [...heroBanners];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setHeroBanners(updated);
                        }}
                        placeholder="e.g. Royal Banarasi Silk"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-secondary">Redirection Link / URL</label>
                      <input 
                        type="text" 
                        className="form-control wix-input bg-white"
                        value={banner.redirection_url || ""}
                        onChange={(e) => {
                          const updated = [...heroBanners];
                          updated[idx] = { ...updated[idx], redirection_url: e.target.value };
                          setHeroBanners(updated);
                        }}
                        placeholder="e.g. #seasonal-picks or /categories/silk"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-secondary">Card Background Color</label>
                      <input 
                        type="color" 
                        className="form-control form-control-color w-100 rounded-3 border-light bg-white"
                        value={banner.bg_color || "#2b568c"}
                        onChange={(e) => {
                          const updated = [...heroBanners];
                          updated[idx] = { ...updated[idx], bg_color: e.target.value };
                          setHeroBanners(updated);
                        }}
                        title="Choose card background color"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="d-flex justify-content-end mt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="btn btn-wix-primary px-5 rounded-pill shadow-sm"
          >
            {saving ? "Publishing Layout..." : "Publish Layout Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
