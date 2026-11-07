export type Vehicle = {
  name: string;
  make: string;
  model: string;
  variant: string;
  modelYear: string;
  batteryKwh: number;
  efficiencyMiPerKwh: number;
  connectorLabel: string;
  connectorAliases: string[];
  initials: string;
  sourceUrl: string;
  sourceLabel: string;
};

const ccs = ["ccs", "combined charging system", "type 2"];
const miPerKwh = (kwhPer100Km: number) => 62.137 / kwhPer100Km;

function vehicle(
  make: string,
  model: string,
  variant: string,
  modelYear: string,
  batteryKwh: number,
  efficiencyMiPerKwh: number,
  connectorLabel: string,
  sourceUrl: string,
  sourceLabel: string,
  connectorAliases = ccs,
): Vehicle {
  return {
    name: `${make} ${model} ${variant}`,
    make,
    model,
    variant,
    modelYear,
    batteryKwh,
    efficiencyMiPerKwh,
    connectorLabel,
    connectorAliases,
    initials: make === "Volkswagen" ? "VW" : make.slice(0, 2).toUpperCase(),
    sourceUrl,
    sourceLabel,
  };
}

const vwId3 = "https://www.volkswagen-newsroom.com/en/the-new-id3-6240/technical-data-6249";
const vwId4 = "https://www.volkswagen-newsroom.com/en/the-id4-from-volkswagen-15712/technical-data-of-the-id4-15724";
const vwId5 = "https://www.volkswagen-newsroom.com/en/international-vehicle-presentation-volkswagen-id5-and-id5-gtx-7925/technical-data-of-the-id5-7952";
const vwId7 = "https://www.volkswagen-newsroom.com/en/the-volkswagen-id7-17897/standard-equipment-in-the-id7-pro-17903";
const vwId7Tourer = "https://www.volkswagen-newsroom.com/en/at-a-glance-id7-tourer-19982";
const vwBuzz = "https://www.volkswagen-newsroom.com/en/the-new-id-buzz-and-id-buzz-cargo-international-media-drive-15144/overview-15145";
const skodaEnyaq = "https://www.skoda.co.uk/_doc/59c9c4c4-a400-4302-9db5-276860a4b81b";
const skodaElroq = "https://www.skoda.co.uk/_doc/a659045e-52e5-4046-af5f-9ab0e3ad6564";
const cupraBorn = "https://www.cupraofficial.com/content/dam/public/cupra-website/generic/pdf/cupra-born-catalogue-ene-25.pdf";
const cupraBorn23 = "https://www.cupraofficial.com/content/dam/public/cupra-website/myco/2425/generic/pdf/cupra-born-catalogue-2023.pdf";
const audiQ445 = "https://uploads.audi-mediacenter.com/system/production/car_motorizations/1292/file_en/e14d3bf3b5d821e3d7be3c0bb58de427379bf403/eTD-Audi-Q4-45-e-tron-quattro-210kW_250508.pdf?1746784733=";
const audiQ455 = "https://uploads.audi-mediacenter.com/system/production/car_motorizations/1288/file_en/8074bf61e54097c9650802eb8c69e1cabaf62307/eTD-Audi-Q4-55-e-tron-quattro-250kW_241106.pdf?1730968288=";
const audiQ6 = "https://www.audi-mediacenter.com/en/the-audi-q6-e-tron-electric-mobility-on-a-new-level-15929/download";
const fordExplorer = "https://www.ford.co.uk/content/dam/guxeu/uk/documents/price-list/cars/PL-Explorer_Customer_Price_List.pdf";
const fordCapri = "https://www.ford.co.uk/content/dam/guxeu/uk/documents/price-list/cars/PL-Capri_Customer_Price_List.pdf";
const nissanLeaf = "https://www.nissan.co.uk/vehicles/new-vehicles/leaf/prices-specifications.html";

// Battery figures are manufacturer-published usable/net capacity. Efficiency
// is a WLTP combined estimate in mi/kWh; where the source publishes kWh/100 km,
// the value is converted with 62.137 / kWh per 100 km. It is not real-world use.
export const vehicles: Vehicle[] = [
  vehicle("Volkswagen", "ID.3", "Pro Performance", "2021", 58, miPerKwh(16.15), "CCS2 · Type 2 AC", vwId3, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.3", "Pro S", "2021", 77, miPerKwh(16.8), "CCS2 · Type 2 AC", vwId3, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.4", "Pro Performance", "2023", 77, miPerKwh(16.5), "CCS2 · Type 2 AC", vwId4, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.4", "Pro 4MOTION", "2023", 77, miPerKwh(17.1), "CCS2 · Type 2 AC", vwId4, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.5", "Pro Performance", "2023", 77, miPerKwh(16.9), "CCS2 · Type 2 AC", vwId5, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.5", "GTX", "2023", 77, miPerKwh(17.1), "CCS2 · Type 2 AC", vwId5, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.7", "Pro", "2024", 77, miPerKwh(15.2), "CCS2 · Type 2 AC", vwId7, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.7 Tourer", "Pro", "2025", 77, miPerKwh(15.55), "CCS2 · Type 2 AC", vwId7Tourer, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID.7 Tourer", "Pro S", "2025", 86, miPerKwh(15.4), "CCS2 · Type 2 AC", vwId7Tourer, "Volkswagen technical data"),
  vehicle("Volkswagen", "ID. Buzz", "Pro", "2023", 77, miPerKwh(21.1), "CCS2 · Type 2 AC", vwBuzz, "Volkswagen technical data"),

  vehicle("Škoda", "Enyaq", "SE L 60", "2025", 59, 4.0, "CCS2 · Type 2 AC", skodaEnyaq, "Škoda UK technical data"),
  vehicle("Škoda", "Enyaq", "SE L 85", "2025", 77, 4.1, "CCS2 · Type 2 AC", skodaEnyaq, "Škoda UK technical data"),
  vehicle("Škoda", "Enyaq", "SportLine 85x", "2025", 77, 3.8, "CCS2 · Type 2 AC", skodaEnyaq, "Škoda UK technical data"),
  vehicle("Škoda", "Enyaq", "vRS", "2025", 79, 3.9, "CCS2 · Type 2 AC", skodaEnyaq, "Škoda UK technical data"),
  vehicle("Škoda", "Enyaq Coupé", "Edition 85", "2025", 77, 4.2, "CCS2 · Type 2 AC", skodaEnyaq, "Škoda UK technical data"),
  vehicle("Škoda", "Enyaq Coupé", "SportLine 85x", "2025", 77, 3.9, "CCS2 · Type 2 AC", skodaEnyaq, "Škoda UK technical data"),
  vehicle("Škoda", "Elroq", "SE 50", "2025", 52, 3.9, "CCS2 · Type 2 AC", skodaElroq, "Škoda UK technical data"),
  vehicle("Škoda", "Elroq", "SE L 60", "2025", 59, 3.9, "CCS2 · Type 2 AC", skodaElroq, "Škoda UK technical data"),
  vehicle("Škoda", "Elroq", "Edition 85", "2025", 77, 4.1, "CCS2 · Type 2 AC", skodaElroq, "Škoda UK technical data"),

  vehicle("CUPRA", "Born", "59 e-Boost", "2025", 59, miPerKwh(16.9), "CCS2 · Type 2 AC", cupraBorn, "CUPRA Born technical data"),
  vehicle("CUPRA", "Born", "77 e-Boost", "2025", 77, miPerKwh(16.7), "CCS2 · Type 2 AC", cupraBorn, "CUPRA Born technical data"),
  vehicle("CUPRA", "Born", "58", "2023", 58, miPerKwh(16.3), "CCS2 · Type 2 AC", cupraBorn23, "CUPRA Born technical data"),

  vehicle("Audi", "Q4 e-tron", "45 quattro", "2025", 77, miPerKwh(17.8), "CCS2 · Type 2 AC", audiQ445, "Audi technical data"),
  vehicle("Audi", "Q4 e-tron", "55 quattro", "2025", 77, miPerKwh(17.85), "CCS2 · Type 2 AC", audiQ455, "Audi technical data"),
  vehicle("Audi", "Q6 e-tron", "Performance", "2025", 94.9, miPerKwh(18.3), "CCS2 · Type 2 AC", audiQ6, "Audi technical data"),

  vehicle("Ford", "Explorer", "58 kWh Style RWD", "2026", 58, miPerKwh(15.5), "CCS2 · Type 2 AC", fordExplorer, "Ford UK price list"),
  vehicle("Ford", "Explorer", "79 kWh Extended RWD", "2026", 79, miPerKwh(14.5), "CCS2 · Type 2 AC", fordExplorer, "Ford UK price list"),
  vehicle("Ford", "Explorer", "77 kWh Extended AWD", "2026", 77, miPerKwh(17.3), "CCS2 · Type 2 AC", fordExplorer, "Ford UK price list"),
  vehicle("Ford", "Capri", "58 kWh Standard Range Style", "2026", 58, miPerKwh(14.9), "CCS2 · Type 2 AC", fordCapri, "Ford UK price list"),
  vehicle("Ford", "Capri", "79 kWh Extended Range Select", "2026", 79, miPerKwh(13.8), "CCS2 · Type 2 AC", fordCapri, "Ford UK price list"),
  vehicle("Ford", "Capri", "79 kWh Extended Range Collection", "2026", 79, miPerKwh(14.6), "CCS2 · Type 2 AC", fordCapri, "Ford UK price list"),
  vehicle("Ford", "Capri", "58 kWh Standard Range Premium", "2026", 58, miPerKwh(15.6), "CCS2 · Type 2 AC", fordCapri, "Ford UK price list"),
  vehicle("Ford", "Capri", "77 kWh Extended Range AWD", "2026", 77, miPerKwh(16.5), "CCS2 · Type 2 AC", fordCapri, "Ford UK price list"),

  vehicle("Nissan", "LEAF", "52 kWh Engage", "2026", 52, 4.6, "CCS2 · Type 2 AC", nissanLeaf, "Nissan UK specifications"),
  vehicle("Nissan", "LEAF", "75 kWh Advance", "2026", 75, 4.28, "CCS2 · Type 2 AC", nissanLeaf, "Nissan UK specifications"),
];
