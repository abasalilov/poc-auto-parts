import { NextResponse, type NextRequest } from "next/server";

import { findProductPathByPartKey } from "@/lib/productQueries";

const PRODUCT_DEPTH = 8;
const CACHE = "public, s-maxage=86400, stale-while-revalidate=604800";

const redirectTo = (request: NextRequest, path: string) => {
  const response = NextResponse.redirect(new URL(path, request.url), 301);
  response.headers.set("Cache-Control", CACHE);
  return response;
};

/**
 * The old vehicle catalog is retired. Old product URLs (last segment is the part key)
 * permanently redirect to the canonical product page; everything else goes home.
 */
export async function GET(request: NextRequest, { params }: { params: { slug?: string[] } }) {
  const segments = params.slug ?? [];
  const partKey = segments.length === PRODUCT_DEPTH ? segments[PRODUCT_DEPTH - 1] : "";

  if (/^\d{1,12}$/.test(partKey)) {
    const path = await findProductPathByPartKey(partKey);
    if (path) return redirectTo(request, path);

    return new NextResponse(
      '<!doctype html><title>Part unavailable | Parts Pass</title><p>This part is no longer available. <a href="/">Search for parts</a></p>',
      {
        status: 410,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": CACHE,
          "X-Robots-Tag": "noindex",
        },
      },
    );
  }

  return redirectTo(request, "/");
}
