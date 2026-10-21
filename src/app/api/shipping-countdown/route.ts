import { NextResponse } from "next/server";

import { SHIP_CUTOFF, TRANSIT_DAYS } from "@/lib/shippingRates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Same-day shipping countdown based on server time.
 * Company cutoff: 3:00 PM in company timezone (no warehouse reference).
 * All time logic uses server time in COMPANY_TZ.
 */

const COMPANY_TZ = SHIP_CUTOFF.timeZone;
const CUTOFF_HOUR = SHIP_CUTOFF.hour;
const BUSINESS_DAYS_MIN = TRANSIT_DAYS.min;
const BUSINESS_DAYS_MAX = TRANSIT_DAYS.max;

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun = 0, Mon = 1, ..., Sat = 6

function getLocalParts(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const hour = parseInt(get("hour"), 10);
  const minute = parseInt(get("minute"), 10);
  const second = parseInt(get("second"), 10);
  const weekdayShort = get("weekday");
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const weekdayMap: Record<string, Weekday> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[weekdayShort] ?? 0;
  return { hour, minute, second, weekday, year, month, day };
}

function addBusinessDays(fromY: number, fromM: number, fromD: number, days: number): { y: number; m: number; d: number } {
  const date = new Date(fromY, fromM - 1, fromD);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const d = date.getDay();
    if (d !== 0 && d !== 6) added++;
  }
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
  };
}

function formatShortDate(y: number, m: number, d: number): string {
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function nextBusinessDay(year: number, month: number, day: number): { y: number; m: number; d: number } {
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  const d = date.getDay();
  if (d === 0) date.setDate(date.getDate() + 1); // Sun -> Mon
  if (d === 6) date.setDate(date.getDate() + 2);  // Sat -> Mon
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
  };
}

function nextMonday(year: number, month: number, day: number): { y: number; m: number; d: number } {
  const date = new Date(year, month - 1, day);
  const d = date.getDay();
  const daysToAdd = d === 0 ? 1 : 8 - d;
  date.setDate(date.getDate() + daysToAdd);
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
  };
}

export async function GET() {
  const now = new Date();
  const { hour, minute, second, weekday, year, month, day } = getLocalParts(now, COMPANY_TZ);

  const isWeekend = weekday === 0 || weekday === 6;
  const totalMinutesNow = hour * 60 + minute;
  const cutoffMinutes = CUTOFF_HOUR * 60;
  const countdownMinutes = cutoffMinutes - totalMinutesNow;
  const isBeforeCutoff = countdownMinutes > 0;

  let shipDate: { y: number; m: number; d: number };
  let messageType: "countdown" | "next_business_day" | "monday";
  let countdownMinutesOut: number | null = null;
  let countdownDisplayText: string | null = null;
  let line1: string;
  let line2: string;

  if (isWeekend) {
    messageType = "monday";
    shipDate = nextMonday(year, month, day);
    const start = addBusinessDays(shipDate.y, shipDate.m, shipDate.d, BUSINESS_DAYS_MIN);
    const end = addBusinessDays(shipDate.y, shipDate.m, shipDate.d, BUSINESS_DAYS_MAX);
    const startStr = formatShortDate(start.y, start.m, start.d);
    const endStr = formatShortDate(end.y, end.m, end.d);
    line1 = "Order today — ships first thing Monday.";
    if (start.m === end.m && start.y === end.y) {
      const monthName = new Date(start.y, start.m - 1, 1).toLocaleDateString("en-US", { month: "short" });
      line2 = `Estimated delivery: ${monthName} ${start.d}–${end.d}`;
    } else {
      line2 = `Estimated delivery: ${startStr}–${endStr}`;
    }
  } else if (!isBeforeCutoff) {
    messageType = "next_business_day";
    shipDate = nextBusinessDay(year, month, day);
    const start = addBusinessDays(shipDate.y, shipDate.m, shipDate.d, BUSINESS_DAYS_MIN);
    const end = addBusinessDays(shipDate.y, shipDate.m, shipDate.d, BUSINESS_DAYS_MAX);
    line1 = "Order now to ship next business day.";
    line2 = `Estimated delivery: ${formatShortDate(start.y, start.m, start.d)} – ${formatShortDate(end.y, end.m, end.d)}`;
  } else {
    messageType = "countdown";
    countdownMinutesOut = countdownMinutes;
    shipDate = { y: year, m: month, d: day };
    const start = addBusinessDays(shipDate.y, shipDate.m, shipDate.d, BUSINESS_DAYS_MIN);
    const end = addBusinessDays(shipDate.y, shipDate.m, shipDate.d, BUSINESS_DAYS_MAX);
    const hrs = Math.floor(countdownMinutes / 60);
    const mins = countdownMinutes % 60;
    countdownDisplayText =
      hrs >= 1 ? `${hrs} hr${hrs !== 1 ? "s" : ""} ${mins} min${mins !== 1 ? "s" : ""}` : `${mins} min${mins !== 1 ? "s" : ""}`;
    line1 = `Order in the next ${countdownDisplayText} to ship today.`;
    line2 = `Estimated delivery: ${formatShortDate(start.y, start.m, start.d)} – ${formatShortDate(end.y, end.m, end.d)}`;
  }

  return NextResponse.json(
    {
      messageType,
      countdownMinutes: countdownMinutesOut,
      countdownDisplayText: countdownDisplayText ?? undefined,
      boldPhrase: messageType === "monday" ? "ships first thing Monday" : messageType === "next_business_day" ? "next business day" : undefined,
      line1,
      line2,
      serverEpoch: now.getTime(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
