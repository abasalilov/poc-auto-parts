"use client";

import { useEffect, useState } from "react";
import { ClockIcon, TruckIcon } from "@heroicons/react/24/outline";

const POLL_INTERVAL_MS = 60 * 1000;

export type CountdownData = {
  messageType: "countdown" | "next_business_day" | "monday";
  countdownMinutes: number | null;
  countdownDisplayText?: string;
  boldPhrase?: string;
  line1: string;
  line2: string;
};

type Props = {
  onCountdownData?: (data: CountdownData | null) => void;
  /** One small text line for the cart totals, instead of its own banner. */
  inline?: boolean;
};

export default function ShippingCountdownBanner({ onCountdownData, inline = false }: Props) {
  const [data, setData] = useState<CountdownData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCountdown = async () => {
    try {
      const res = await fetch("/api/shipping-countdown", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        onCountdownData?.(json);
      } else {
        onCountdownData?.(null);
      }
    } catch {
      setData(null);
      onCountdownData?.(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountdown();
    const interval = setInterval(fetchCountdown, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return null;

  const isCountdown = data.messageType === "countdown";
  const isUrgent = isCountdown && data.countdownMinutes != null && data.countdownMinutes < 5;

  const renderLine1 = () => {
    if (isCountdown && data.countdownDisplayText) {
      return (
        <>
          Order in the next{" "}
          <span
            className={
              isUrgent
                ? "font-bold text-red-600"
                : "font-bold text-green-600"
            }
          >
            {data.countdownDisplayText}
          </span>{" "}
          to ship today.
        </>
      );
    }
    if (data.boldPhrase && data.line1.includes(data.boldPhrase)) {
      const [before, after] = data.line1.split(data.boldPhrase);
      return (
        <>
          {before}
          <span className="font-bold text-gray-900">{data.boldPhrase}</span>
          {after}
        </>
      );
    }
    return data.line1;
  };

  if (inline) {
    return (
      <p className="font-mont flex items-start gap-1.5 text-xs text-gray-500">
        <ClockIcon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          {renderLine1()} {data.line2.replace(/^Estimated delivery:\s*/, "Arrives ")}
        </span>
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/95 px-5 py-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-200/90 text-amber-800">
          <TruckIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mont text-sm font-medium text-gray-800">
            {renderLine1()}
          </p>
          <p className="font-mont mt-0.5 text-xs text-gray-600">{data.line2}</p>
        </div>
      </div>
    </div>
  );
}
