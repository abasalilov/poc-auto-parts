type CanonicalProductIdInput = {
  manufacturer?: unknown;
  partNumber?: unknown;
  part_number?: unknown;
} & Record<string, unknown>;

const normalizeManufacturerToken = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const normalizePartNumberToken = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

export const getCanonicalProductId = (item: CanonicalProductIdInput): string => {
  const manufacturer = normalizeManufacturerToken(item.manufacturer);
  const partNumber = normalizePartNumberToken(item.partNumber ?? item.part_number);

  if (!manufacturer || !partNumber) {
    return "";
  }

  return `${manufacturer}_${partNumber}`;
};
