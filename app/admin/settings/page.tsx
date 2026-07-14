"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Separate states for input fields
  const [storeName, setStoreName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [shippingRate, setShippingRate] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [codActive, setCodActive] = useState(true);
  const [razorpayActive, setRazorpayActive] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();

      // Populate input states if keys exist
      if (data.general) {
        setStoreName(data.general.store_name || "");
        setSupportEmail(data.general.support_email || "");
        setSupportPhone(data.general.support_phone || "");
      }
      if (data.shipping) {
        setShippingRate(parseFloat(data.shipping.flat_rate) || 0);
      }
      if (data.tax) {
        setTaxPercent(parseFloat(data.tax.percentage) || 0);
      }
      if (data.payment) {
        setCodActive(data.payment.cod_active === "true");
        setRazorpayActive(data.payment.razorpay_active === "true");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load parameters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Saving store adjustments...");

    try {
      const settingsList = [
        { key: "store_name", value: storeName, group: "general" },
        { key: "support_email", value: supportEmail, group: "general" },
        { key: "support_phone", value: supportPhone, group: "general" },
        { key: "flat_rate", value: shippingRate.toString(), group: "shipping" },
        { key: "percentage", value: taxPercent.toString(), group: "tax" },
        { key: "cod_active", value: codActive ? "true" : "false", group: "payment" },
        { key: "razorpay_active", value: razorpayActive ? "true" : "false", group: "payment" },
      ];

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsList }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      toast.success("Settings updated successfully!", { id: toastId });
      fetchSettings(); // Refresh form values
    } catch (err: any) {
      toast.error(err.message || "Failed to update configurations", { id: toastId });
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
        <p className="text-secondary small">Loading store configurations...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Store Settings
        </h2>
        <p className="text-secondary small">Configure billing taxes, shipping rates, and checkout gateways.</p>
      </div>

      <form onSubmit={handleSaveSettings}>
        <div className="row g-4">
          
          {/* General Brand Details */}
          <div className="col-12 col-md-6">
            <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100">
              <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">General Configurations</h5>
              
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Store Branding Name</label>
                <input 
                  type="text" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)} 
                  className="form-control wix-input" 
                  placeholder="e.g. Aura.weaves" 
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Concierge Support Email</label>
                <input 
                  type="email" 
                  value={supportEmail} 
                  onChange={(e) => setSupportEmail(e.target.value)} 
                  className="form-control wix-input" 
                  placeholder="support@auraweaves.com"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Contact Helpline Phone</label>
                <input 
                  type="text" 
                  value={supportPhone} 
                  onChange={(e) => setSupportPhone(e.target.value)} 
                  className="form-control wix-input" 
                  placeholder="+1 (555) 019-2834"
                />
              </div>
            </div>
          </div>

          {/* Logistics & Taxes */}
          <div className="col-12 col-md-6">
            <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100">
              <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">Logistics & Tax Surcharges</h5>
              
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Flat Rate Global Shipping ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={shippingRate} 
                  onChange={(e) => setShippingRate(parseFloat(e.target.value) || 0)} 
                  className="form-control wix-input" 
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Sales Tax Levy Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  value={taxPercent} 
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)} 
                  className="form-control wix-input" 
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="col-12">
            <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
              <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">Payment Gateway integrations</h5>
              
              <div className="row g-4">
                {/* Switch 1: Razorpay */}
                <div className="col-12 col-md-6">
                  <div className="p-3 border border-light rounded-3 bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-1 text-dark small">Razorpay Secure Checkout</h6>
                      <span className="text-secondary fs-9">Collect credit/debit card, netbanking, and UPI payments instantly.</span>
                    </div>
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="razorpayActive" 
                        checked={razorpayActive} 
                        onChange={(e) => setRazorpayActive(e.target.checked)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Switch 2: COD */}
                <div className="col-12 col-md-6">
                  <div className="p-3 border border-light rounded-3 bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-1 text-dark small">Cash on Delivery (COD)</h6>
                      <span className="text-secondary fs-9">Enable physical cash payouts during shipment dropoff.</span>
                    </div>
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="codActive" 
                        checked={codActive} 
                        onChange={(e) => setCodActive(e.target.checked)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Submit adjustments banner */}
        <div className="d-flex justify-content-end mt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="btn btn-wix-primary px-5 rounded-pill shadow-sm"
          >
            {saving ? "Updating..." : "Save Configs"}
          </button>
        </div>
      </form>
    </div>
  );
}
