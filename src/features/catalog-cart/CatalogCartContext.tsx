import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "wowstorg.catalog-cart.v1";

export type CatalogCartItem = {
  id: string;
  title: string;
  section: string;
  quantity: number;
};

type CatalogCartValue = {
  items: CatalogCartItem[];
  totalQuantity: number;
  addItem: (item: Omit<CatalogCartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CatalogCartContext = createContext<CatalogCartValue | null>(null);

function readStoredCart(): CatalogCartItem[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as CatalogCartItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.id && item.title && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CatalogCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CatalogCartItem[]>(readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CatalogCartValue>(() => ({
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    addItem: (nextItem) => setItems((current) => {
      const existing = current.find((item) => item.id === nextItem.id);
      if (!existing) return [...current, { ...nextItem, quantity: 1 }];
      return current.map((item) => item.id === nextItem.id ? { ...item, quantity: item.quantity + 1 } : item);
    }),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    setQuantity: (id, quantity) => setItems((current) => quantity <= 0
      ? current.filter((item) => item.id !== id)
      : current.map((item) => item.id === id ? { ...item, quantity } : item)),
    clearCart: () => setItems([]),
  }), [items]);

  return <CatalogCartContext.Provider value={value}>{children}</CatalogCartContext.Provider>;
}

export function useCatalogCart() {
  const context = useContext(CatalogCartContext);
  if (!context) throw new Error("useCatalogCart must be used inside CatalogCartProvider");
  return context;
}
