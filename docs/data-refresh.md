# Data refresh checklist

What has to be regenerated when source data changes, how, and when. Run anything that touches
MySQL during quiet hours: the production instance is small (60 connections) and heavy queries
take the site down.

## When a source table changes

| Source changes | Regenerate | How | Notes |
|---|---|---|---|
| `partsauthority` (stock, cost) | `catalog_listing` (brand and category list pages) | `npm run seo-files` | Builds skip this step (`--skip-catalog`) to protect the database, so it only refills when run by hand. |
| `partsauthority` | Sitemap and Google Merchant feed (`public/sitemap.xml`, `public/sitemaps/`, `public/feeds/google-merchant.tsv.gz`) | Any deploy (the `prebuild` step), or `npm run seo-files` | Prices in the feed come from `Cost`/`Core_Charge` at build time. |
| `partsauthority` | `category_shipping_weight` | Run `migrations/2026-10-19-category-shipping-weight.sql` in one TablePlus session | Only matters when the in-stock mix shifts a lot; quarterly is enough. |
| `part_dimensions` (new weights/dimensions import) | `category_shipping_weight` | Same migration file | Product shipping prices read `part_dimensions` directly, so they update without this; only the fallback for parts with no dimensions needs the re-run. |
| `part` (new parts, categories) | `catalog_listing`, sitemap, feed, `category_shipping_weight` | `npm run seo-files`, then the migration file | |
| `pies_images`, `pies_descriptions`, or new images in the image bucket | `catalog_listing`, sitemap, feed | `npm run seo-files` | A product is only listed and indexed once it has an image and a PIES description. |
| New shipping cost data from Parts Authority (like `shipping_data_2026`) | Shipping price tiers and surcharges in `src/lib/shippingRates.ts` | Re-run the cost analysis, update that file, deploy | Also review quarterly; FedEx fuel surcharges change weekly. |

## Caches (refresh on their own)

After a data change, pages can show old data until these expire. A deploy clears them sooner.

| What | Cache length |
|---|---|
| Product pages | 1 hour |
| Brand and category list pages, catalog lookups, product fitment, related parts | 1 day |
| Vehicle, fitment and image API responses | 1 day at the CDN, stale for up to 7 days while refreshing |
| Engine category counts | 1 hour |
| Part search | 5 minutes |
| Live stock and the ship-today countdown | Not cached |

## Regular schedule

| When | Task |
|---|---|
| After each `partsauthority` update | `npm run seo-files` (or deploy, if the list pages don't need refreshing) |
| After each dimensions import | Run the `category_shipping_weight` migration file |
| Quarterly | Re-run the shipping cost analysis; re-run the `category_shipping_weight` migration file |

## Tables to leave alone

- `parts_dimensions` (older table): still used by the Firebase shipping functions.
- `shipping_data` (2024 shipping costs): superseded by `shipping_data_2026`, kept for reference.
- `part_dimensions_new`: test import; safe to drop.
