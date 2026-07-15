"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const parseOrderNotes = (notesStr: string) => {
  if (!notesStr) return { phone: "", email: "", name: "", items: "" };
  const phoneMatch = notesStr.match(/Phone:\s*(.*?)\.\s*Email:/i);
  const emailMatch = notesStr.match(/Email:\s*(.*?)\.\s*Name:/i);
  const nameMatch = notesStr.match(/Name:\s*(.*?)\.\s*Items:/i);
  const itemsMatch = notesStr.match(/Items:\s*(.*)$/i);
  
  return {
    phone: phoneMatch ? phoneMatch[1] : "",
    email: emailMatch ? emailMatch[1] : "",
    name: nameMatch ? nameMatch[1] : "",
    items: itemsMatch ? itemsMatch[1].replace(/\.$/, "") : "",
  };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

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
      setShowModal(false);
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
        <div className="col-12">
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
                        <tr 
                          key={ord.id} 
                          className="small border-bottom border-light cursor-pointer align-middle"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setShowModal(true);
                          }}
                        >
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
                          <td className="text-end" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                setSelectedOrder(ord);
                                setShowModal(true);
                              }}
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
      </div>

      {/* Order Details Modal Popup */}
      {showModal && selectedOrder && (() => {
        const parsedNotes = parseOrderNotes(selectedOrder.notes);
        const productLines = parsedNotes.items ? parsedNotes.items.split(" | ") : [];
        return (
          <div className="modal show d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                <div className="modal-header border-light bg-light p-4 rounded-top-4">
                  <div>
                    <h5 className="modal-title fw-bold text-dark" style={{ fontFamily: "var(--font-heading)" }}>
                      Order Details: {selectedOrder.order_number}
                    </h5>
                    <span className="text-secondary small">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setSelectedOrder(null);
                      setShowModal(false);
                    }}
                  ></button>
                </div>

                <div className="modal-body p-4 bg-white" style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
                  <div className="row g-4 mb-4">
                    {/* Customer details */}
                    <div className="col-12 col-md-6">
                      <div className="card h-100 border border-light p-3 rounded-3 bg-light-subtle shadow-sm">
                        <h6 className="fw-bold text-dark mb-3 small text-uppercase tracking-wider">
                          <i className="bi bi-person me-2 text-primary"></i>Customer Details
                        </h6>
                        <div className="d-flex flex-column gap-2 small">
                          <div className="d-flex justify-content-between">
                            <span className="text-secondary">Name:</span>
                            <span className="fw-semibold text-dark">{parsedNotes.name || "Guest Client"}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-secondary">Email:</span>
                            <span className="fw-semibold text-dark">{parsedNotes.email || selectedOrder.profiles?.email || "N/A"}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-secondary">Phone:</span>
                            <span className="fw-semibold text-dark">{parsedNotes.phone || selectedOrder.shipping_address?.phone || "N/A"}</span>
                          </div>
                          <div className="d-flex justify-content-between border-top pt-2 mt-1">
                            <span className="text-secondary">Payment Method:</span>
                            <span className="fw-bold text-uppercase text-primary font-monospace">{selectedOrder.payment_method === "cod" ? "Cash On Delivery (COD)" : selectedOrder.payment_method}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="col-12 col-md-6">
                      <div className="card h-100 border border-light p-3 rounded-3 bg-light-subtle shadow-sm">
                        <h6 className="fw-bold text-dark mb-3 small text-uppercase tracking-wider">
                          <i className="bi bi-geo-alt me-2 text-primary"></i>Shipping Address
                        </h6>
                        <div className="small text-dark">
                          {selectedOrder.shipping_address ? (
                            <>
                              <div className="fw-semibold mb-1">{parsedNotes.name || "Recipient"}</div>
                              <div>{selectedOrder.shipping_address.address_line1}</div>
                              {selectedOrder.shipping_address.address_line2 && <div>{selectedOrder.shipping_address.address_line2}</div>}
                              <div>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.postal_code}</div>
                              <div className="text-secondary">{selectedOrder.shipping_address.country}</div>
                              <div className="mt-2 text-secondary"><i className="bi bi-telephone me-1"></i> {selectedOrder.shipping_address.phone}</div>
                            </>
                          ) : (
                            <span className="text-muted">No shipping address recorded.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product details */}
                  <div className="card border border-light p-3 rounded-3 mb-4 shadow-sm">
                    <h6 className="fw-bold text-dark mb-3 small text-uppercase tracking-wider">
                      <i className="bi bi-box-seam me-2 text-primary"></i>Product Details
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-borderless align-middle mb-0">
                        <thead>
                          <tr className="border-bottom border-light text-secondary small fs-9 text-uppercase">
                            <th>Item Description</th>
                            <th className="text-end">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productLines.map((line, index) => {
                            const displayLine = line.trim().startsWith("undefined")
                              ? line.replace("undefined", "Premium Apparel / Fabric Item")
                              : line;
                            return (
                              <tr key={index} className="border-bottom border-light-subtle">
                                <td className="py-2.5 text-dark small fw-medium">{displayLine}</td>
                                <td className="py-2.5 text-end">
                                  <span className="badge bg-light text-secondary border border-light font-monospace" style={{ fontSize: "0.7rem" }}>
                                    Ready
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Totals Summary */}
                  <div className="card border border-light p-3 rounded-3 bg-light-subtle mb-4 shadow-sm">
                    <div className="d-flex flex-column gap-2 small">
                      <div className="d-flex justify-content-between text-secondary">
                        <span>Subtotal:</span>
                        <span className="fw-semibold text-dark">₹{Number(selectedOrder.subtotal_amount || selectedOrder.total_amount - selectedOrder.shipping_amount + selectedOrder.discount_amount).toFixed(2)}</span>
                      </div>
                      {Number(selectedOrder.discount_amount) > 0 && (
                        <div className="d-flex justify-content-between text-success">
                          <span>Discount Applied:</span>
                          <span>-₹{Number(selectedOrder.discount_amount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between text-secondary">
                        <span>Shipping Cost:</span>
                        <span className="fw-semibold text-dark">₹{Number(selectedOrder.shipping_amount).toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-top pt-2 mt-1">
                        <span className="fw-bold text-dark">Total Amount:</span>
                        <span className="fw-bold text-primary h6 mb-0">₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Update Form */}
                  <div className="card border border-light p-3 rounded-3 bg-white shadow-sm">
                    <h6 className="fw-bold text-dark mb-3 small text-uppercase tracking-wider">
                      <i className="bi bi-pencil-square me-2 text-primary"></i>Update Fulfillment Status
                    </h6>
                    <form onSubmit={handleUpdateOrder}>
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label fs-9 fw-semibold text-secondary mb-1">Fulfillment Status</label>
                          <select 
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="form-select form-select-sm"
                            style={{ fontSize: "0.85rem", borderRadius: "10px" }}
                          >
                            <option value="pending">Pending review</option>
                            <option value="confirmed">Confirmed / Paid</option>
                            <option value="shipped">Shipped package</option>
                            <option value="delivered">Delivered destination</option>
                            <option value="cancelled">Cancelled order</option>
                          </select>
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fs-9 fw-semibold text-secondary mb-1">Payment Status</label>
                          <select 
                            value={newPaymentStatus}
                            onChange={(e) => setNewPaymentStatus(e.target.value)}
                            className="form-select form-select-sm"
                            style={{ fontSize: "0.85rem", borderRadius: "10px" }}
                          >
                            <option value="pending">Pending / COD Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed / Refunded</option>
                          </select>
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fs-9 fw-semibold text-secondary mb-1">Carrier Provider</label>
                          <input 
                            type="text" 
                            value={shippingCarrier}
                            onChange={(e) => setShippingCarrier(e.target.value)}
                            className="form-control form-control-sm"
                            style={{ fontSize: "0.85rem", borderRadius: "10px" }}
                            placeholder="e.g. DHL, FedEx, Bluedart"
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fs-9 fw-semibold text-secondary mb-1">Tracking Reference</label>
                          <input 
                            type="text" 
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="form-control form-control-sm"
                            style={{ fontSize: "0.85rem", borderRadius: "10px" }}
                            placeholder="e.g. TRK-872412849"
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top border-light">
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary btn-sm px-4 rounded-pill fw-semibold"
                          onClick={() => {
                            setSelectedOrder(null);
                            setShowModal(false);
                          }}
                        >
                          Close
                        </button>
                        <button 
                          type="submit" 
                          disabled={updating} 
                          className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold"
                        >
                          {updating ? "Saving..." : "Apply Updates"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
