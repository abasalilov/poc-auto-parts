import { productPath } from "@/lib/productUrl";

export const resolveCartItemUrl = (item: any) => productPath(item ?? {});
