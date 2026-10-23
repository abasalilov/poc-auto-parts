-- Brand and category list pages (/brands/*, /categories/*) read from this table.
-- scripts/generate-seo-files.ts refills it on every build with the products in the sitemap:
-- in stock, priced, with an uploaded image and a PIES description.
-- Collation matches partsvendor so joins on line code and part number use its primary key.
CREATE TABLE IF NOT EXISTS catalog_listing (
  path           VARCHAR(255) NOT NULL,
  brand_slug     VARCHAR(120) NOT NULL,
  brand_name     VARCHAR(255) NOT NULL,
  part_type_slug VARCHAR(120) NOT NULL DEFAULT '',
  part_type      VARCHAR(255) NOT NULL DEFAULT '',
  category_1     VARCHAR(255) NOT NULL DEFAULT '',
  line_code      VARCHAR(20)  NOT NULL,
  part_number    VARCHAR(80)  NOT NULL,
  image          VARCHAR(255) NOT NULL,
  PRIMARY KEY (path),
  KEY brand_list (brand_slug, part_type_slug, part_number),
  KEY part_type_list (part_type_slug, brand_slug, part_number),
  KEY item (line_code, part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
