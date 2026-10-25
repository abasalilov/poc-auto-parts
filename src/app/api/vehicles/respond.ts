const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export async function respondWith<T>(label: string, load: () => Promise<T>) {
  try {
    return Response.json(await load(), { headers: CACHE_HEADERS });
  } catch (error) {
    console.error(`${label} failed`, error);
    return Response.json({ error: `Failed to load ${label}` }, { status: 500 });
  }
}
