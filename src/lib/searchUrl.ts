/** Home page URL for a part search; an empty term is the category browser. */
export const searchHref = (term: string) => {
  const trimmed = term.trim();
  return trimmed ? `/?search=${encodeURIComponent(trimmed)}` : "/";
};
