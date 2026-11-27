"use client";
import { PropsWithChildren } from "react";
import { CartProvider } from "use-shopping-cart";
import {
  FirebaseAppProvider,
  FirestoreProvider,
  useFirebaseApp,
} from "reactfire";
import { getFirestore } from "firebase/firestore";
// import { PayPalScriptProvider } from "@paypal/react-paypal-js";

import CartContextProvider from "@/context/CartContext";
import MobileContextProvider from "@/context/MobileContext";
import UserContextProvider from "@/context/UserContext";
import UserVehiclesContextProvider from "@/context/UserVehiclesContext";
import VehicleContextProvider from "@/context/VehicleContext";
import OrdersContextProvider from "@/context/OrdersContext";
import QueryContextProvider from "@/context/QueryContext";
import PartSearchContextProvider from "@/context/PartSearchContext";

const firebaseConfig = {
  /* Add in your config object from the Firebase console */
  apiKey: process.env.NEXT_PUBLIC_FB_KEY,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
};

const FireBaseInstance = (props: PropsWithChildren) => {
  const firestoreInstance = getFirestore(useFirebaseApp());
  return (
    <FirestoreProvider sdk={firestoreInstance}>
      {props.children}
    </FirestoreProvider>
  );
};

export default function Providers(props: PropsWithChildren) {
  return (
    <CartProvider
      // Mode configuration for Stripe: payment or subscription
      // The mode for how you want to use the hooks. 'client-only' and 'checkout-session' are the options
      cartMode="checkout-session"
      stripe={process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ""}
      currency="USD"
      shouldPersist
      loading={<p aria-live="polite">Loading...</p>}
    >
      <FirebaseAppProvider firebaseConfig={firebaseConfig}>
        <FireBaseInstance>
          <MobileContextProvider>
            <UserContextProvider>
              <OrdersContextProvider>
                <UserVehiclesContextProvider>
                  <VehicleContextProvider>
                    <CartContextProvider>
                      <QueryContextProvider>
                        <PartSearchContextProvider>
                          {props.children}
                        </PartSearchContextProvider>
                      </QueryContextProvider>
                    </CartContextProvider>
                  </VehicleContextProvider>
                </UserVehiclesContextProvider>
              </OrdersContextProvider>
            </UserContextProvider>
          </MobileContextProvider>
        </FireBaseInstance>
      </FirebaseAppProvider>
    </CartProvider>
  );
}
