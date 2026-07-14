"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setCustomers(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleBlock = async (id: string, currentlyBlocked: boolean) => {
    const actionText = currentlyBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${actionText} this customer account?`)) return;
    
    const toastId = toast.loading(`Toggling block status...`);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isBlocked: !currentlyBlocked }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${actionText} customer`);
      }

      toast.success(`Customer ${currentlyBlocked ? "unblocked" : "blocked"} successfully!`, { id: toastId });
      fetchCustomers(); // Refresh listing
    } catch (err: any) {
      toast.error(err.message || "Failed to alter block status", { id: toastId });
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Customer Directory
        </h2>
        <p className="text-secondary small">Monitor user registrations, purchase statuses, and manage access roles.</p>
      </div>

      {/* Search Header */}
      <div className="card border-0 p-3 rounded-4 shadow-sm bg-white mb-4">
        <div className="d-flex align-items-center bg-light px-3 py-2 rounded-pill border-light" style={{ maxWidth: "320px" }}>
          <i className="bi bi-search text-muted small me-2"></i>
          <input 
            type="text" 
            placeholder="Search email or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 small w-100" 
            style={{ outline: "none", fontSize: "0.85rem" }} 
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary my-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary small">Loading users directory...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people-fill text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-dark fw-bold mb-1">No Customers Found</h5>
            <p className="text-secondary small">No customer registration profiles match search terms.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover border-0">
              <thead>
                <tr className="text-secondary small border-bottom border-light" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th>Name</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <th>Join Date</th>
                  <th>Account Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const isBlocked = !!cust.deleted_at;
                  return (
                    <tr key={cust.id} className="small border-bottom border-light">
                      <td>
                        <div className="fw-bold text-dark">{cust.full_name || "N/A"}</div>
                        <span className="text-muted fs-9 font-monospace">{cust.id.slice(0, 8)}...</span>
                      </td>
                      <td className="text-dark">{cust.email}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace text-uppercase" style={{ fontSize: "0.65rem" }}>
                          {cust.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-secondary">
                        {new Date(cust.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {isBlocked ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle fs-9 text-uppercase" style={{ fontSize: "0.65rem" }}>
                            Blocked
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle fs-9 text-uppercase" style={{ fontSize: "0.65rem" }}>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        {cust.role === "customer" && (
                          <button
                            onClick={() => handleToggleBlock(cust.id, isBlocked)}
                            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold fs-8 ${
                              isBlocked 
                                ? "btn-outline-success" 
                                : "btn-outline-danger"
                            }`}
                          >
                            {isBlocked ? "Unblock" : "Block User"}
                          </button>
                        )}
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
  );
}
