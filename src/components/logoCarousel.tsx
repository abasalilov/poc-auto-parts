"use client";
import Image from "next/image";
import delphi from "../../public/delphi.png";
import acdelco from "../../public/acdelco.png";
import walker from "../../public/walker.png";
import holstein from "../../public/holstein.png";
import bosch from "../../public/bosch.png";
import standard from "../../public/standard.png";
import spectra from "../../public/spectra.png";
import ntk from "../../public/ntk.png";
import motorcraft from "../../public/motorcraft.png";
import denso from "../../public/denso.png";

const logos = [
  { alt: "delphi", src: delphi },
  { alt: "acdelco", src: acdelco },
  { alt: "walker", src: walker },
  { alt: "holstein", src: holstein },
  { alt: "bosch", src: bosch },
  { alt: "standard", src: standard },
  { alt: "spectra", src: spectra },
  { alt: "ntk", src: ntk },
  { alt: "ford motor craft", src: motorcraft },
  { alt: "denso", src: denso },
];

export default function LogoCarousel() {
  return (
    <div className="mt-8 w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
      <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:h-10 [&_img]:w-auto [&_img]:max-w-none sm:[&_img]:h-12 animate-infinite-scroll">
        {logos.map((logo, index) => (
          <li key={index}>
            <Image src={logo.src} alt={logo.alt} />
          </li>
        ))}
      </ul>
      <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:h-10 [&_img]:w-auto [&_img]:max-w-none sm:[&_img]:h-12 animate-infinite-scroll" aria-hidden="true">
        {logos.map((logo, index) => (
          <li key={index}>
            <Image src={logo.src} alt={logo.alt} />
          </li>
        ))}
      </ul>
    </div>
  );
}
