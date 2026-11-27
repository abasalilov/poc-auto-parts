"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export default function MetaPageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const trackPageView = () => {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
        return;
      }

      if (attempts < 20) {
        attempts += 1;
        timeoutId = setTimeout(trackPageView, 250);
      }
    };

    trackPageView();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  return null;
}
