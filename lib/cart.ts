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
  is_combo?: boolean;
  combo_selections?: Array<{ product_id: string; name: string; selected_size: string }>;
}

const matchComboSelections = (a?: any[], b?: any[]) => {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((selA) => 
    b.some((selB) => selB.product_id === selA.product_id && selB.selected_size === selA.selected_size)
  );
};

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
  window.dispatchEvent(new Event("aura_cart_updated"));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existingIndex = cart.findIndex((i) => {
    if (item.is_combo) {
      return i.id === item.id && i.is_combo && matchComboSelections(i.combo_selections, item.combo_selections);
    }
    return (
      i.id === item.id &&
      !i.is_combo &&
      i.color === item.color &&
      i.size_letter === item.size_letter &&
      i.size_inch === item.size_inch
    );
  });

  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  window.dispatchEvent(new CustomEvent("aura_cart_open"));
}

export function removeFromCart(id: string, color?: string, size_letter?: string, size_inch?: string, is_combo?: boolean, combo_selections?: any[]) {
  let cart = getCart();
  cart = cart.filter((i) => {
    if (is_combo) {
      return !(i.id === id && i.is_combo && matchComboSelections(i.combo_selections, combo_selections));
    }
    return !(
      i.id === id &&
      !i.is_combo &&
      i.color === color &&
      i.size_letter === size_letter &&
      i.size_inch === size_inch
    );
  });
  saveCart(cart);
}

export function updateCartQuantity(
  id: string,
  quantity: number,
  color?: string,
  size_letter?: string,
  size_inch?: string,
  is_combo?: boolean,
  combo_selections?: any[]
) {
  const cart = getCart();
  const index = cart.findIndex((i) => {
    if (is_combo) {
      return i.id === id && i.is_combo && matchComboSelections(i.combo_selections, combo_selections);
    }
    return (
      i.id === id &&
      !i.is_combo &&
      i.color === color &&
      i.size_letter === size_letter &&
      i.size_inch === size_inch
    );
  });
  if (index > -1) {
    cart[index].quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}
