"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCart, CartItem } from "@/lib/cart";

export const dynamic = "force-dynamic";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Shipping promo config
  const [shippingPromo, setShippingPromo] = useState<{ enabled: boolean; threshold: number }>({
    enabled: true,
    threshold: 100,
  });

  // Shipping form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'card'

  useEffect(() => {
    // Read cart
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
        console.error("Failed to load settings:", e);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Calculate shipping cost
  const isFreeShipping = shippingPromo.enabled && subtotal >= shippingPromo.threshold;
  const shippingCost = subtotal > 0 && !isFreeShipping ? 150 : 0; // ₹150 flat shipping if not free
  const totalAmount = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Your shopping bag is empty");
      return;
    }

    if (!firstName || !lastName || !email || !phone || !addressLine1 || !city || !state || !postalCode) {
      toast.error("Please fill in all shipping details");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Processing your weave order...");

    try {
      const payload = {
        customer_name: `${firstName} ${lastName}`,
        email,
        phone,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        state,
        postal_code: postalCode,
        country: "India",
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          color: item.color || null,
          size_letter: item.size_letter || null,
          size_inch: item.size_inch || null
        })),
        subtotal,
        shipping: shippingCost,
        discount: 0,
        total: totalAmount,
        payment_method: paymentMethod
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Order placement failed");
      }

      const orderData = await res.json();
      
      // Clear cart
      localStorage.removeItem("aura_cart");
      window.dispatchEvent(new Event("aura_cart_updated"));
      
      toast.success("Order placed successfully!", { id: toastId });
      setOrderSuccess(orderData);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="bg-light min-h-100 pb-5">
        <Navbar />
        <div className="container py-5">
          <div className="card border-0 p-5 rounded-4 shadow-sm bg-white mx-auto text-center" style={{ maxWidth: "600px" }}>
            <div className="mb-4">
              <span className="bg-success-subtle text-success p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                <i className="bi bi-patch-check-fill display-4 m-0"></i>
              </span>
              <h2 className="fw-bold text-dark mb-2">Order Confirmed!</h2>
              <p className="text-secondary small">Thank you for shopping with Aura.weaves. Your premium weaves order is being packed.</p>
            </div>

            <div className="bg-light p-4 rounded-3 border border-light text-start mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">Order ID</span>
                <span className="fw-bold text-dark font-monospace small">{orderSuccess.orderNumber}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">Customer</span>
                <span className="fw-semibold text-dark small">{firstName} {lastName}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">Phone</span>
                <span className="fw-semibold text-dark small">{phone}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">Payment Method</span>
                <span className="fw-semibold text-uppercase text-dark small font-monospace">{paymentMethod}</span>
              </div>
              <hr className="border-light" />
              <div className="d-flex justify-content-between">
                <span className="fw-bold text-dark">Amount Paid</span>
                <span className="fw-bold text-primary">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => router.push("/")} 
              className="btn btn-wix-primary rounded-pill px-5 py-2.5 w-100"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-h-100 pb-5">
      <Navbar />
      <div className="container py-5">
        <h2 className="h3 fw-bold text-dark mb-4" style={{ fontFamily: "var(--font-heading)" }}>Checkout</h2>

        {cartItems.length === 0 ? (
          <div className="card border-0 p-5 rounded-4 shadow-sm bg-white text-center py-5">
            <i className="bi bi-bag-x text-muted display-2 mb-3"></i>
            <h5 className="fw-bold text-dark">Your bag is empty</h5>
            <p className="text-secondary small mb-4">You cannot proceed to checkout with an empty shopping bag.</p>
            <button onClick={() => router.push("/")} className="btn btn-wix-primary rounded-pill px-4 mx-auto">
              Back to Store
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {/* Left Column: Shipping & Payment Form */}
            <div className="col-12 col-lg-7">
              <form onSubmit={handleSubmit}>
                {/* Shipping Address */}
                <div className="card border-0 p-4 rounded-4 shadow-sm bg-white mb-4">
                  <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">Shipping Details</h5>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary mb-1">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="John" 
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary mb-1">Last Name</label>
                      <input 
                        type="text" 
                        required
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="Doe" 
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary mb-1">Email ID</label>
                      <input 
                        type="email" 
                        required
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="john.doe@example.com" 
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="e.g. +91 98765 43210" 
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary mb-1">Address Line 1</label>
                      <input 
                        type="text" 
                        required
                        value={addressLine1} 
                        onChange={(e) => setAddressLine1(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="Flat No, House No, Street Address" 
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary mb-1">Address Line 2 (Optional)</label>
                      <input 
                        type="text" 
                        value={addressLine2} 
                        onChange={(e) => setAddressLine2(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="Apartment, LandMark, Locality" 
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-secondary mb-1">City</label>
                      <input 
                        type="text" 
                        required
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="Chennai" 
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-secondary mb-1">State</label>
                      <input 
                        type="text" 
                        required
                        value={state} 
                        onChange={(e) => setState(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="Tamil Nadu" 
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-secondary mb-1">Pin Code</label>
                      <input 
                        type="text" 
                        required
                        value={postalCode} 
                        onChange={(e) => setPostalCode(e.target.value)} 
                        className="form-control wix-input" 
                        placeholder="600001" 
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="card border-0 p-4 rounded-4 shadow-sm bg-white">
                  <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">Payment Method</h5>

                  <div className="d-flex flex-column gap-2">
                    <label className="border rounded-3 p-3 d-flex align-items-center justify-content-between cursor-pointer hover-bg-light" style={{ transition: "all 0.2s" }}>
                      <div className="d-flex align-items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="form-check-input mt-0" 
                        />
                        <div>
                          <span className="fw-bold text-dark small d-block">Cash on Delivery (COD)</span>
                          <span className="text-secondary fs-9">Pay with cash when package is delivered to your door.</span>
                        </div>
                      </div>
                      <i className="bi bi-wallet2 text-secondary fs-4"></i>
                    </label>

                    <label className="border rounded-3 p-3 d-flex align-items-center justify-content-between cursor-pointer hover-bg-light" style={{ transition: "all 0.2s" }}>
                      <div className="d-flex align-items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          checked={paymentMethod === "card"}
                          onChange={() => setPaymentMethod("card")}
                          className="form-check-input mt-0" 
                        />
                        <div>
                          <span className="fw-bold text-dark small d-block">Online Card Payment (Simulated)</span>
                          <span className="text-secondary fs-9">Pay securely using Visa, Mastercard, or UPI.</span>
                        </div>
                      </div>
                      <i className="bi bi-credit-card text-secondary fs-4"></i>
                    </label>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="mt-3 p-3 border rounded-3 bg-light">
                      <div className="row g-2">
                        <div className="col-12">
                          <label className="form-label fs-9 fw-semibold text-secondary mb-1">Card Number</label>
                          <input type="text" className="form-control form-control-sm wix-input" placeholder="4000 1234 5678 9010" />
                        </div>
                        <div className="col-6">
                          <label className="form-label fs-9 fw-semibold text-secondary mb-1">Expiry Date</label>
                          <input type="text" className="form-control form-control-sm wix-input" placeholder="MM/YY" />
                        </div>
                        <div className="col-6">
                          <label className="form-label fs-9 fw-semibold text-secondary mb-1">CVV</label>
                          <input type="text" className="form-control form-control-sm wix-input" placeholder="123" />
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="btn btn-wix-primary rounded-pill w-100 py-2.5 fw-bold text-uppercase mt-4"
                  >
                    {submitting ? "Placing Order..." : "Confirm & Place Order"}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="col-12 col-lg-5">
              <div className="card border-0 p-4 rounded-4 shadow-sm bg-white sticky-top" style={{ top: "100px" }}>
                <h5 className="h6 fw-bold text-dark mb-4 text-uppercase tracking-wider">Order Summary</h5>

                <div className="d-flex flex-column gap-3 overflow-y-auto mb-4" style={{ maxHeight: "300px" }}>
                  {cartItems.map((item, idx) => {
                    const attrs = [item.color, item.size_letter, item.size_inch ? `${item.size_inch}"` : ""].filter(Boolean).join(" / ");
                    return (
                      <div key={idx} className="d-flex align-items-center gap-3">
                        <div className="rounded overflow-hidden bg-light border border-light flex-shrink-0" style={{ width: "60px", height: "60px" }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-100 h-100 object-fit-cover" />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center"><i className="bi bi-image text-muted"></i></div>
                          )}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="mb-0 fw-semibold text-dark text-truncate small">{item.name}</h6>
                          {attrs && <span className="text-secondary d-block fs-9">{attrs}</span>}
                          <span className="text-secondary small font-monospace">Qty: {item.quantity}</span>
                        </div>
                        <span className="fw-bold text-dark small flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <hr className="border-light" />

                <div className="d-flex flex-column gap-2 mb-4">
                  <div className="d-flex justify-content-between text-secondary small">
                    <span>Subtotal</span>
                    <span className="fw-semibold text-dark">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary small">
                    <span>Shipping</span>
                    <span className="fw-semibold text-dark">{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : "Free"}</span>
                  </div>
                  {shippingPromo.enabled && !isFreeShipping && (
                    <div className="alert alert-info py-2 px-3 rounded-3 fs-9 mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-info-circle"></i>
                      <span>Add <strong>₹{(shippingPromo.threshold - subtotal).toFixed(2)}</strong> more to get free shipping</span>
                    </div>
                  )}
                </div>

                <hr className="border-light" />

                <div className="d-flex justify-content-between align-items-center mb-0">
                  <span className="fw-bold text-dark">Total Amount</span>
                  <span className="h4 mb-0 fw-bold text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
