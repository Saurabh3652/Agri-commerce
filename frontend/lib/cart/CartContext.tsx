"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { CartItem, NewCartItem } from "./cart-item";

/*
 * The cart is the only state shared across the whole site, so it is the only global state.
 * Page data comes from server components, and form state stays local to each form.
 */

type CartState = { items: CartItem[]; isLoaded: boolean };

type CartAction =
  | { type: "loaded"; items: CartItem[] }
  | { type: "added"; item: NewCartItem; quantity: number }
  | { type: "quantityChanged"; variantId: string; quantity: number }
  | { type: "removed"; variantId: string }
  | { type: "cleared" };

const STORAGE_KEY = "agri.cart.v2";

/** Every quantity change goes through this, so limits are enforced in one place. */
function limitQuantity(item: Pick<CartItem, "stock" | "minOrderQty">, quantity: number, maxPerItem: number) {
  return Math.min(Math.max(quantity, item.minOrderQty), item.stock, maxPerItem);
}

function cartReducer(state: CartState, action: CartAction, maxPerItem: number): CartState {
  switch (action.type) {
    case "loaded":
      return { items: action.items, isLoaded: true };

    case "added": {
      const existing = state.items.find((i) => i.variantId === action.item.variantId);
      const quantity = limitQuantity(action.item, (existing?.quantity ?? 0) + action.quantity, maxPerItem);
      const updated = { ...action.item, quantity };
      return {
        ...state,
        items: existing
          ? state.items.map((i) => (i.variantId === updated.variantId ? updated : i))
          : [...state.items, updated],
      };
    }

    case "quantityChanged":
      return {
        ...state,
        items: state.items.flatMap((i) => {
          if (i.variantId !== action.variantId) return [i];
          // Going below the minimum removes the item, which is what a "−" tap at 1 should do.
          if (action.quantity < i.minOrderQty) return [];
          return [{ ...i, quantity: limitQuantity(i, action.quantity, maxPerItem) }];
        }),
      };

    case "removed":
      return { ...state, items: state.items.filter((i) => i.variantId !== action.variantId) };

    case "cleared":
      return { ...state, items: [] };
  }
}

function readSavedCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return []; // private mode or corrupted data: start with an empty cart
  }
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  isLoaded: boolean;
  maxPerItem: number;
  addItem: (item: NewCartItem, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** `maxPerItem` comes from the store settings, so admins control it without a deploy. */
export function CartProvider({ maxPerItem, children }: { maxPerItem: number; children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (current: CartState, action: CartAction) => cartReducer(current, action, maxPerItem),
    { items: [], isLoaded: false },
  );

  // Load after mount, not during render: the server has no localStorage, and reading it
  // during render would make the server and browser HTML disagree.
  useEffect(() => {
    dispatch({ type: "loaded", items: readSavedCart() });
    // Keep several open tabs in step with each other.
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && dispatch({ type: "loaded", items: readSavedCart() });
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!state.isLoaded) return; // never overwrite the saved cart with the initial empty one
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // storage full or blocked: the cart still works for this visit
    }
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount: state.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalPaise: state.items.reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0),
      isLoaded: state.isLoaded,
      maxPerItem,
      addItem: (item, quantity = item.minOrderQty) => dispatch({ type: "added", item, quantity }),
      setQuantity: (variantId, quantity) => dispatch({ type: "quantityChanged", variantId, quantity }),
      removeItem: (variantId) => dispatch({ type: "removed", variantId }),
      clearCart: () => dispatch({ type: "cleared" }),
    }),
    [state, maxPerItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside <CartProvider>");
  return cart;
}

