import Image, { type StaticImageData } from "next/image";

import acdelco from "../../public/acdelco.png";
import bosch from "../../public/bosch.png";
import delphi from "../../public/delphi.png";
import denso from "../../public/denso.png";
import holstein from "../../public/holstein.png";
import motorcraft from "../../public/motorcraft.png";
import ntk from "../../public/ntk.png";
import partsPass from "../../public/parts_pass_logo_white.png";
import spectra from "../../public/spectra.png";
import standard from "../../public/standard.png";
import walker from "../../public/walker.png";

type PartImageFallbackProps = {
  part?: Record<string, any> | null;
  partTitle?: string;
  compact?: boolean;
};

const BRAND_LOGOS: Record<string, StaticImageData> = {
  ACDELCO: acdelco,
  BOSCH: bosch,
  DELPHI: delphi,
  DENSO: denso,
  HOLSTEIN: holstein,
  MOTORCRAFT: motorcraft,
  NTK: ntk,
  "SPECTRA PREMIUM": spectra,
  "STANDARD MOTOR PRODUCTS": standard,
  WALKER: walker,
};

/** Branded tile for parts without a photo: the brand's logo when we have one, else ours. */
export default function PartImageFallback({
  part,
  partTitle,
  compact = false,
}: PartImageFallbackProps) {
  const brand = String(part?.manufacturer ?? "").trim().toUpperCase();
  const logo = BRAND_LOGOS[brand] ?? partsPass;

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-white ${
        compact ? "rounded-md px-2" : "rounded-lg px-12"
      }`}
    >
      <Image
        src={logo}
        alt={partTitle || "Part"}
        sizes={compact ? "80px" : "400px"}
        className="h-auto w-full max-w-[280px] object-contain opacity-60 brightness-0"
      />
    </div>
  );
}
