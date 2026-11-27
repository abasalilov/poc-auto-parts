"use client";

import { useEffect, useRef } from "react";

/** Runs `onRestore` when the browser restores this page from the back/forward cache (e.g. Back from Stripe). */
export function useBackForwardRestore(onRestore: () => void) {
  const callback = useRef(onRestore);
  callback.current = onRestore;

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) callback.current();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}
