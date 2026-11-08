import type { RowDataPacket } from "mysql2/promise";
import { unstable_cache } from "next/cache";

import { query } from "@/lib/db";
import { decodeHtmlEntities } from "@/lib/categorySearch";
import { buildPartImageUrl, extractPartImageNames } from "@/lib/partImages";
import { sellPriceCents } from "@/lib/pricing";
import { brandSlug, itemKey, normalizePartNumber, productPath, type ItemKey } from "@/lib/productUrl";

export interface FitmentGroup {
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
}

export interface Product {
  id: string;
  partIds: number[];
  manufacturer: string;
  partNumber: string;
  lineCode: string;
  partKey: string;
  category1: string;
  category2: string;
  title: string;
  tagline: string;
  description: string;
  piesDescription: string;
  gtin: string | null;
  priceCents: number;
  coreCents: number;
  images: string[];
}

type PartRow = RowDataPacket & {
  id: number;
  manufacturer: string;
  part_number: string;
  partkey: string | null;
  tagline: string | null;
  description: string | null;
  category_1: string | null;
  category_2: string | null;
  pa_line_code: string;
  Cost: string | null;
  Core_Charge: string | null;
  UPC: string | null;
};

type FitmentRow = RowDataPacket & {
  make: string;
  model: string;
  year_from: string | number;
  year_to: string | number;
};

/** Supplier text numbers punctuation in Windows-1252, where 128-159 aren't Unicode characters. */
const WINDOWS_1252: Record<number, string> = {
  128: "€", 130: "‚", 132: "„", 133: "…", 134: "†", 135: "‡", 137: "‰", 139: "‹", 145: "‘",
  146: "’", 147: "“", 148: "”", 149: "•", 150: "–", 151: "—", 153: "™", 155: "›",
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
};

/**
 * The import dropped every ";" from supplier text and some was HTML-encoded twice, so
 * `&ampltli&ampgt` is `<li>` and `&#146s` is `’s`.
 */
const ENTITY = /&(?:#(\d{1,4})|(amp|lt|gt|quot|apos|nbsp));?/gi;

const decodeEntity = (_: string, code: string | undefined, name: string | undefined) => {
  if (name) return NAMED_ENTITIES[name.toLowerCase()];
  const number = Number(code);
  if (WINDOWS_1252[number]) return WINDOWS_1252[number];
  return number < 32 || (number >= 127 && number < 160) ? " " : String.fromCodePoint(number);
};

const decodeSupplierEntities = (value: string) => {
  let text = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const decoded = text.replace(ENTITY, decodeEntity);
    if (decoded === text) break;
    text = decoded;
  }
  return text;
};

const BLOCK_TAG = /<\/?(?:ul|ol|li|p|br|div|h[1-6]|tr|td)\b[^>]*>/gi;
const INLINE_TAG = /<\/?(?:b|strong|i|em|u|span|font|sup|sub|a)\b[^>]*>/gi;

const BREAK = "\uE000";

/** List items and paragraphs become sentences, unless the text already has punctuation there. */
const stripMarkup = (value: string) =>
  value
    .replace(INLINE_TAG, "")
    .replace(BLOCK_TAG, BREAK)
    .replace(new RegExp(`\\s*(?:${BREAK}\\s*)+`, "g"), BREAK)
    .replace(new RegExp(`^${BREAK}|${BREAK}$`, "g"), "")
    .replace(new RegExp(`([.!?:;,])${BREAK}`, "g"), "$1 ")
    .replace(new RegExp(`${BREAK}(?=[.!?:;,])`, "g"), "")
    .replaceAll(BREAK, ". ");

export const clean = (value: unknown) =>
  stripMarkup(decodeHtmlEntities(decodeSupplierEntities(String(value ?? ""))))
    .replace(/\s+/g, " ")
    .trim();

/**
 * Shorter pieces join the phrase before them and never count as repeated on their own, since
 * fragments like "TL 521 82." recur legitimately in different sentences.
 */
const MIN_PHRASE_WORDS = 4;

/** Unpunctuated run-ons open by restating earlier sentences before adding new ones. */
const MIN_REPEATED_OPENING_WORDS = 6;

/**
 * Fitment lists carry the make forward ("Chevrolet K1500 1999-1988, ... GMC K1500 1999-1988"),
 * so a repeated model with years can be a different vehicle and is never dropped.
 */
const isModelYear = (word: string) => /^(19|20)\d\d$/.test(word);

const keyWords = (text: string) =>
  text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

const splitPieces = (text: string) => text.split(/(?<=[.,;!?])\s+/);

const splitPhrases = (text: string) => {
  const phrases: string[] = [];
  let leading = "";
  splitPieces(text).forEach((part) => {
    if (keyWords(part).length >= MIN_PHRASE_WORDS || !phrases.length) {
      const phrase = leading ? `${leading} ${part}` : part;
      if (keyWords(phrase).length >= MIN_PHRASE_WORDS) {
        phrases.push(phrase);
        leading = "";
      } else {
        leading = phrase;
      }
    } else {
      phrases[phrases.length - 1] += ` ${part}`;
    }
  });
  if (leading) phrases.push(leading);
  return phrases;
};

/**
 * Supplier descriptions join several fields that restate each other, so the same sentences
 * appear two or three times. A phrase, or the opening of one, is dropped when its words were
 * already said and ended a phrase there; cutting anywhere else would join unrelated words.
 */
export const cleanDescription = (value: unknown) => {
  const said: string[] = [];
  const boundaries = new Set([0]);
  const isRepeat = (words: string[]) =>
    words.length >= MIN_PHRASE_WORDS &&
    !words.some(isModelYear) &&
    Array.from(boundaries).some((end) => {
      const start = end - words.length;
      return start >= 0 && words.every((word, i) => said[start + i] === word);
    });
  const remember = (text: string) =>
    splitPieces(text).forEach((piece) => {
      said.push(...keyWords(piece));
      boundaries.add(said.length);
    });

  let bracketDepth = 0;
  const kept = splitPhrases(clean(value)).flatMap((phrase) => {
    const tokens = phrase.split(" ");
    const tokenWords = tokens.map(keyWords);
    const words = tokenWords.flat();
    // Bracketed qualifiers that run over several phrases belong to the vehicle before them, so
    // the same words mean something different for the next vehicle.
    const opened = bracketDepth;
    bracketDepth = Math.max(0, bracketDepth + (phrase.split("(").length - phrase.split(")").length));
    const bracketed = opened > 0 || bracketDepth > 0;
    if (!words.length) return [];
    if (bracketed) {
      remember(phrase);
      return [phrase];
    }
    if (isRepeat(words)) return [];
    let cut = tokens.length - 1;
    while (cut > 0) {
      const opening = tokenWords.slice(0, cut).flat();
      const startsSentence = /[.,;!?]$/.test(tokens[cut - 1]) || /^[A-Z]/.test(tokens[cut]);
      if (startsSentence && opening.length >= MIN_REPEATED_OPENING_WORDS && isRepeat(opening)) break;
      cut -= 1;
    }
    const fresh = tokens.slice(cut).join(" ");
    remember(fresh);
    return [fresh];
  });
  return kept.join(" ").replace(/[,;]$/, "");
};

const isValidGtinChecksum = (digits: string) => {
  const body = digits.slice(0, -1).split("").reverse();
  const sum = body.reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1));
};

/** Google accepts GTIN-8/12/13/14 with a valid check digit; distributor UPCs are sometimes zero-padded. */
export const toGtin = (upc: unknown): string | null => {
  let digits = String(upc ?? "").replace(/\D/g, "");
  while (digits.length > 14 && digits.startsWith("0")) digits = digits.slice(1);
  if (![8, 12, 13, 14].includes(digits.length) || /^0+$/.test(digits)) return null;
  return isValidGtinChecksum(digits) ? digits : null;
};

/** One row per make and model, merging rows that only differed by HTML entities. */
export const groupFitment = (rows: FitmentRow[]): FitmentGroup[] => {
  const groups = new Map<string, FitmentGroup>();
  rows.forEach((row) => {
    const make = clean(row.make);
    const model = clean(row.model);
    const key = `${make}|${model}`;
    const yearFrom = String(row.year_from);
    const yearTo = String(row.year_to);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { make, model, yearFrom, yearTo });
      return;
    }
    if (yearFrom < group.yearFrom) group.yearFrom = yearFrom;
    if (yearTo > group.yearTo) group.yearTo = yearTo;
  });
  return Array.from(groups.values());
};

const loadImages = async (lineCode: string, partNumber: string) => {
  const rows = await query<RowDataPacket & { ImageName: string }>(
    `SELECT ImageName FROM pies_images WHERE PartNumber = ? AND ProductLine = ?`,
    [partNumber, lineCode],
  );
  const names = extractPartImageNames({
    pies_images: rows.map((row) => row.ImageName).join(","),
  });
  return names.map((name) => buildPartImageUrl(lineCode, name)).filter(Boolean);
};

const loadPiesDescription = async (lineCode: string, partNumber: string) => {
  const rows = await query<RowDataPacket & { descriptions: string | null }>(
    `SELECT descriptions FROM pies_descriptions WHERE part_number = ? AND pa_line_code = ? LIMIT 1`,
    [partNumber, lineCode],
  );
  return cleanDescription(rows[0]?.descriptions);
};

/**
 * Universal parts match tens of thousands of fitment rows, each a few disk reads, which took
 * minutes per page and exhausted the 60 MySQL connections when crawled. The list reads at most
 * this many rows, in index order so every render of a page shows the same models.
 */
export const FITMENT_ROW_LIMIT = 500;
/** Safety nets only; the row limit and engine-first lookup keep these to a few seconds. */
const FITMENT_TIMEOUT_MS = 15000;
const FIT_CHECK_TIMEOUT_MS = 5000;

export interface ProductFitment {
  groups: FitmentGroup[];
  /** The part has more fitment rows than the list reads, so `groups` is a sample. */
  partial: boolean;
}

const loadFitment = async (partIds: number[]): Promise<ProductFitment> => {
  const [rows, counted] = await Promise.all([
    query<FitmentRow>(
      `SELECT /*+ MAX_EXECUTION_TIME(${FITMENT_TIMEOUT_MS}) */
              e.make, e.model, MIN(e.year) AS year_from, MAX(e.year) AS year_to
         FROM (SELECT eccp.engine_x_category_1_x_category_2_id AS ecc_id
                 FROM engine_x_category_1_x_category_2_x_part eccp
                WHERE eccp.part_id IN (?)
                ORDER BY eccp.part_id, eccp.id
                LIMIT ${FITMENT_ROW_LIMIT}) capped
         JOIN engine_x_category_1_x_category_2 ecc ON ecc.id = capped.ecc_id
         JOIN engine_x_category_1 ec ON ec.id = ecc.engine_x_category_1_id
         JOIN engine e ON e.id = ec.engine_id
        GROUP BY e.make, e.model
        ORDER BY e.make, e.model`,
      [partIds],
    ),
    query<RowDataPacket & { n: number }>(
      `SELECT COUNT(*) AS n FROM (SELECT 1 FROM engine_x_category_1_x_category_2_x_part
          WHERE part_id IN (?) LIMIT ${FITMENT_ROW_LIMIT + 1}) t`,
      [partIds],
    ),
  ]);
  return { groups: groupFitment(rows), partial: Number(counted[0]?.n) > FITMENT_ROW_LIMIT };
};

const loadCachedFitment = unstable_cache(loadFitment, ["product-fitment"], {
  revalidate: 86400,
});

/** Makes and models a part fits, with year ranges, cached for a day. */
export const getProductFitment = async (partIds: number[]): Promise<ProductFitment> => {
  if (partIds.length === 0) return { groups: [], partial: false };
  return loadCachedFitment([...partIds].sort((a, b) => a - b));
};

/**
 * Whether the part fits one engine. Starts from the engine's few hundred category rows, so it's
 * complete and fast even for parts with huge fitment lists.
 */
export const partFitsEngine = async (partIds: number[], engineId: number): Promise<boolean> => {
  if (partIds.length === 0) return false;
  const rows = await query<RowDataPacket>(
    `SELECT /*+ MAX_EXECUTION_TIME(${FIT_CHECK_TIMEOUT_MS}) */ 1
       FROM engine_x_category_1 ec
       STRAIGHT_JOIN engine_x_category_1_x_category_2 ecc ON ecc.engine_x_category_1_id = ec.id
       STRAIGHT_JOIN engine_x_category_1_x_category_2_x_part eccp
         ON eccp.engine_x_category_1_x_category_2_id = ecc.id AND eccp.part_id IN (?)
      WHERE ec.engine_id = ?
      LIMIT 1`,
    [partIds, engineId],
  );
  return rows.length > 0;
};

/**
 * Which items (line code and part number, like a product page) fit one engine, as `itemKey`s.
 * Looks up the items' part ids, then checks them from the engine's side like `partFitsEngine`.
 */
export const itemsFittingEngine = async (items: ItemKey[], engineId: number): Promise<string[]> => {
  if (items.length === 0) return [];
  const parts = await query<RowDataPacket & { id: number; pa_line_code: string; part_number: string }>(
    `SELECT id, pa_line_code, part_number FROM part WHERE (pa_line_code, part_number) IN (?)`,
    [items.map((item) => [item.lineCode, item.partNumber])],
  );
  if (parts.length === 0) return [];
  const fitting = await query<RowDataPacket & { part_id: number }>(
    `SELECT /*+ MAX_EXECUTION_TIME(${FIT_CHECK_TIMEOUT_MS}) */ DISTINCT eccp.part_id
       FROM engine_x_category_1 ec
       STRAIGHT_JOIN engine_x_category_1_x_category_2 ecc ON ecc.engine_x_category_1_id = ec.id
       STRAIGHT_JOIN engine_x_category_1_x_category_2_x_part eccp
         ON eccp.engine_x_category_1_x_category_2_id = ecc.id AND eccp.part_id IN (?)
      WHERE ec.engine_id = ?`,
    [parts.map((part) => part.id), engineId],
  );
  const fittingIds = new Set(fitting.map((row) => Number(row.part_id)));
  return Array.from(
    new Set(
      parts
        .filter((part) => fittingIds.has(Number(part.id)))
        .map((part) => itemKey({ lineCode: part.pa_line_code, partNumber: part.part_number })),
    ),
  );
};

/** Maps a legacy catalog part key to its canonical in-stock product path. */
export const findProductPathByPartKey = async (partKey: string): Promise<string | null> => {
  const rows = await query<RowDataPacket & { manufacturer: string; part_number: string }>(
    `SELECT p.manufacturer, p.part_number
       FROM part p
       JOIN partsauthority pa
         ON pa.Line_Code = p.pa_line_code AND pa.MPN = p.part_number AND pa.Quantity_Total > 0
      WHERE p.partkey = ?
      LIMIT 1`,
    [partKey],
  );
  return rows[0] ? productPath({ manufacturer: rows[0].manufacturer, partNumber: rows[0].part_number }) : null;
};

export const getProduct = async (brand: string, rawPartNumber: string): Promise<Product | null> => {
  const partNumber = normalizePartNumber(rawPartNumber);
  if (!/^[A-Z0-9-]{1,40}$/.test(partNumber)) return null;

  const rows = await query<PartRow>(
    `SELECT p.id, p.manufacturer, p.part_number, p.partkey, p.tagline, p.description,
            p.category_1, p.category_2, p.pa_line_code, pa.Cost, pa.Core_Charge, pa.UPC
       FROM part p
       JOIN partsauthority pa
         ON pa.Line_Code = p.pa_line_code AND pa.MPN = p.part_number AND pa.Quantity_Total > 0
      WHERE p.part_number = ?
      ORDER BY p.id`,
    [partNumber],
  );

  const matches = rows.filter((row) => brandSlug(row.manufacturer) === brand);
  if (matches.length === 0) return null;

  const primary = matches[0];
  const lineCode = primary.pa_line_code;
  const sameItem = matches.filter((row) => row.pa_line_code === lineCode);
  const partIds = sameItem.map((row) => Number(row.id));

  const [images, piesDescription] = await Promise.all([
    loadImages(lineCode, primary.part_number),
    loadPiesDescription(lineCode, primary.part_number),
  ]);

  const manufacturer = clean(primary.manufacturer);
  const category2 = clean(primary.category_2);
  const coreCents = Math.round(Number(primary.Core_Charge ?? 0) * 100) || 0;

  return {
    id: String(primary.id),
    partIds,
    manufacturer,
    partNumber: primary.part_number,
    lineCode,
    partKey: String(primary.partkey ?? ""),
    category1: clean(primary.category_1),
    category2,
    title: [manufacturer, category2, primary.part_number].filter(Boolean).join(" "),
    tagline: clean(primary.tagline),
    description: clean(primary.description),
    piesDescription,
    gtin: toGtin(primary.UPC),
    priceCents: sellPriceCents(primary.Cost, primary.Core_Charge),
    coreCents,
    images,
  };
};
