const BUCKET = "parts_pass_test_part_images";
const BASE_URL = `https://storage.googleapis.com/${BUCKET}`;

/**
 * Line-code folders that exist in the image bucket, or null if the bucket can't be listed.
 * `pies_images` lists images for every line code, but not every folder has been uploaded.
 */
export const listImageFolders = async (): Promise<string[] | null> => {
  const folders: string[] = [];
  let pageToken = "";
  try {
    do {
      const params = new URLSearchParams({ delimiter: "/", fields: "prefixes,nextPageToken" });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o?${params}`);
      if (!res.ok) return null;
      const page: { prefixes?: string[]; nextPageToken?: string } = await res.json();
      folders.push(...(page.prefixes ?? []).map((prefix) => prefix.replace(/\/$/, "")));
      pageToken = page.nextPageToken ?? "";
    } while (pageToken);
  } catch {
    return null;
  }
  return folders.length > 0 ? folders.sort() : null;
};

type PartLike = Record<string, any>;
type ApiImageLike = string | { name?: string | null } | null | undefined;

const normalizeName = (value: string) => value.trim();

const getNormalizedToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, " ");

const uniqueNames = (names: string[]) => {
  const seen = new Set<string>();
  return names.filter((name) => {
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
};

const scoreImageName = (name: string, index: number) => {
  const token = getNormalizedToken(name);
  let score = index;

  if (/\b(fro|front|main|primary|hero)\b/.test(token)) score -= 100;
  if (/\b(ang|angle|iso|isometric)\b/.test(token)) score -= 70;
  if (/\b(top|upr)\b/.test(token)) score -= 20;

  if (/\b(side|left|right)\b/.test(token)) score += 10;
  if (/\b(back|rear|bottom)\b/.test(token)) score += 25;
  if (/\b(close|detail|zoom|connector|plug|socket|terminal)\b/.test(token)) score += 120;

  return score;
};

const orderImageNames = (names: string[]) =>
  names
    .map((name, index) => ({
      name,
      score: scoreImageName(name, index),
      index,
    }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ name }) => name);

export const extractPartImageNames = (part: PartLike, apiImages: ApiImageLike[] = []) => {
  const piesImageNames = String(part?.pies_images ?? "")
    .split(",")
    .map(normalizeName)
    .filter(Boolean);
  const apiImageNames = apiImages
    .map((image) => (typeof image === "string" ? image : String(image?.name ?? "")))
    .map(normalizeName)
    .filter(Boolean);

  return orderImageNames(uniqueNames([...piesImageNames, ...apiImageNames]));
};

export const buildPartImageUrl = (productLine: string, imageName: string) => {
  const normalizedProductLine = String(productLine ?? "").trim();
  const normalizedImageName = normalizeName(imageName);

  if (!normalizedProductLine || !normalizedImageName) {
    return "";
  }

  return `${BASE_URL}/${normalizedProductLine}/${normalizedImageName}`;
};
