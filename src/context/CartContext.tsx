"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "reactfire";
import { getAuth, onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { useShoppingCart } from "use-shopping-cart";

import { UserContext } from "@/context/UserContext";

import { CARTS, CHECKOUT_MODE } from "@/lib/constants";
import { checkoutReturnPath, toCheckoutLines, withCheckoutPrices } from "@/lib/checkoutLines";
import {
  checkoutLinesKey,
  writeStoredCheckout,
  type StoredCheckout,
} from "@/lib/onSiteCheckout";
import { SHIPPING_QUOTE_EMAIL } from "@/lib/shippingRates";
import { createCheckoutSession, createOnSiteCheckoutSession } from "@/actions/checkout";

interface CartContext {
  /** Checks out the whole cart, or only `itemsOverride` (e.g. "Buy now" on a product page). */
  /** `returnPath` is where Stripe's back link goes; the home page by default. */
  checkout: (itemsOverride?: any[], returnPath?: string) => Promise<boolean>;
  /** Creates the Stripe session and saved cart behind the on-site /checkout page. */
  startOnSiteCheckout: (
    items: any[],
    returnPath: string,
    source: StoredCheckout["source"],
  ) => Promise<StoredCheckout | null>;
  /** The checkout most recently started in this tab. */
  onSiteCheckout: StoredCheckout | null;
  /** Why the last checkout attempt failed; shown next to the checkout buttons. */
  checkoutError: string | null;
  saveCart: (x: any[], y: string) => Promise<boolean>;
  selectedPart: any;
  setSelectedPart: (x: any) => void;
  readyToCheckout: boolean;
  startedCheckout: boolean;
  setReadyToCheckout: (x: boolean) => void;
  setStartedCheckout: (x: boolean) => void;
  isSideCartOpen: boolean;
  setIsSideCartOpen: (b: boolean) => void;
}

// Create Context Object
export const CartContext = createContext<CartContext>({} as CartContext);
// TODO: put in safeguard at the top level so that no one an add more than 12 of anything ever
// you can add too many, buy using the add to cart button in the search section
const waitForAuthUser = async (): Promise<User> => {
  const auth = getAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise<User>((resolve, reject) => {
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(auth, (authUser) => {
      unsubscribe();

      if (authUser) {
        resolve(authUser);
        return;
      }

      signInAnonymously(auth)
        .then(({ user }) => resolve(user))
        .catch(reject);
    }, reject);
  });
};

const checkoutProblemMessage = (result: { error: string; unavailable?: string[] }) =>
  result.error === "unavailable"
    ? `Sorry, these parts just sold out or don't have enough stock: ${result.unavailable?.join(", ")}. Please remove them or lower the quantity and try again.`
    : result.error === "freight"
      ? `These parts are too large to ship by FedEx Ground: ${result.unavailable?.join(", ")}. Please remove them to check out, and email ${SHIPPING_QUOTE_EMAIL} for a freight quote.`
      : "There was a problem with your cart. Please refresh the page and try again.";

const removeUndefinedValues = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedValues);
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.entries(value).reduce<Record<string, any>>(
      (cleanedValue, [key, entry]) => {
        if (entry === undefined) {
          return cleanedValue;
        }

        cleanedValue[key] = removeUndefinedValues(entry);
        return cleanedValue;
      },
      {},
    );
  }

  return value;
};

export default function CartContextProvider(props: PropsWithChildren) {
  const firestore = useFirestore();
  const router = useRouter();
  const { cartDetails } = useShoppingCart();
  const { user } = useContext(UserContext);

  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [readyToCheckout, setReadyToCheckout] = useState<boolean>(false);
  const [startedCheckout, setStartedCheckout] = useState<boolean>(false);
  const [isSideCartOpen, setIsSideCartOpen] = useState<boolean>(false);
  const [onSiteCheckout, setOnSiteCheckout] = useState<StoredCheckout | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const cartLinesKey = checkoutLinesKey(Object.values(cartDetails ?? {}));
  useEffect(() => {
    setCheckoutError(null);
  }, [cartLinesKey]);

  /** Saves the cart the webhook fulfils from; returns the user it was saved under. */
  const saveCartAs = async (items: any[], stripeSessionId: string): Promise<string | null> => {
    try {
      const authUser = user?.uid ? user : await waitForAuthUser();
      const { uid } = authUser;

      if (!uid) {
        throw new Error("Missing authenticated user for cart save.");
      }

      let cartData: any = {
        author: uid,
        lastUsed: new Date(),
        dateAdded: new Date(),
        paid: false,
        cart: removeUndefinedValues(items),
        stripeSessionId: stripeSessionId,
        originate: "web",
      };
      await addDoc(collection(firestore, CARTS), cartData);
      return uid;
    } catch (error) {
      console.log("saveCart error", error);
      setCheckoutError("There was an error trying to save your cart. Please try again.");
      return null;
    }
  };

  const saveCart = async (items: any[], stripeSessionId: string) =>
    Boolean(await saveCartAs(items, stripeSessionId));

  const startOnSiteCheckout = async (
    items: any[],
    returnPath: string,
    source: StoredCheckout["source"],
  ): Promise<StoredCheckout | null> => {
    setCheckoutError(null);
    try {
      const result = await createOnSiteCheckoutSession(toCheckoutLines(items));
      if (!result.ok) {
        setCheckoutError(checkoutProblemMessage(result));
        return null;
      }
      const pricedItems = withCheckoutPrices(items, result.parts);
      const authorUid = await saveCartAs(pricedItems, result.sessionId);
      if (!authorUid) {
        return null;
      }
      const started: StoredCheckout = {
        clientSecret: result.clientSecret,
        sessionId: result.sessionId,
        items: pricedItems,
        returnPath: checkoutReturnPath(returnPath),
        source,
        authorUid,
        linesKey: checkoutLinesKey(items),
        createdAt: Date.now(),
      };
      writeStoredCheckout(started);
      setOnSiteCheckout(started);
      setStartedCheckout(true);
      return started;
    } catch (error) {
      console.log("on-site checkout error", error);
      setCheckoutError("Checkout is currently not available. Please try again in a moment.");
      return null;
    }
  };

  const checkout = async (itemsOverride?: any[], returnPath?: string): Promise<boolean> => {
    const items = itemsOverride ?? Object.values(cartDetails ?? {});
    if (CHECKOUT_MODE === "onsite") {
      const started = await startOnSiteCheckout(
        items,
        returnPath ?? "/",
        itemsOverride ? "buyNow" : "cart",
      );
      if (!started) return false;
      setIsSideCartOpen(false);
      router.push("/checkout");
      return true;
    }
    setCheckoutError(null);
    try {
      const result = await createCheckoutSession(toCheckoutLines(items), returnPath);
      if (!result.ok) {
        setCheckoutError(checkoutProblemMessage(result));
        return false;
      }
      const cartSaved = await saveCart(withCheckoutPrices(items, result.parts), result.sessionId);
      if (!cartSaved) {
        return false;
      }

      setStartedCheckout(true);
      window.location.assign(result.url);
      return true;
    } catch (error) {
      console.log("error", error);
      setCheckoutError("Checkout is currently not available. Please try again in a moment.");
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        checkout,
        startOnSiteCheckout,
        onSiteCheckout,
        checkoutError,
        readyToCheckout,
        setReadyToCheckout,
        saveCart,
        selectedPart,
        setSelectedPart,
        startedCheckout,
        setStartedCheckout,
        isSideCartOpen,
        setIsSideCartOpen,
      }}
    >
      {props.children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
