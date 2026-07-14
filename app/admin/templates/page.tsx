"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface TemplateTheme {
  id: string;
  name: string;
  desc: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  bodyFont: string;
  headingFont: string;
  previewUrl: string;
}

export default function TemplateManagementPage() {
  const [activeTheme, setActiveTheme] = useState("theme-classic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const themes: TemplateTheme[] = [
    {
      id: "theme-classic",
      name: "Classic Royal",
      desc: "Wix-style vibrant electric blue with terracotta peach accents, coupled with modern typography. Elegant and clean.",
      primaryColor: "#1b88e5",
      secondaryColor: "#e07a5f",
      bgColor: "#fbf9f6",
      textColor: "#1b1d21",
      bodyFont: "Plus Jakarta Sans",
      headingFont: "Plus Jakarta Sans",
      previewUrl: "/images/hero-silk.png"
    },
    {
      id: "theme-emerald",
      name: "Emerald Luxe",
      desc: "Deep Forest Emerald green with luxurious champagne gold tones. Perfect for high-end boutique apparel.",
      primaryColor: "#115e59",
      secondaryColor: "#bb8a52",
      bgColor: "#f4f6f5",
      textColor: "#0b1c18",
      bodyFont: "Outfit",
      headingFont: "Cinzel",
      previewUrl: "/images/hero-cashmere.png"
    },
    {
      id: "theme-crimson",
      name: "Crimson Silk",
      desc: "Contemporary Indian heritage look using crimson red and burnt saffron accents. Warm, artistic, and rich.",
      primaryColor: "#991b1b",
      secondaryColor: "#d97706",
      bgColor: "#fffbf4",
      textColor: "#1e0b11",
      bodyFont: "Montserrat",
      headingFont: "Prata",
      previewUrl: "/images/hero-linen.png"
    }
  ];

  const fetchThemeSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.cms && data.cms.active_theme) {
          setActiveTheme(data.cms.active_theme);
        }
      }
    } catch (e) {
      console.error("Failed to load theme settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemeSettings();
  }, []);

  const handleActivateTheme = async (themeId: string) => {
    setSaving(true);
    const toastId = toast.loading(`Activating ${themes.find(t => t.id === themeId)?.name || "theme"} template...`);

    try {
      const settingsList = [
        { key: "active_theme", value: themeId, group: "cms" }
      ];

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsList })
      });

      if (!res.ok) {
        throw new Error("Failed to activate theme template");
      }

      setActiveTheme(themeId);
      toast.success("Storefront template updated successfully!", { id: toastId });
      
      // Reload page to re-render server layouts
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      toast.error(err.message || "Failed to update templates", { id: toastId });
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
        <p className="text-secondary small">Loading theme engine...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Template Management
        </h2>
        <p className="text-secondary small mb-0">Configure colors and typography globally on the shopper storefront.</p>
      </div>

      <div className="row g-4">
        {themes.map((theme) => {
          const isActive = activeTheme === theme.id;
          return (
            <div key={theme.id} className="col-12 col-md-4">
              <div 
                className={`card border-0 rounded-4 shadow-sm h-100 overflow-hidden bg-white ${
                  isActive ? "ring-2 ring-primary border border-primary" : "border border-light"
                }`}
                style={{ 
                  transition: "all 0.3s ease",
                  borderWidth: isActive ? "2px" : "1px"
                }}
              >
                {/* Header preview box */}
                <div 
                  className="p-4 d-flex flex-column justify-content-between text-white" 
                  style={{ 
                    backgroundColor: theme.primaryColor,
                    height: "140px",
                    fontFamily: theme.headingFont
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="fs-5 fw-bold">{theme.name}</span>
                    {isActive && (
                      <span className="badge bg-white text-dark border border-white px-2.5 py-1 rounded-pill small fw-bold" style={{ fontSize: "0.65rem" }}>
                        Active Template
                      </span>
                    )}
                  </div>
                  
                  <div className="d-flex align-items-center gap-2">
                    <span 
                      className="rounded-circle d-inline-block border border-light" 
                      style={{ width: "24px", height: "24px", backgroundColor: theme.primaryColor }}
                      title="Primary Color"
                    />
                    <span 
                      className="rounded-circle d-inline-block border border-light" 
                      style={{ width: "24px", height: "24px", backgroundColor: theme.secondaryColor }}
                      title="Secondary Color"
                    />
                    <span 
                      className="rounded-circle d-inline-block border border-light" 
                      style={{ width: "24px", height: "24px", backgroundColor: theme.bgColor }}
                      title="Background Color"
                    />
                    <span 
                      className="rounded-circle d-inline-block border border-light" 
                      style={{ width: "24px", height: "24px", backgroundColor: theme.textColor }}
                      title="Text Color"
                    />
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <p className="text-secondary small mb-4" style={{ height: "66px", overflow: "hidden", lineHeight: "1.6" }}>
                      {theme.desc}
                    </p>

                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-light">
                        <span className="text-secondary small">Heading Font</span>
                        <span className="fw-bold text-dark small" style={{ fontFamily: theme.headingFont }}>{theme.headingFont}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary small">Body Font</span>
                        <span className="fw-semibold text-dark small" style={{ fontFamily: theme.bodyFont }}>{theme.bodyFont}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleActivateTheme(theme.id)}
                    disabled={isActive || saving}
                    className={`btn rounded-pill w-100 py-2 fw-semibold ${
                      isActive 
                        ? "btn-secondary text-white cursor-not-allowed" 
                        : "btn-wix-primary"
                    }`}
                  >
                    {isActive ? "Currently Active" : "Activate Template"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Section */}
      <div className="card border-0 p-4 rounded-4 shadow-sm bg-white mt-4">
        <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">Storefront Style Preview</h5>
        
        <div className="row g-4">
          {themes.map((theme) => {
            const isSelected = activeTheme === theme.id;
            return (
              <div key={theme.id} className="col-12 col-md-4">
                <div 
                  className="p-3 border rounded-3 text-start" 
                  style={{ 
                    backgroundColor: theme.bgColor, 
                    color: theme.textColor,
                    fontFamily: theme.bodyFont,
                    opacity: isSelected ? 1 : 0.6,
                    border: isSelected ? `2px solid ${theme.primaryColor}` : "1px solid #dee2e6"
                  }}
                >
                  <h6 className="fw-bold mb-2" style={{ fontFamily: theme.headingFont, color: theme.textColor }}>
                    {theme.name} Sample Card
                  </h6>
                  <p className="small mb-3 text-secondary">
                    Artisan fabrics woven with delicate gold Zari thread counts.
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold" style={{ color: theme.textColor }}>₹1,500.00</span>
                    <button 
                      type="button" 
                      className="btn btn-sm rounded-pill px-3 py-1 text-white border-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      Shop
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
