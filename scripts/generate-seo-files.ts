// Writes the sitemap (public/sitemap.xml + public/sitemaps/*.xml), the brand and category lists
// (the catalog_listing table) and the Google Merchant feed (public/feeds/google-merchant.tsv.gz)
// before `next build`. Builds pass --skip-catalog; run `npm run seo-files` to refill the catalog too.
import { createWriteStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";
import { createGzip } from "node:zlib";
import type { RowDataPacket } from "mysql2/promise";

import { getPool, query } from "@/lib/db";
import { imageFolderCheck, pageCount } from "@/lib/catalog";
import { isIndexable } from "@/lib/indexing";
import { extractPartImageNames, buildPartImageUrl, listImageFolders } from "@/lib/partImages";
import { feedHeader, feedRow, merchantFeedItem } from "@/lib/merchantFeed";
import { sellPriceCents } from "@/lib/pricing";
import { clean, cleanDescription } from "@/lib/productQueries";
import { PARCEL_COLUMNS, PARCEL_JOINS, parcelFromRow, type ParcelRow } from "@/lib/shippingParcels";
import {
  brandListPath,
  brandSlug,
  partTypeListPath,
  partTypeSlug,
  productPath,
  siteUrl,
} from "@/lib/productUrl";

const URLS_PER_FILE = 45000;
const LOOKUP_BATCH = 2000;
const LOOKUP_CONCURRENCY = 4;
const PUBLIC_DIR = path.join(process.cwd(), "public");
const SITEMAP_DIR = path.join(PUBLIC_DIR, "sitemaps");
const FEED_DIR = path.join(PUBLIC_DIR, "feeds");
const STATIC_PATHS = ["/", "/about", "/faq", "/return-policy", "/privacy", "/terms-of-use", "/brands", "/categories"];

type ProductRow = RowDataPacket & ParcelRow & {
  id: number;
  manufacturer: string;
  part_number: string;
  tagline: string | null;
  description: string | null;
  category_1: string | null;
  category_2: string | null;
  pa_line_code: string;
  Cost: string | null;
  Core_Charge: string | null;
  UPC: string | null;
};

interface Product {
  path: string;
  row: ProductRow;
  imageNames: string[];
  piesDescription: string;
  indexable: boolean;
}

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

const urlset = (urls: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `<url><loc>${escapeXml(url)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;

const sitemapIndex = (files: string[], lastmod: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files
    .map((file) => `<sitemap><loc>${escapeXml(`${siteUrl()}/sitemaps/${file}`)}</loc><lastmod>${lastmod}</lastmod></sitemap>`)
    .join("\n")}\n</sitemapindex>\n`;

const itemKey = (lineCode: unknown, partNumber: unknown) =>
  `${String(lineCode ?? "").trim().toUpperCase()}|${String(partNumber ?? "").trim().toUpperCase()}`;

/** One row per product page, choosing the lowest part id like `getProduct` does. */
async function loadProductRows() {
  const rows = await query<ProductRow>(
    `SELECT p.id, p.manufacturer, p.part_number, p.tagline, p.description, p.category_1, p.category_2,
            p.pa_line_code, pa.Cost, pa.Core_Charge, pa.UPC, ${PARCEL_COLUMNS}
       FROM partsauthority pa
       JOIN part p ON p.part_number = pa.MPN AND p.pa_line_code = pa.Line_Code
       ${PARCEL_JOINS}
      WHERE pa.Quantity_Total > 0`,
  );
  rows.sort((a, b) => a.id - b.id);
  const byPath = new Map<string, ProductRow>();
  rows.forEach((row) => {
    const p = productPath({ manufacturer: row.manufacturer, partNumber: row.part_number });
    if (p && !byPath.has(p)) byPath.set(p, row);
  });
  return byPath;
}

/** Runs `sql` (with one `IN (?)` placeholder) over part numbers in batches, a few at a time. */
async function batchedLookup<T extends RowDataPacket>(partNumbers: string[], sql: string) {
  const batches: string[][] = [];
  for (let i = 0; i < partNumbers.length; i += LOOKUP_BATCH) batches.push(partNumbers.slice(i, i + LOOKUP_BATCH));
  const results: T[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: LOOKUP_CONCURRENCY }, async () => {
      while (next < batches.length) {
        const batch = batches[next++];
        results.push(...(await query<T>(sql, [batch])));
      }
    }),
  );
  return results;
}

async function loadImagesAndDescriptions(partNumbers: string[]) {
  const [imageRows, descriptionRows] = await Promise.all([
    batchedLookup<RowDataPacket & { PartNumber: string; ProductLine: string; ImageName: string }>(
      partNumbers,
      `SELECT PartNumber, ProductLine, ImageName FROM pies_images WHERE PartNumber IN (?)`,
    ),
    batchedLookup<RowDataPacket & { part_number: string; pa_line_code: string; descriptions: string | null }>(
      partNumbers,
      `SELECT part_number, pa_line_code, descriptions FROM pies_descriptions WHERE part_number IN (?)`,
    ),
  ]);

  const imageNames = new Map<string, string[]>();
  imageRows.forEach((row) => {
    const key = itemKey(row.ProductLine, row.PartNumber);
    imageNames.set(key, [...(imageNames.get(key) ?? []), row.ImageName]);
  });
  const descriptions = new Map<string, string>();
  descriptionRows.forEach((row) => {
    const key = itemKey(row.pa_line_code, row.part_number);
    if (!descriptions.has(key) && row.descriptions) descriptions.set(key, row.descriptions);
  });
  return { imageNames, descriptions };
}

async function loadProducts(hasImages: (lineCode: string) => boolean): Promise<Product[]> {
  const byPath = await loadProductRows();
  const rows = Array.from(byPath.values());
  const { imageNames, descriptions } = await loadImagesAndDescriptions(
    Array.from(new Set(rows.map((row) => row.part_number))),
  );

  return Array.from(byPath, ([productUrlPath, row]) => {
    const key = itemKey(row.pa_line_code, row.part_number);
    const names = hasImages(row.pa_line_code)
      ? extractPartImageNames({ pies_images: (imageNames.get(key) ?? []).join(",") })
      : [];
    const piesDescription = cleanDescription(descriptions.get(key));
    return {
      path: productUrlPath,
      row,
      imageNames: names,
      piesDescription,
      indexable: isIndexable({
        images: names,
        piesDescription,
        priceCents: sellPriceCents(row.Cost, row.Core_Charge),
      }),
    };
  }).sort((a, b) => a.path.localeCompare(b.path));
}

const LISTING_COLUMNS = [
  "path",
  "brand_slug",
  "brand_name",
  "part_type_slug",
  "part_type",
  "category_1",
  "line_code",
  "part_number",
  "image",
] as const;

type ListingRow = Record<(typeof LISTING_COLUMNS)[number], string>;

const listingRows = (products: Product[]): ListingRow[] =>
  products
    .filter((product) => product.indexable)
    .map(({ path: productUrlPath, row, imageNames }) => ({
      path: productUrlPath,
      brand_slug: brandSlug(row.manufacturer),
      brand_name: clean(row.manufacturer),
      part_type_slug: partTypeSlug(clean(row.category_2)),
      part_type: clean(row.category_2),
      category_1: clean(row.category_1),
      line_code: row.pa_line_code,
      part_number: row.part_number,
      image: imageNames[0],
    }));

/** Replaces the listing in one transaction, so pages keep reading the old one until it commits. */
async function writeListing(rows: ListingRow[]) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM catalog_listing");
    for (let i = 0; i < rows.length; i += LOOKUP_BATCH) {
      const batch = rows.slice(i, i + LOOKUP_BATCH).map((row) => LISTING_COLUMNS.map((column) => row[column]));
      await connection.query(`INSERT INTO catalog_listing (${LISTING_COLUMNS.join(", ")}) VALUES ?`, [batch]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    if ((error as { code?: string }).code === "ER_NO_SUCH_TABLE") {
      throw new Error("catalog_listing table is missing; run migrations/2026-10-13-catalog-listing.sql");
    }
    throw error;
  } finally {
    connection.release();
  }
}

/** Every page of every brand and part type list. */
const listPaths = (rows: ListingRow[]) => {
  const tally = (key: "brand_slug" | "part_type_slug") => {
    const counts = new Map<string, number>();
    rows.forEach((row) => row[key] && counts.set(row[key], (counts.get(row[key]) ?? 0) + 1));
    return Array.from(counts).sort(([a], [b]) => a.localeCompare(b));
  };
  return [
    ...tally("brand_slug").flatMap(([slug, count]) =>
      Array.from({ length: pageCount(count) }, (_, i) => brandListPath(slug, i + 1)),
    ),
    ...tally("part_type_slug").flatMap(([slug, count]) =>
      Array.from({ length: pageCount(count) }, (_, i) => partTypeListPath(slug, i + 1)),
    ),
  ];
};

async function writeSitemap(pagePaths: string[], productPaths: string[]) {
  const base = siteUrl();
  await rm(SITEMAP_DIR, { recursive: true, force: true });
  await mkdir(SITEMAP_DIR, { recursive: true });

  const files = ["pages.xml"];
  await writeFile(path.join(SITEMAP_DIR, "pages.xml"), urlset(pagePaths.map((p) => `${base}${p}`)));
  for (let i = 0; i < productPaths.length; i += URLS_PER_FILE) {
    const file = `products-${i / URLS_PER_FILE + 1}.xml`;
    files.push(file);
    await writeFile(
      path.join(SITEMAP_DIR, file),
      urlset(productPaths.slice(i, i + URLS_PER_FILE).map((p) => `${base}${p}`)),
    );
  }
  await writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), sitemapIndex(files, new Date().toISOString()));
  return files.length - 1;
}

async function writeFeed(products: Product[]) {
  await rm(FEED_DIR, { recursive: true, force: true });
  await mkdir(FEED_DIR, { recursive: true });
  const out = createGzip();
  const file = createWriteStream(path.join(FEED_DIR, "google-merchant.tsv.gz"));
  out.pipe(file);
  const write = async (line: string) => {
    if (!out.write(`${line}\n`)) await once(out, "drain");
  };

  await write(feedHeader());
  let written = 0;
  for (const { row, imageNames, piesDescription } of products) {
    const item = merchantFeedItem({
      manufacturer: row.manufacturer,
      partNumber: row.part_number,
      lineCode: row.pa_line_code,
      category1: row.category_1,
      category2: row.category_2,
      tagline: row.tagline,
      notes: row.description,
      piesDescription,
      cost: row.Cost,
      core: row.Core_Charge,
      upc: row.UPC,
      images: imageNames.map((name) => buildPartImageUrl(row.pa_line_code, name)).filter(Boolean),
      parcel: parcelFromRow(row),
    });
    if (!item) continue;
    await write(feedRow(item));
    written += 1;
  }
  out.end();
  await once(file, "finish");
  return written;
}

async function main() {
  const started = Date.now();
  const elapsed = () => `${Math.round((Date.now() - started) / 1000)}s`;

  const imageFolders = await listImageFolders();
  console.log(
    imageFolders
      ? `[seo] image bucket: ${imageFolders.length} line code folders`
      : "[seo] warning: couldn't list the image bucket, assuming every line code has images",
  );
  const hasImages = imageFolderCheck(imageFolders);
  const products = await loadProducts(hasImages);
  const indexable = products.filter((product) => product.indexable);
  const missingImages = new Set(products.map((p) => p.row.pa_line_code).filter((code) => !hasImages(code)));
  console.log(
    `[seo] ${products.length} in-stock products, ${indexable.length} indexable, ` +
      `${products.filter((p) => !hasImages(p.row.pa_line_code)).length} from ${missingImages.size} line codes ` +
      `without uploaded images (${elapsed()})`,
  );

  const listing = listingRows(products);
  const lists = listPaths(listing);
  // Refilling the table during deploys loads the production database, so builds skip it and
  // `npm run seo-files` refills it on demand.
  if (process.argv.includes("--skip-catalog") || process.env.VERCEL_ENV === "preview") {
    console.log(`[seo] catalog: leaving catalog_listing as it is (${lists.length} list pages)`);
  } else {
    await writeListing(listing);
    console.log(`[seo] catalog: ${listing.length} listed products, ${lists.length} list pages (${elapsed()})`);
  }

  const sitemapFiles = await writeSitemap(
    [...STATIC_PATHS, ...lists],
    indexable.map((product) => product.path),
  );
  console.log(`[seo] sitemap: ${indexable.length} products in ${sitemapFiles} files (${elapsed()})`);

  const feedItems = await writeFeed(products);
  console.log(
    `[seo] merchant feed: ${feedItems} items, ${products.length - feedItems} skipped without image or price, or freight-only (${elapsed()})`,
  );
}

main()
  .then(() => getPool().end())
  .catch((error) => {
    console.error("[seo] generation failed:", error);
    process.exit(1);
  });
