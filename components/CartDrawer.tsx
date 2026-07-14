"use client";

import React, { useState, useEffect } from "react";
import { getCart, removeFromCart, updateCartQuantity, CartItem } from "@/lib/cart";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingPromo, setShippingPromo] = useState<{ enabled: boolean; threshold: number }>({
    enabled: true,
    threshold: 100,
  });

  useEffect(() => {
    // Initial fetch
    setCartItems(getCart());

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.cms) {
            setShippingPromo({
              enabled: data.cms.enable_free_shipping !== "false",
              threshold: Number(data.cms.free_shipping_threshold || "100"),
            });
          }
        }
      } catch (e) {
        console.error("Failed to load shipping settings", e);
      }
    };
    fetchSettings();

    const handleUpdated = () => {
      setCartItems(getCart());
      fetchSettings();
    };

    const handleOpen = () => {
      setIsOpen(true);
      fetchSettings();
    };

    window.addEventListener("aura_cart_updated", handleUpdated);
    window.addEventListener("aura_cart_open", handleOpen);

    return () => {
      window.removeEventListener("aura_cart_updated", handleUpdated);
      window.removeEventListener("aura_cart_open", handleOpen);
    };
  }, []);

  const handleQtyChange = (item: CartItem, newQty: number) => {
    updateCartQuantity(item.id, newQty, item.color, item.size_letter, item.size_inch);
  };

  const handleRemove = (item: CartItem) => {
    removeFromCart(item.id, item.color, item.size_letter, item.size_inch);
    toast.success("Item removed from bag");
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <>
      {/* Screen Overlay */}
      {isOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50" 
          style={{ zIndex: 2000, transition: "opacity 0.3s" }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Cart Slider Drawer */}
      <div 
        className="position-fixed top-0 end-0 h-100 bg-white shadow-lg d-flex flex-column"
        style={{
          width: "420px",
          maxWidth: "100%",
          zIndex: 2001,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          fontFamily: "var(--font-body)"
        }}
      >
        {/* Drawer Header */}
        <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-bag"></i> Shopping Bag
            <span className="badge bg-secondary-subtle text-secondary border border-light small font-monospace" style={{ fontSize: "0.8rem" }}>
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </h5>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: "36px", height: "36px" }}
            onClick={() => setIsOpen(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Drawer Body (Items) */}
        <div className="flex-grow-1 overflow-y-auto p-3 bg-light">
          {cartItems.length === 0 ? (
            <div className="text-center py-5 h-100 d-flex flex-column align-items-center justify-content-center">
              <i className="bi bi-bag-x text-muted display-2 mb-3"></i>
              <h6 className="fw-bold text-dark mb-1">Your bag is empty</h6>
              <p className="text-secondary small mb-4">Add premium weaves to start checkout.</p>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="btn btn-wix-primary rounded-pill px-4"
              >
                Shop Fabrics
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {cartItems.map((item, idx) => {
                const attrs = [item.color, item.size_letter, item.size_inch ? `${item.size_inch}"` : ""].filter(Boolean).join(" / ");
                return (
                  <div key={idx} className="card border-0 p-3 rounded-3 shadow-sm bg-white d-flex flex-row gap-3 align-items-start">
                    {/* Product Image */}
                    <div className="rounded overflow-hidden bg-light border border-light flex-shrink-0" style={{ width: "80px", height: "80px" }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center"><i className="bi bi-image text-muted"></i></div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow-1 min-w-0 d-flex flex-column justify-content-between h-100">
                      <div>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <h6 className="mb-0 fw-semibold text-dark text-truncate small" title={item.name}>{item.name}</h6>
                          <button 
                            type="button" 
                            onClick={() => handleRemove(item)} 
                            className="btn btn-link text-danger p-0 border-0 flex-shrink-0 align-self-start"
                            style={{ textDecoration: "none" }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        {attrs && <span className="text-muted d-block mt-1" style={{ fontSize: "0.75rem" }}>{attrs}</span>}
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light">
                        {/* Qty Picker */}
                        <div className="d-flex align-items-center border rounded-pill bg-white px-2 py-0.5">
                          <button 
                            type="button" 
                            className="btn btn-sm border-0 p-1"
                            onClick={() => handleQtyChange(item, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <i className="bi bi-dash" style={{ fontSize: "0.7rem" }}></i>
                          </button>
                          <span className="px-2 fw-semibold text-dark" style={{ fontSize: "0.8rem" }}>{item.quantity}</span>
                          <button 
                            type="button" 
                            className="btn btn-sm border-0 p-1"
                            onClick={() => handleQtyChange(item, item.quantity + 1)}
                          >
                            <i className="bi bi-plus" style={{ fontSize: "0.7rem" }}></i>
                          </button>
                        </div>

                        {/* Price */}
                        <span className="fw-bold text-dark small">₹{Number(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-top border-light bg-white">
            {/* Free shipping check */}
            {shippingPromo.enabled && (
              <div className="mb-3">
                {subtotal >= shippingPromo.threshold ? (
                  <div className="alert alert-success py-2 px-3 rounded-3 small mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-truck fs-5"></i>
                    <span>Congrats! You qualify for <strong>Free Shipping</strong></span>
                  </div>
                ) : (
                  <div className="alert alert-warning py-2 px-3 rounded-3 small mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-info-circle fs-5"></i>
                    <span>Add <strong>₹{(shippingPromo.threshold - subtotal).toFixed(2)}</strong> more to unlock free shipping</span>
                  </div>
                )}
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small fw-semibold">Subtotal</span>
              <span className="h5 mb-0 fw-bold text-dark">₹{subtotal.toFixed(2)}</span>
            </div>

            <button 
              type="button" 
              onClick={() => {
                setIsOpen(false);
                router.push("/checkout");
              }} 
              className="btn btn-wix-primary w-100 py-2.5 rounded-pill fw-semibold mb-2"
            >
              Proceed to Checkout
            </button>
            
            <button 
              type="button" 
              onClick={() => {
                if (confirm("Clear all items?")) {
                  localStorage.removeItem("aura_cart");
                  window.dispatchEvent(new Event("aura_cart_updated"));
                  toast.success("Cleared shopping bag");
                }
              }} 
              className="btn btn-link text-secondary w-100 p-0 border-0 fs-8 text-center"
              style={{ textDecoration: "none" }}
            >
              Clear Bag
            </button>
          </div>
        )}
      </div>
    </>
  );
}
