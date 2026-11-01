export const runtime = "nodejs";

type VinDecodeResult = {
  year: string;
  make: string;
  model: string;
  engine: string;
  trim: string;
  body_class: string;
  confidence: "high" | "medium" | "low";
};

type VinDecodeResponse =
  | { status: "ok"; vin: string; vehicle: VinDecodeResult }
  | { status: "invalid_request"; vin: string; message: string };

const VIN_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const vinDecodeCache = new Map<string, { data: VinDecodeResponse; expiresAt: number }>();

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

const toCleanString = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

function buildEngineLabel(record: Record<string, unknown>) {
  const displacementL = toCleanString(record.DisplacementL);
  const cylinders = toCleanString(record.EngineCylinders);
  const engineModel = toCleanString(record.EngineModel);
  const engineConfiguration = toCleanString(record.EngineConfiguration);

  if (displacementL) {
    const cyl = cylinders ? ` ${cylinders} Cyl` : "";
    return `${displacementL}L${cyl}`.trim();
  }
  if (engineModel) return engineModel;
  if (engineConfiguration) return engineConfiguration;
  return "";
}

function computeConfidence(vehicle: Omit<VinDecodeResult, "confidence">): VinDecodeResult["confidence"] {
  const hasCore = Boolean(vehicle.year && vehicle.make && vehicle.model);
  if (!hasCore) return "low";
  if (vehicle.engine || vehicle.trim) return "high";
  return "medium";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const rawVin = toCleanString(body?.vin).toUpperCase();

  if (!VIN_REGEX.test(rawVin)) {
    return Response.json(
      {
        status: "invalid_request",
        vin: rawVin,
        message: "VIN must be 17 characters (letters and numbers, excluding I, O, Q).",
      } satisfies VinDecodeResponse,
      { status: 400 },
    );
  }

  const now = Date.now();
  const cached = vinDecodeCache.get(rawVin);
  if (cached && cached.expiresAt > now) {
    return Response.json(cached.data);
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${rawVin}?format=json`;
  const response = await fetch(url, { method: "GET", cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) {
    return Response.json(
      {
        status: "invalid_request",
        vin: rawVin,
        message: "Unable to decode VIN right now. Please try again or continue manually.",
      } satisfies VinDecodeResponse,
      { status: 502 },
    );
  }

  const data = (await response.json().catch(() => null)) as
    | { Results?: Array<Record<string, unknown>> }
    | null;
  const record = data?.Results?.[0];
  if (!record) {
    return Response.json(
      {
        status: "invalid_request",
        vin: rawVin,
        message: "VIN response was empty. Please continue manually.",
      } satisfies VinDecodeResponse,
      { status: 502 },
    );
  }

  const year = toCleanString(record.ModelYear);
  const make = titleCase(toCleanString(record.Make));
  const model = titleCase(toCleanString(record.Model));
  const trim =
    toCleanString(record.Trim) ||
    toCleanString(record.Series) ||
    toCleanString(record.Series2);
  const bodyClass = toCleanString(record.BodyClass);
  const engine = buildEngineLabel(record);

  if (!year || !make || !model) {
    const invalidResponse: VinDecodeResponse = {
      status: "invalid_request",
      vin: rawVin,
      message: "We couldn't fully identify this VIN. You can continue manually.",
    };
    vinDecodeCache.set(rawVin, { data: invalidResponse, expiresAt: now + VIN_CACHE_TTL_MS });
    return Response.json(invalidResponse, { status: 200 });
  }

  const vehicleWithoutConfidence = {
    year,
    make,
    model,
    engine,
    trim,
    body_class: bodyClass,
  };
  const decodedVehicle: VinDecodeResult = {
    ...vehicleWithoutConfidence,
    confidence: computeConfidence(vehicleWithoutConfidence),
  };

  const okResponse: VinDecodeResponse = {
    status: "ok",
    vin: rawVin,
    vehicle: decodedVehicle,
  };
  vinDecodeCache.set(rawVin, { data: okResponse, expiresAt: now + VIN_CACHE_TTL_MS });
  return Response.json(okResponse);
}
