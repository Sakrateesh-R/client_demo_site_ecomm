"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = (format: "Excel" | "PDF", reportName: string) => {
    setExporting(format);
    const toastId = toast.loading(`Generating ${reportName} in ${format} format...`);

    // Simulate export delay
    setTimeout(() => {
      toast.success(`${reportName} successfully downloaded as ${format}!`, { id: toastId });
      setExporting(null);
    }, 2000);
  };

  const reports = [
    { name: "Sales Performance Report", desc: "Detailed summary of net receipts, gross margins, and growth rate matrices.", icon: "bi-graph-up-arrow" },
    { name: "Inventory Ledger & Stock Audit", desc: "Current stock evaluations, low warnings lists, and transactions trails.", icon: "bi-archive" },
    { name: "Order Fulfillment Analytics", desc: "Details on average shipping lead times, delivery rates, and return percentages.", icon: "bi-truck" },
    { name: "Customer Acquisition & LTV", desc: "Reviews growth of registered memberships, address segments, and average orders count.", icon: "bi-people" },
  ];

  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Reports & Analytics
        </h2>
        <p className="text-secondary small">Generate and export operations ledgers, sales metrics, and transaction indexes.</p>
      </div>

      <div className="row g-4">
        {/* Reports log list */}
        {reports.map((rep, idx) => (
          <div key={idx} className="col-12 col-md-6">
            <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100 d-flex flex-column justify-content-between">
              <div className="mb-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-primary-subtle text-primary p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                    <i className={`bi ${rep.icon} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold mb-0 text-dark small" style={{ fontFamily: "var(--font-heading)" }}>{rep.name}</h5>
                </div>
                <p className="text-secondary small mb-0">{rep.desc}</p>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2 pt-3 border-top border-light">
                <button 
                  onClick={() => handleExport("Excel", rep.name)}
                  disabled={!!exporting}
                  className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 fs-8 fw-semibold d-flex align-items-center gap-2"
                >
                  <i className="bi bi-file-earmark-excel"></i>
                  Export Excel
                </button>
                <button 
                  onClick={() => handleExport("PDF", rep.name)}
                  disabled={!!exporting}
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 fs-8 fw-semibold d-flex align-items-center gap-2"
                >
                  <i className="bi bi-file-earmark-pdf"></i>
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
