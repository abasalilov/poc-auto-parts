export type BodyType = "sedan" | "coupe" | "hatchback" | "suv" | "pickup" | "minivan" | "van";

/** Model-name keywords per body type, checked in this order; anything unmatched is a sedan. */
const KEYWORDS: [BodyType, string[]][] = [
  ["minivan", [
    "TRANSIT CONNECT", "ODYSSEY", "SIENNA", "CARAVAN", "PACIFICA", "TOWN & COUNTRY", "TOWN AND COUNTRY",
    "SEDONA", "CARNIVAL", "QUEST", "VOYAGER", "ROUTAN", "MAZDA5", "MPV", "UPLANDER", "FREESTAR",
    "WINDSTAR", "SHARAN", "ENTOURAGE", "RONDO", "ZAFIRA", "ORLANDO", "MERIVA", "SPORTVAN", "AVANZA", "VENTURE", "MONTANA", "RELAY", "TERRAZA", "PROMASTER CITY", "NV200", "CITY EXPRESS",
  ]],
  ["van", [
    "E-150", "E-250", "E-350", "E-450", "ECONOLINE", "TRANSIT", "EXPRESS", "SAVANA", "PROMASTER",
    "SPRINTER", "ASTRO", "SAFARI", "HIACE", "URVAN", "NV350", "CRAFTER", "TRANSPORTER", "MULTIVAN",
    "EUROVAN", "H100", "H200", "H300", "STAREX", "CADDY", "VAN", "PANEL", "COMBI", "C/V", "E-550", "F53",
    "F59", "P30", "L30", "B7", "R15", "R25", "METRIS", "NV1500", "NV2500", "NV3500", "RAM VAN", "CHEVY VAN", "G10", "G20", "G30",
  ]],
  ["pickup", [
    "F-150", "F-250", "F-350", "F-450", "F-550", "SUPER DUTY", "SILVERADO", "SIERRA", "1500", "2500",
    "3500", "TACOMA", "TUNDRA", "T100", "RANGER", "COLORADO", "CANYON", "FRONTIER", "TITAN", "RIDGELINE",
    "GLADIATOR", "MAVERICK", "DAKOTA", "S10", "SONOMA", "LOBO", "AVALANCHE", "SANTA CRUZ", "HILUX",
    "MARK LT", "EXPLORER SPORT TRAC", "B2300", "B2500", "B3000", "B4000", "EQUATOR", "I-280", "I-290",
    "I-350", "I-370", "CHEYENNE", "C10", "K10", "PICKUP", "PICK UP", "SSR", "BAJA", "AMAROK",
    "SAVEIRO", "NP300", "LUV", "COURIER", "F-100", "D21", "700", "4000", "4500", "5500", "F-650", "F-750",
    "KODIAK", "TOPKICK", "TILTMASTER", "FORWARD", "LCF", "CABSTAR", "CAMIONES", "C4500", "C5500",
    "C6500", "C7500", "C8500", "T6500", "T7500", "T8500",
  ]],
  ["coupe", [
    "MUSTANG", "CAMARO", "CORVETTE", "CHALLENGER", "86", "BRZ", "MIATA", "MX-5", "370Z", "350Z",
    "GT-R", "SUPRA", "SOLSTICE", "SKY", "VIPER", "TC", "RC", "COUPE", "GT", "S2000", "PRELUDE", "CELICA", "MR2",
    "TIBURON", "RX-8", "THUNDERBIRD", "MONTE CARLO", "SOLARA", "EOS", "CABRIO", "CABRIOLET", "CONVERTIBLE",
    "SPYDER", "ROADSTER",
  ]],
  ["suv", [
    "4RUNNER", "HIGHLANDER", "RAV4", "SEQUOIA", "LAND CRUISER", "FJ CRUISER", "VENZA", "C-HR",
    "TAHOE", "SUBURBAN", "YUKON", "ESCALADE", "EQUINOX", "TRAVERSE", "BLAZER", "TRAILBLAZER", "TRAX",
    "EXPLORER", "EXPEDITION", "ESCAPE", "EDGE", "FLEX", "BRONCO", "ECOSPORT", "CR-V", "PILOT", "HR-V",
    "PASSPORT", "ELEMENT", "ROGUE", "PATHFINDER", "MURANO", "ARMADA", "XTERRA", "KICKS", "JUKE",
    "WRANGLER", "CHEROKEE", "COMPASS", "PATRIOT", "RENEGADE", "LIBERTY", "COMMANDER", "DURANGO",
    "JOURNEY", "ASPEN", "TUCSON", "SANTA FE", "PALISADE", "KONA", "VENUE", "SORENTO", "SPORTAGE",
    "TELLURIDE", "SELTOS", "CX-3", "CX-30", "CX-5", "CX-50", "CX-7", "CX-9", "CX-90", "TRIBUTE",
    "FORESTER", "OUTBACK", "ASCENT", "CROSSTREK", "TRIBECA", "TIGUAN", "ATLAS", "TOUAREG", "Q3", "Q5",
    "Q7", "Q8", "X1", "X3", "X5", "X7", "MDX", "RDX", "ZDX", "RX", "GX", "NX", "LX", "UX", "QX50",
    "QX56", "QX60", "QX80", "ENCLAVE", "ENCORE", "ENVISION", "RENDEZVOUS", "ACADIA", "TERRAIN",
    "ENVOY", "JIMMY", "XT4", "XT5", "XT6", "SRX", "NAVIGATOR", "AVIATOR", "NAUTILUS", "CORSAIR",
    "MKC", "MKT", "MKX", "MOUNTAINEER", "MARINER", "OUTLANDER", "ENDEAVOR", "MONTERO", "VUE",
    "TORRENT", "XC40", "XC60", "XC90", "CAYENNE", "MACAN", "GRAND VITARA", "VITARA",
    "XL-7", "H2", "H3", "RODEO", "TROOPER", "AXIOM", "MODEL X", "MODEL Y", "RANGE ROVER", "DISCOVERY",
    "DEFENDER", "LR2", "LR3", "LR4", "GLE", "GLC", "GLS", "ML", "GL", "G-CLASS",
    "UTILITY", "TRACKER", "CAPTIVA", "NITRO", "RAMCHARGER", "EXCURSION", "FREESTYLE", "TAURUS X",
    "CROSSTOUR", "VERACRUZ", "IX35", "CRETA", "BORREGO", "X-TRAIL", "QASHQAI", "XV", "CROSSTEK", "NIRO",
    "T-CROSS", "TERAMONT", "CROSSFOX", "BR-V",
  ]],
  ["hatchback", [
    "FIT", "YARIS", "FIESTA", "SOUL", "SONIC", "SPARK", "AVEO", "VERSA NOTE", "GOLF", "GTI", "PRIUS",
    "BOLT", "LEAF", "COOPER", "VELOSTER", "RIO5", "MATRIX", "VIBE", "HHR", "CUBE", "XB", "IM", "AVEO5",
    "FORTE5", "SPECTRA5", "PROTEGE5", "MATIZ", "METRO", "C-MAX", "NOTE", "MARCH", "MICRA", "POLO", "UP",
    "LUPO", "RABBIT", "E-GOLF", "R32", "CR-Z", "INSIGHT", "IONIQ", "VOLT", "CALIBER", "BEETLE", "GOL", "KA",
    "FIGO", "BEAT", "CORSA", "POINTER",
  ]],
];

const normalize = (value: string) => ` ${value.toUpperCase().replace(/[^A-Z0-9&-]+/g, " ").trim()} `;

const MATCHERS = KEYWORDS.map(([type, words]) => ({
  type,
  words: words.map((w) => ` ${w} `),
}));

/** Best guess from the model name; the data has no body type, so unknown models are sedans. */
export const bodyTypeForModel = (model: string | null | undefined): BodyType => {
  const name = normalize(String(model ?? ""));
  const hit = MATCHERS.find(({ words }) => words.some((w) => name.includes(w)));
  return hit?.type ?? "sedan";
};
