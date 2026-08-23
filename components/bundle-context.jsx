"use client";

import { createContext, useContext, useMemo, useState } from "react";

const BundleContext = createContext(null);

/**
 * Shares the selected document between the sticky showcase frame on the left
 * and the document browser on the right, so choosing one updates both.
 * Wraps the whole detail grid; server-rendered children pass through untouched.
 */
export function BundleProvider({ items = [], children }) {
  const [active, setActive] = useState(0);

  const value = useMemo(
    () => ({
      items,
      active: Math.min(active, Math.max(items.length - 1, 0)),
      setActive,
      isBundle: items.length > 1,
    }),
    [items, active]
  );

  return <BundleContext.Provider value={value}>{children}</BundleContext.Provider>;
}

/** Returns null outside a provider, so single certificates work unchanged. */
export function useBundle() {
  return useContext(BundleContext);
}
