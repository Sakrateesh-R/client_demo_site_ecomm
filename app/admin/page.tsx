"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) {
          throw new Error("Failed to load metrics");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        toast.error(err.message || "Could not load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="row g-4">
        {/* Metric Cards Skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 p-4 rounded-4 shadow-sm bg-white placeholder-glow">
              <div className="placeholder col-6 mb-3 rounded-pill bg-light" style={{ height: "14px" }} />
              <div className="placeholder col-8 mb-2 rounded-pill bg-light" style={{ height: "24px" }} />
            </div>
          </div>
        ))}

        {/* Chart Skeleton */}
        <div className="col-12 col-lg-8 mt-4">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white placeholder-glow">
            <div className="placeholder col-4 mb-4 rounded-pill bg-light" style={{ height: "18px" }} />
            <div className="placeholder col-12 rounded-4 bg-light" style={{ height: "200px" }} />
          </div>
        </div>

        {/* Secondary Card Skeleton */}
        <div className="col-12 col-lg-4 mt-4">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white placeholder-glow">
            <div className="placeholder col-6 mb-4 rounded-pill bg-light" style={{ height: "18px" }} />
            {[1, 2, 3].map((j) => (
              <div key={j} className="d-flex align-items-center justify-content-between mb-3">
                <div className="placeholder col-8 rounded-pill bg-light" style={{ height: "14px" }} />
                <div className="placeholder col-3 rounded-pill bg-light" style={{ height: "14px" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate coordinates for dynamic SVG Bar chart
  const maxRevenue = data?.revenueChartData
    ? Math.max(...data.revenueChartData.map((d: any) => d.revenue), 1000)
    : 1000;

  return (
    <div>
      {/* Title Header */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark" style={{ fontFamily: "var(--font-heading)" }}>
          Dashboard Overview
        </h2>
        <p className="text-secondary small">Real-time statistics and sales analytics.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="row g-4 mb-4">
        {/* Metric 1: Revenue */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100" style={{ border: "var(--border-light)" }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Revenue</span>
              <div className="bg-primary-subtle text-primary p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-wallet2 fs-5"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">${data?.totalRevenue?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h3>
            <span className="text-success small fw-semibold">
              <i className="bi bi-arrow-up-right me-1"></i>+12.4% this month
            </span>
          </div>
        </div>

        {/* Metric 2: Orders */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Orders</span>
              <div className="bg-info-subtle text-info p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-bag-check fs-5"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{data?.ordersCount}</h3>
            <span className="text-success small fw-semibold">
              <i className="bi bi-arrow-up-right me-1"></i>+8.2% this week
            </span>
          </div>
        </div>

        {/* Metric 3: Customers */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Customers</span>
              <div className="bg-success-subtle text-success p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-people fs-5"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{data?.customersCount}</h3>
            <span className="text-success small fw-semibold">
              <i className="bi bi-arrow-up-right me-1"></i>+4.5% new members
            </span>
          </div>
        </div>

        {/* Metric 4: Low Stock Warnings */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Low Stock</span>
              <div className="bg-danger-subtle text-danger p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-exclamation-circle fs-5"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{data?.lowStockCount}</h3>
            <span className={`small fw-semibold ${data?.lowStockCount > 0 ? "text-danger" : "text-muted"}`}>
              {data?.lowStockCount > 0 ? "Requires restock adjustment" : "Stock quantities healthy"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Analytics Block */}
      <div className="row g-4">
        {/* Sales Chart Card */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
            <h4 className="h6 fw-bold mb-4 text-dark text-uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              Revenue Performance (7 Days)
            </h4>
            
            {/* Responsive SVG Chart */}
            <div style={{ width: "100%", height: "200px" }}>
              <svg viewBox="0 0 500 200" width="100%" height="100%">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f3f5" strokeWidth="1" />
                <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f3f5" strokeWidth="1" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f3f5" strokeWidth="1" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="#e9ecef" strokeWidth="1.5" />

                {/* Y-axis Labels */}
                <text x="30" y="34" fill="#8c9199" fontSize="9" textAnchor="end">${(maxRevenue).toFixed(0)}</text>
                <text x="30" y="84" fill="#8c9199" fontSize="9" textAnchor="end">${(maxRevenue * 0.6).toFixed(0)}</text>
                <text x="30" y="134" fill="#8c9199" fontSize="9" textAnchor="end">${(maxRevenue * 0.3).toFixed(0)}</text>
                <text x="30" y="174" fill="#8c9199" fontSize="9" textAnchor="end">$0</text>

                {/* Drawing dynamic columns */}
                {data?.revenueChartData?.map((item: any, idx: number) => {
                  const barWidth = 32;
                  const spacing = 60;
                  const x = 50 + idx * spacing;
                  const barHeight = (item.revenue / maxRevenue) * 130;
                  const y = 170 - barHeight;

                  return (
                    <g key={idx} className="chart-bar-group" style={{ cursor: "pointer" }}>
                      {/* Bar Background shadow glow */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        fill="url(#goldGradient)"
                        rx="4"
                      />
                      
                      {/* Hover details tooltips */}
                      <text 
                        x={x + barWidth / 2} 
                        y={y - 6} 
                        fill="var(--color-primary)" 
                        fontSize="9" 
                        fontWeight="bold" 
                        textAnchor="middle"
                        className="chart-tooltip-text"
                      >
                        ${item.revenue}
                      </text>

                      {/* X-axis label */}
                      <text 
                        x={x + barWidth / 2} 
                        y="188" 
                        fill="#5c5f66" 
                        fontSize="9.5" 
                        textAnchor="middle"
                      >
                        {item.date}
                      </text>
                    </g>
                  );
                })}

                {/* Definitions for gradient paint */}
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#1565c0" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Top Products Card */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white h-100">
            <h4 className="h6 fw-bold mb-4 text-dark text-uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              Top Selling Products
            </h4>
            
            <div className="d-flex flex-column gap-3">
              {data?.topSellingProducts?.map((prod: any, i: number) => (
                <div key={i} className="d-flex justify-content-between align-items-center border-bottom border-light pb-2">
                  <div className="min-w-0 me-2">
                    <h6 className="mb-0 fw-semibold text-dark small text-truncate">{prod.name}</h6>
                    <span className="text-secondary fs-9">{prod.sales} pieces sold</span>
                  </div>
                  <span className="fw-bold text-dark text-nowrap small">${prod.revenue?.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Listing */}
      <div className="card border-0 p-4 rounded-4 shadow-sm bg-white mt-4">
        <h4 className="h6 fw-bold mb-4 text-dark text-uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
          Recent Orders
        </h4>
        
        <div className="table-responsive">
          <table className="table align-middle table-hover border-0">
            <thead>
              <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.map((ord: any) => {
                let badgeClass = "bg-secondary-subtle text-secondary";
                if (ord.status === "pending") badgeClass = "bg-warning-subtle text-warning";
                else if (ord.status === "confirmed") badgeClass = "bg-primary-subtle text-primary";
                else if (ord.status === "shipped") badgeClass = "bg-info-subtle text-info";
                else if (ord.status === "delivered") badgeClass = "bg-success-subtle text-success";
                else if (ord.status === "cancelled") badgeClass = "bg-danger-subtle text-danger";

                return (
                  <tr key={ord.id} className="small border-bottom border-light">
                    <td className="fw-bold text-primary">{ord.order_number}</td>
                    <td className="text-dark fw-semibold">{ord.customer_name}</td>
                    <td className="text-dark fw-bold">₹{ord.total_amount?.toFixed(2)}</td>
                    <td>
                      <span className={`badge rounded-pill text-uppercase fs-9 border ${badgeClass}`} style={{ fontSize: "0.65rem" }}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="text-secondary">
                      {new Date(ord.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
