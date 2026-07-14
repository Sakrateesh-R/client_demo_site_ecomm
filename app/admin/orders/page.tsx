"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states for status updates
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (err: any) {
      // For demo fallback if Supabase auth fails during direct dev rendering
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status);
      setNewPaymentStatus(selectedOrder.payment_status);
      setTrackingNumber(selectedOrder.tracking_number || "");
      setShippingCarrier(selectedOrder.shipping_carrier || "");
    }
  }, [selectedOrder]);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    const toastId = toast.loading("Updating order fulfillment details...");

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: newStatus,
          payment_status: newPaymentStatus,
          tracking_number: trackingNumber,
          shipping_carrier: shippingCarrier,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update order");
      }

      const updated = await res.json();
      toast.success("Order status updated successfully!", { id: toastId });
      setSelectedOrder(null);
      fetchOrders(); // Refresh order desk
    } catch (err: any) {
      toast.error(err.message || "Failed to update order", { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status === statusFilter;
  });

  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Order Desk
        </h2>
        <p className="text-secondary small">Review transactions, ship packages, and record carrier tracking info.</p>
      </div>

      {/* Tabs Menu */}
      <div className="card border-0 p-2 rounded-4 shadow-sm bg-white mb-4">
        <div className="d-flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`btn btn-sm px-3 py-2 rounded-pill text-capitalize fw-semibold fs-8 border-0 ${
                statusFilter === status 
                  ? "bg-primary text-white" 
                  : "bg-light text-secondary hover-link"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-4">
        {/* Orders Table Grid */}
        <div className={selectedOrder ? "col-12 col-lg-8" : "col-12"}>
          <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary my-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-secondary small">Loading orders list...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-cart-x text-muted display-4 mb-3 d-block"></i>
                <h5 className="text-dark fw-bold mb-1">No Orders Found</h5>
                <p className="text-secondary small">No orders match the selected filter.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-hover border-0">
                  <thead>
                    <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                      <th>Order ID</th>
                      <th>Customer Email</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      let badgeClass = "bg-secondary-subtle text-secondary";
                      if (ord.status === "pending") badgeClass = "bg-warning-subtle text-warning";
                      else if (ord.status === "confirmed") badgeClass = "bg-primary-subtle text-primary";
                      else if (ord.status === "shipped") badgeClass = "bg-info-subtle text-info";
                      else if (ord.status === "delivered") badgeClass = "bg-success-subtle text-success";
                      else if (ord.status === "cancelled") badgeClass = "bg-danger-subtle text-danger";

                      return (
                        <tr key={ord.id} className="small border-bottom border-light">
                          <td>
                            <div className="fw-bold text-dark">{ord.order_number}</div>
                            <span className="text-muted fs-9">{new Date(ord.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="fw-semibold text-dark">{ord.profiles?.email || "Guest Client"}</td>
                          <td className="fw-bold text-dark">₹{Number(ord.total_amount).toFixed(2)}</td>
                          <td>
                            <span className={`badge rounded-pill text-uppercase border ${badgeClass}`} style={{ fontSize: "0.65rem" }}>
                              {ord.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge rounded-pill border ${
                              ord.payment_status === "paid" 
                                ? "bg-success-subtle text-success border-success" 
                                : "bg-warning-subtle text-warning border-warning"
                            }`} style={{ fontSize: "0.65rem" }}>
                              {ord.payment_status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button 
                              onClick={() => setSelectedOrder(ord)}
                              className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fs-8 fw-semibold"
                            >
                              Manage
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

        {/* Fulfillment update Sidebar */}
        {selectedOrder && (
          <div className="col-12 col-lg-4 animate-fade-in">
            <div className="card border-0 p-4 rounded-4 shadow-sm bg-white sticky-top" style={{ top: "90px" }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 text-dark" style={{ fontFamily: "var(--font-heading)" }}>Manage Fulfillment</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)}></button>
              </div>

              <div className="alert bg-light border border-light text-dark mb-4 py-3 rounded-3">
                <h6 className="fw-bold text-dark small mb-1">Invoice: {selectedOrder.order_number}</h6>
                <span className="text-secondary small">Email: {selectedOrder.profiles?.email || "Guest Client"}</span>
                <div className="d-flex justify-content-between mt-2 pt-2 border-top border-secondary-subtle">
                  <span className="small text-secondary">Total Value:</span>
                  <span className="fw-bold small">${Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleUpdateOrder}>
                {/* Order Status */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Fulfillment Status</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="pending">Pending review</option>
                    <option value="confirmed">Confirmed / Paid</option>
                    <option value="shipped">Shipped package</option>
                    <option value="delivered">Delivered destination</option>
                    <option value="cancelled">Cancelled order</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Payment Status</label>
                  <select 
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="form-select"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="unpaid">Unpaid / COD Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded / Returned</option>
                  </select>
                </div>

                {/* Shipping Carrier */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Carrier Provider</label>
                  <input 
                    type="text" 
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                    className="form-control wix-input"
                    placeholder="e.g. DHL, FedEx, Bluedart"
                  />
                </div>

                {/* Tracking code */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Tracking Reference</label>
                  <input 
                    type="text" 
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="form-control wix-input"
                    placeholder="e.g. TRK-872412849"
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-wix-outline w-100" onClick={() => setSelectedOrder(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={updating} className="btn btn-wix-primary w-100">
                    {updating ? "Saving..." : "Apply Updates"}
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
