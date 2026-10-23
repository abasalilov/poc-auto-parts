-- Shipping price fallback for parts with no weight or dimensions in part_dimensions:
-- the median billable weight of in-stock parts in the same category_2.
-- The site only reads this table by primary key. Re-run this whole file (one session, quiet hours)
-- after a new part_dimensions import.
-- Every step joins on primary keys or the part.pa_line_code index; there are no correlated subqueries.
CREATE TABLE IF NOT EXISTS category_shipping_weight (
  category_2         VARCHAR(255) NOT NULL,
  median_billable_lb DECIMAL(8,2) NOT NULL,
  parts              INT          NOT NULL,
  PRIMARY KEY (category_2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- 1. Billable weight of each in-stock part with complete dimensions (about 120k rows).
DROP TEMPORARY TABLE IF EXISTS tmp_part_billable;
CREATE TEMPORARY TABLE tmp_part_billable (PRIMARY KEY (line_code, part_number))
SELECT d.line_code,
       d.part_number,
       GREATEST(d.weight_lb, CEIL(d.length_in) * CEIL(d.width_in) * CEIL(d.height_in) / 139) AS billable_lb
  FROM partsauthority pa
  JOIN part_dimensions d ON d.line_code = pa.Line_Code AND d.part_number = pa.MPN
 WHERE pa.Quantity_Total > 0
   AND d.weight_lb IS NOT NULL
   AND d.length_in IS NOT NULL
   AND d.width_in IS NOT NULL
   AND d.height_in IS NOT NULL;

-- 2. One category per part (part can repeat a line code and part number).
DROP TEMPORARY TABLE IF EXISTS tmp_category_billable;
CREATE TEMPORARY TABLE tmp_category_billable (KEY (category_2))
SELECT MIN(p.category_2) AS category_2, b.billable_lb
  FROM tmp_part_billable b
  JOIN part p ON p.pa_line_code = b.line_code AND p.part_number = b.part_number
 WHERE p.category_2 IS NOT NULL AND p.category_2 <> ''
 GROUP BY b.line_code, b.part_number, b.billable_lb;

-- 3. Median per category.
DELETE FROM category_shipping_weight;
INSERT INTO category_shipping_weight (category_2, median_billable_lb, parts)
SELECT category_2, ROUND(AVG(billable_lb), 2), MAX(cnt)
  FROM (
    SELECT category_2,
           billable_lb,
           ROW_NUMBER() OVER (PARTITION BY category_2 ORDER BY billable_lb) AS rn,
           COUNT(*) OVER (PARTITION BY category_2) AS cnt
      FROM tmp_category_billable
  ) ranked
 WHERE rn IN (FLOOR((cnt + 1) / 2), CEIL((cnt + 1) / 2))
 GROUP BY category_2;

DROP TEMPORARY TABLE tmp_part_billable;
DROP TEMPORARY TABLE tmp_category_billable;
