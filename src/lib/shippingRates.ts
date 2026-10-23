// Shipping prices and rules (FedEx Ground, priced per shipment). Parts Authority bills shipping at cost,
// so these come from its shipping cost data (shipping_data_2026). Re-check them quarterly or when a new
// cost file arrives; see docs/data-refresh.md.

/** Price per box by billable weight: the 75th percentile of the 2026 costs (90th for the heaviest), rounded up to .99. */
export const SHIPPING_TIERS = [
  { maxLb: 1, cents: 799 },
  { maxLb: 3, cents: 1199 },
  { maxLb: 10, cents: 1599 },
  { maxLb: 20, cents: 1999 },
  { maxLb: 40, cents: 2999 },
  { maxLb: 70, cents: 3999 },
  { maxLb: 150, cents: 6099 },
] as const;

/** FedEx dimensional weight divisor: cubic inches per billable pound. */
export const DIM_DIVISOR = 139;

/** Heaviest box FedEx Ground takes; a heavier shipment is priced as several boxes. */
export const MAX_BOX_LB = 150;

/** Billable weight for a part with no dimensions and no category median (prices it in the 3–10 lb tier). */
export const FALLBACK_BILLABLE_LB = 5;

/** Added once per shipment containing a long or heavy part, which FedEx surcharges. */
export const LONG_OR_HEAVY = { longestSideIn: 48, weightLb: 50, surchargeCents: 3000 };

/** Past any of these a part ships by freight, so it can't be bought online. */
export const FREIGHT_LIMITS = { weightLb: 150, longestSideIn: 108, lengthPlusGirthIn: 165 };

/** Alaska, Hawaii, U.S. territories and military addresses cost far more to reach. */
export const REMOTE_STATES = ["AK", "HI", "PR", "VI", "GU", "AS", "MP", "UM", "AA", "AE", "AP"];
export const REMOTE_MULTIPLIER = 2.5;

/** What shoppers see next to the shipping price. */
export const SHIPPING_SERVICE = "FedEx Ground";

/** Business days to ship: same day before the cutoff, otherwise the next business day. */
export const HANDLING_DAYS = { min: 0, max: 1 };
/** FedEx Ground business days in transit. */
export const TRANSIT_DAYS = { min: 1, max: 3 };
/** Orders placed before this hour ship the same business day. */
export const SHIP_CUTOFF = { hour: 15, timeZone: "America/New_York" };

/** Where shoppers ask for a freight quote. */
export const SHIPPING_QUOTE_EMAIL = "kim@partspass.app";

/** One part's shipping size; serializable so product pages can price quantities in the browser. */
export interface Parcel {
  weightLb: number | null;
  lengthIn: number | null;
  widthIn: number | null;
  heightIn: number | null;
  /** Billable pounds used when the weight or any dimension is missing: the part category's median. */
  fallbackLb: number;
}

export interface ParcelLine {
  parcel: Parcel;
  quantity: number;
}

const sortedSides = (parcel: Parcel) =>
  [parcel.lengthIn, parcel.widthIn, parcel.heightIn]
    .map((side) => Math.ceil(side ?? 0))
    .sort((a, b) => b - a);

export const hasFullDimensions = (parcel: Parcel) =>
  [parcel.weightLb, parcel.lengthIn, parcel.widthIn, parcel.heightIn].every(
    (value) => value !== null && value > 0,
  );

export const isFreightOnly = (parcel: Parcel) => {
  if ((parcel.weightLb ?? 0) > FREIGHT_LIMITS.weightLb) return true;
  const [length, width, height] = sortedSides(parcel);
  return (
    length > FREIGHT_LIMITS.longestSideIn ||
    (hasFullDimensions(parcel) && length + 2 * (width + height) > FREIGHT_LIMITS.lengthPlusGirthIn)
  );
};

export const isLongOrHeavy = (parcel: Parcel) =>
  (parcel.weightLb ?? 0) > LONG_OR_HEAVY.weightLb || sortedSides(parcel)[0] > LONG_OR_HEAVY.longestSideIn;

/** Billable pounds for everything packed into one shipment: the greater of total weight and total volume ÷ 139. */
export const billableLb = (lines: ParcelLine[]) => {
  let weight = 0;
  let volume = 0;
  lines.forEach(({ parcel, quantity }) => {
    if (hasFullDimensions(parcel)) {
      const [length, width, height] = sortedSides(parcel);
      weight += (parcel.weightLb ?? 0) * quantity;
      volume += length * width * height * quantity;
    } else {
      weight += Math.max(parcel.weightLb ?? 0, parcel.fallbackLb) * quantity;
    }
  });
  return Math.max(1, Math.ceil(Math.max(weight, volume / DIM_DIVISOR)));
};

const tierCents = (lb: number) =>
  (SHIPPING_TIERS.find((tier) => lb <= tier.maxLb) ?? SHIPPING_TIERS[SHIPPING_TIERS.length - 1]).cents;

/** Price for one shipment (one box, or several when it passes 150 lb). */
export const shipmentCents = (lines: ParcelLine[]) => {
  if (lines.length === 0) return 0;
  let lb = billableLb(lines);
  let cents = 0;
  while (lb > MAX_BOX_LB) {
    cents += tierCents(MAX_BOX_LB);
    lb -= MAX_BOX_LB;
  }
  cents += tierCents(lb);
  return lines.some((line) => isLongOrHeavy(line.parcel)) ? cents + LONG_OR_HEAVY.surchargeCents : cents;
};

export const isRemoteState = (state: string | null | undefined) =>
  REMOTE_STATES.includes(String(state ?? "").trim().toUpperCase());

/** The remote-address price, rounded up to .99. */
export const remoteShippingCents = (cents: number) =>
  cents > 0 ? Math.ceil((cents * REMOTE_MULTIPLIER + 1) / 100) * 100 - 1 : 0;
