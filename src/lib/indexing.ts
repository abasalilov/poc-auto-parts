/**
 * Shorter PIES descriptions are generic labels ("Control/Trailing Arm, wheel suspension") that
 * leave the page a near-duplicate of every other part of its type.
 */
export const MIN_DESCRIPTION_CHARS = 50;

export interface IndexableSource {
  images: string[];
  piesDescription: string;
  priceCents: number;
}

/**
 * Product pages worth asking Google to index: sellable, with a photo and a real description.
 * Everything else stays purchasable but is `noindex`, left out of the sitemap and not linked
 * from the brand, category or related parts lists.
 */
export const isIndexable = (product: IndexableSource) =>
  product.images.length > 0 &&
  product.priceCents > 0 &&
  product.piesDescription.length >= MIN_DESCRIPTION_CHARS;
