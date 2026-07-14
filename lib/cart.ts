"use client";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  color?: string;
  size_letter?: string;
  size_inch?: string;
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("aura_cart") || "[]");
  } catch (e) {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("aura_cart", JSON.stringify(cart));
  // Dispatch custom event to notify components
  window.dispatchEvent(new Event("aura_cart_updated"));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (i) =>
      i.id === item.id &&
      i.color === item.color &&
      i.size_letter === item.size_letter &&
      i.size_inch === item.size_inch
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  // Dispatch custom event to slide open the cart drawer!
  window.dispatchEvent(new CustomEvent("aura_cart_open"));
}

export function removeFromCart(id: string, color?: string, size_letter?: string, size_inch?: string) {
  let cart = getCart();
  cart = cart.filter(
    (i) =>
      !(
        i.id === id &&
        i.color === color &&
        i.size_letter === size_letter &&
        i.size_inch === size_inch
      )
  );
  saveCart(cart);
}

export function updateCartQuantity(
  id: string,
  quantity: number,
  color?: string,
  size_letter?: string,
  size_inch?: string
) {
  const cart = getCart();
  const index = cart.findIndex(
    (i) =>
      i.id === id &&
      i.color === color &&
      i.size_letter === size_letter &&
      i.size_inch === size_inch
  );
  if (index > -1) {
    cart[index].quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}
