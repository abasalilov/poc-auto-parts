import {
  checkoutReturnPath,
  normalizeCheckoutLines,
  toCheckoutLines,
} from "@/lib/checkoutLines";

export const CHECKOUT_STORAGE_KEY = "partsPassCheckout";

/** Stripe sessions last 24 hours; start a fresh one a little before that. */
const MAX_AGE_MS = 23 * 60 * 60 * 1000;

/** A started on-site checkout, kept per browser tab so /checkout survives a refresh. */
export interface StoredCheckout {
  clientSecret: string;
  sessionId: string;
  /** Cart items with the prices the session charges. */
  items: Record<string, any>[];
  returnPath: string;
  /** "buyNow" checkouts are a single product page item, not the cart. */
  source: "cart" | "buyNow";
  /** The Firebase user the cart was saved under; the order page looks it up by this user. */
  authorUid: string;
  linesKey: string;
  createdAt: number;
}

export const checkoutLinesKey = (items: Record<string, any>[]) => {
  const lines = normalizeCheckoutLines(toCheckoutLines(items)) ?? [];
  return lines
    .map((line) => `${line.lineCode}|${line.partNumber}|${line.quantity}`)
    .sort()
    .join(",");
};

export const parseStoredCheckout = (
  raw: string | null,
): StoredCheckout | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value?.clientSecret !== "string" ||
      typeof value?.sessionId !== "string" ||
      typeof value?.authorUid !== "string" ||
      !Array.isArray(value?.items) ||
      value.items.length === 0
    ) {
      return null;
    }
    return {
      ...value,
      source: value.source === "buyNow" ? "buyNow" : "cart",
      returnPath: checkoutReturnPath(value.returnPath),
      createdAt: Number(value.createdAt) || 0,
    };
  } catch {
    return null;
  }
};

/** Whether a stored checkout still matches this shopper and, for cart checkouts, the current cart. */
export const isStoredCheckoutCurrent = (
  stored: StoredCheckout,
  {
    uid,
    cartItems,
    now,
  }: { uid: string; cartItems: Record<string, any>[]; now: number },
) => {
  if (stored.authorUid !== uid) return false;
  if (now - stored.createdAt > MAX_AGE_MS) return false;
  if (stored.source === "cart" && cartItems.length > 0) {
    return checkoutLinesKey(cartItems) === stored.linesKey;
  }
  return true;
};

export const readStoredCheckout = () => {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredCheckout(
      window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY),
    );
  } catch {
    return null;
  }
};

export const writeStoredCheckout = (stored: StoredCheckout) => {
  try {
    window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private mode can block storage; /checkout then starts a new session on refresh.
  }
};

export const clearStoredCheckout = () => {
  try {
    window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
};
