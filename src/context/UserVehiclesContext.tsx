"use client";
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { useFirestore } from "reactfire";
import { collection, getDoc, onSnapshot, query, where } from "firebase/firestore";

import { UserContext } from "./UserContext";
import { VEHICLES, AUTHOR } from "@/lib/constants";

interface UserVehiclesContext {
  vehicles: any[];
  loadingVehicles: boolean;
}

// Create Context Object
export const UserVehiclesContext = createContext<UserVehiclesContext>({} as UserVehiclesContext);

// Create a provider for components to consume and subscribe to changes
export default function UserVehiclesContextProvider(props: PropsWithChildren) {
  const firestore = useFirestore();
  const { user } = useContext(UserContext);

  const [vehicles, setVehicles] = useState<any>([]);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(true);

  useEffect(() => {
    const { uid } = user;
    if (!uid) {
      setVehicles([]);
      setLoadingVehicles(false);
      return;
    }

    setLoadingVehicles(true);
    const q = query(collection(firestore, VEHICLES), where(AUTHOR, "==", uid));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const rows: any = [];
      const vehiclesWithEngine: any = [];
      try {
        querySnapshot.forEach(async (doc) => {
          const vehicle = { ...doc.data(), id: doc.id };
          rows.push(vehicle);
        });
        for (const vh of rows) {
          const engine = await getDoc(vh.engine);
          const engineData = engine.data();
          vehiclesWithEngine.push({ ...vh, engine: engineData });
        }
      } catch (e) {
        console.error(e);
      } finally {
        const sortedByMostRecent = vehiclesWithEngine.sort((a: any, b: any) => (a.lastUsed > b.lastUsed ? -1 : 1));
        setVehicles(sortedByMostRecent);
        setLoadingVehicles(false);
      }
    });
    return () => unsubscribe();
  }, [user?.uid, firestore]);

  const value = useMemo(
    () => ({
      vehicles,
      loadingVehicles,
    }),
    [vehicles, loadingVehicles]
  );

  return <UserVehiclesContext.Provider value={value}>{props.children}</UserVehiclesContext.Provider>;
}

export const useUserVehicles = () => useContext(UserVehiclesContext);
