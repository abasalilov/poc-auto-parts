import { markupPrice } from "@/lib/pricing";

export const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BASE_URL;
};

export const formatSearchResults = (items: any) => {
  if (items && items.length > 0) {
    return items.map((i: any) => {
      const manufacturer = String(
        i.manufacturer ??
          i.brand ??
          i.brand_name ??
          i.vendor ??
          i.supplier ??
          i.supplier_name ??
          i.mfg ??
          i.mfg_name ??
          i.Manufacturer ??
          i.Brand ??
          i["Brand Name"] ??
          i.Vendor ??
          i.Supplier ??
          i["Supplier Name"] ??
          i.MFG ??
          "",
      ).trim();
      const partNumber = String(
        i.part_number ?? i.partNumber ?? i["Part Number"] ?? i["PART_NUMBER"] ?? "",
      ).trim();
      const partKey = String(i.partkey ?? i.partKey ?? i["part_key"] ?? "").trim();
      const basePrice = Number(i.Price) * 100;
      const corePrice = Number(i["Core Price"]) * 100;
      const price = markupPrice(basePrice, corePrice);
      const formttedPart = {
        image: "",
        manufacturer,
        description: i.description,
        category1: i.category_1,
        category2: i.category_2,
        price: price,
        extra_description: i.extra_description,
        pies_description: i.pies_description,
        pies_images: i.pies_images,
        id: i.id,
        partKey,
        partNumber,
        productLine: i["Product Line"],
        qtyOnHand: i["Quantity On Hand"],
        engineId: i.engine_id,
        selectedQty: "1",
        tagline: i.tagline,
        name: `${manufacturer} ${i.category_2}`,
        currency: "USD",
        product_data: {
          metadata: {
            type: `${i.category_2}`,
          },
        },
      };
      return formttedPart;
    });
  } else {
    return [];
  }
};

export const handleOpenDropDown = (
  dropDownName: string,
  optionsLength: number,
) => {
  let warning = "";
  if (optionsLength === 0) {
    if (dropDownName === "Make") {
      warning = "Please select a year first";
    }
    if (dropDownName === "Model") {
      warning = "Please select year and make";
    }
    if (dropDownName === "Engine") {
      warning = "Please select the year, make and model first";
    }
    alert(warning);
  }
};

export const titleizeWord = (str: string) =>
  `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`.replaceAll("_", " ");

export const kebabToTitle = (str: string) =>
  str.split("-").map(titleizeWord).join(" ");

export const toBreadcrumbs = (pathname: string, { rootName = "Home" } = {}) =>
  pathname
    .split("/")
    .filter(Boolean)
    .reduce(
      (acc: any, curr: any, idx: number, arr) => {
        acc.path += `/${curr}`;
        acc.crumbs.push({
          path: acc.path,
          name: titleizeWord(curr),
        });

        if (idx === arr.length - 1) return acc.crumbs;
        else return acc;
      },
      { path: "", crumbs: [] },
    );

export const parseEngineTitleForUrl = (x: string) => {
  return x.replaceAll(" ", "_").replaceAll("/", "-");
};

export const parseMfgForUrl = (x: string) => {
  return x.replaceAll("/", ",").replaceAll(" ", "_");
};

export const parseEngineTitleForQuery = (x: string) => {
  return x.replaceAll("_", " ").replaceAll("-", "/");
};

export const formatPartUrl = (x: string): string => {
  return x
    .replace(" - ", "+")
    .replace("&amp;", "and")
    .replace("&", "and")
    .replaceAll(" ", "_")
    .replaceAll("/", ",")
    .replace("%2C", ",");
};

export const formatUrlToQuery = (x: string): string => {
  return x
    .replace("%2C", "/")
    .replace("%2B", " - ")
    .replaceAll("%26", "&amp;")
    .replace("_and_", " &amp; ")
    .replaceAll("_", " ")
    .replaceAll(",", "/");
};

export const formatUrlToLabel = (x: string): string => {
  return x
    .replace("%2C", "/")
    .replace("%2B", " - ")
    .replace(" &amp; ", " & ")
    .replaceAll("_", " ")
    .replaceAll(",", "/");
};

export const isNumeric = (num: any) => {
  return !isNaN(num);
};
