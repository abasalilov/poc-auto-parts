"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFirestore } from "reactfire";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { USERS } from "@/lib/constants";

interface UserContext {
  setUser: (x: any) => void;
  user: any;
  setShowUserEmailDiscountModal: (x: boolean) => void;
  setEmailDiscountHasBeenShow: (x: boolean) => void;
  showUserEmailDiscountModal: boolean;
  emailDiscountHasBeenShow: boolean;
}

// Create Context Object
export const UserContext = createContext<UserContext>({} as UserContext);

// Create a provider for components to consume and subscribe to changes
export default function UserContextProvider(props: PropsWithChildren) {
  const firestore = useFirestore();

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>({});
  const [showUserEmailDiscountModal, setShowUserEmailDiscountModal] =
    useState(false);
  const [emailDiscountHasBeenShow, setEmailDiscountHasBeenShow] =
    useState(false);

  useEffect(() => {
    console.log("test");
    const { uid } = user || {};

    const updateUser = async () => {
      const useRef = doc(firestore, USERS, uid);
      const userSnap = await getDoc(useRef);
      if (userSnap.exists()) {
        await updateDoc(useRef, {
          timestamp: new Date(),
        });
      } else {
        const usersRef = collection(firestore, USERS);
        await setDoc(doc(usersRef, uid), { timestamp: new Date() });
      }
    };
    if (uid) {
      updateUser();
    }
  }, [user]);

  // Handle user state changes
  const onAuthStateChanged = (user: any) => {
    if (!user) {
      const auth = getAuth();

      signInAnonymously(auth)
        .then(() => {
          console.log("User signed in anonymously");
        })
        .catch((error) => {
          if (error.code === "auth/operation-not-allowed") {
            console.log("Enable anonymous in your firebase console.");
          }

          console.error(error);
        });

      return;
    }

    setUser(user);

    if (initializing) {
      setInitializing(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      setShowUserEmailDiscountModal,
      showUserEmailDiscountModal,
      emailDiscountHasBeenShow,
      setEmailDiscountHasBeenShow,
    }),
    [user, setUser, showUserEmailDiscountModal, setShowUserEmailDiscountModal],
  );

  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  );
}
export const useUserContext = () => useContext(UserContext);
