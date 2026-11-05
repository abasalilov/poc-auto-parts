"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface MobileContext {
  isMobile: boolean;
  screenChecked: boolean;
}

// Create Context Object
export const MobileContext = createContext<MobileContext>({
  isMobile: false,
  screenChecked: false,
});

// Constants
const MOBILE_BREAKPOINT = 768;

export default function MobileContextProvider({ children }: PropsWithChildren) {
  // Simplified state management
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 0,
  );
  const [isMobile, setIsMobile] = useState(width <= MOBILE_BREAKPOINT);
  const [screenChecked, setScreenChecked] = useState(width !== 0);

  // Simplified window resize handler
  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;

    window.addEventListener("resize", handleWindowSizeChange);
    return () => window.removeEventListener("resize", handleWindowSizeChange);
  }, []);

  useEffect(() => {
    setIsMobile(width <= MOBILE_BREAKPOINT);
    setScreenChecked(true);
  }, [width]);

  const value = useMemo(
    () => ({
      isMobile,
      screenChecked,
    }),
    [isMobile, screenChecked],
  );

  return (
    <MobileContext.Provider value={value}>{children}</MobileContext.Provider>
  );
}
export const useMobile = () => useContext(MobileContext);
