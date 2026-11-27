"use client";
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { useFirestore } from "reactfire";
import { collection, getDoc, onSnapshot, query, where } from "firebase/firestore";

import { UserContext } from "./UserContext";
import { ORDERS, AUTHOR } from "@/lib/constants";

interface OrdersContext {
  orders: any[];
}

// Create Context Object
export const OrdersContext = createContext<OrdersContext>({} as OrdersContext);

// Create a provider for components to consume and subscribe to changes
export default function OrdersContextProvider(props: PropsWithChildren) {
  const firestore = useFirestore();
  const { user } = useContext(UserContext);

  const [orders, setOrders] = useState<any>([]);

  useEffect(() => {
    const { uid } = user;
    if (!uid) return;
    const q = query(collection(firestore, ORDERS), where(AUTHOR, "==", uid));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const orders: any = [];
      try {
        querySnapshot.forEach(async (doc) => {
          const order = { ...doc.data(), id: doc.id };
          orders.push(order);
        });
      } catch (e) {
        console.error(e);
      } finally {
        const sortedByMostRecent = orders.sort((a: any, b: any) => (a.date > b.date ? -1 : 1));
        setOrders(sortedByMostRecent);
      }
    });
    return () => unsubscribe();
  }, [user, firestore]);

  const value = useMemo(
    () => ({
      orders,
    }),
    [orders]
  );

  return <OrdersContext.Provider value={value}>{props.children}</OrdersContext.Provider>;
}

export const useOrders = () => useContext(OrdersContext);
