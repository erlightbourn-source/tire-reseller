// Curated vehicle → factory tire-size lookup, organized by trim level since
// trims on the same model often run different sizes (e.g. BMW 530i vs M5, or a
// Camry LE vs XSE). Performance trims are frequently *staggered* — a different
// size front vs rear — so a gen entry may carry an optional `rear`. When `rear`
// is omitted the fitment is square (front === rear). Sizes are common OE
// fitments; many trims offer options. Expand over time or back with a real API.
//
// Shape: { Make: { Model: { Trim: [ { from, to, size /* front */, rear? } ] } } }

export const FITMENT = {
  Toyota: {
    Camry: {
      "LE / XLE": [{ from: 2018, to: 2025, size: "215/55R17" }, { from: 2012, to: 2017, size: "205/65R16" }],
      "SE": [{ from: 2018, to: 2025, size: "235/45R18" }],
      "XSE / TRD": [{ from: 2018, to: 2025, size: "235/40R19" }],
    },
    Corolla: {
      "L / LE": [{ from: 2020, to: 2025, size: "205/55R16" }, { from: 2014, to: 2019, size: "195/65R15" }],
      "SE / XSE": [{ from: 2020, to: 2025, size: "225/40R18" }],
    },
    "Corolla Cross": {
      "L / LE": [{ from: 2022, to: 2025, size: "205/65R16" }],
      "XLE": [{ from: 2022, to: 2025, size: "225/55R18" }],
    },
    RAV4: {
      "LE / XLE": [{ from: 2019, to: 2025, size: "225/65R17" }],
      "Adventure / TRD": [{ from: 2019, to: 2025, size: "235/55R19" }],
      "Limited": [{ from: 2019, to: 2025, size: "235/55R19" }],
    },
    Highlander: {
      "L / LE": [{ from: 2020, to: 2025, size: "235/65R18" }],
      "XLE / Limited / Platinum": [{ from: 2020, to: 2025, size: "235/55R20" }],
    },
    Sienna: {
      "LE": [{ from: 2021, to: 2025, size: "235/60R18" }],
      "XSE / Limited / Platinum": [{ from: 2021, to: 2025, size: "235/55R20" }],
    },
    "4Runner": {
      "SR5": [{ from: 2010, to: 2025, size: "265/70R17" }],
      "TRD Off-Road / Pro": [{ from: 2014, to: 2025, size: "265/70R17" }],
    },
    Tacoma: {
      "SR / SR5": [{ from: 2016, to: 2025, size: "265/70R16" }],
      "TRD Off-Road": [{ from: 2016, to: 2025, size: "265/70R16" }],
      "TRD Pro": [{ from: 2017, to: 2025, size: "265/70R17" }],
    },
    Tundra: {
      "SR5": [{ from: 2022, to: 2025, size: "265/70R18" }],
      "Limited": [{ from: 2022, to: 2025, size: "275/65R18" }],
      "TRD Pro": [{ from: 2022, to: 2025, size: "285/65R18" }],
    },
    Sequoia: {
      "SR5": [{ from: 2023, to: 2025, size: "265/70R18" }],
      "Limited / Platinum": [{ from: 2023, to: 2025, size: "265/60R20" }],
      "TRD Pro": [{ from: 2023, to: 2025, size: "285/65R18" }],
    },
    Prius: {
      "L Eco / LE": [{ from: 2016, to: 2025, size: "195/65R15" }],
      "XLE / Limited": [{ from: 2016, to: 2025, size: "215/45R17" }],
    },
    GR86: {
      "Base / Premium": [{ from: 2022, to: 2025, size: "215/40R18" }],
    },
    bZ4X: {
      "XLE": [{ from: 2023, to: 2025, size: "235/60R18" }],
      "Limited": [{ from: 2023, to: 2025, size: "235/50R20" }],
    },
  },
  Honda: {
    Civic: {
      "LX / Sport": [{ from: 2022, to: 2025, size: "235/40R18" }, { from: 2016, to: 2021, size: "215/55R16" }],
      "Si": [{ from: 2017, to: 2025, size: "235/40R18" }],
      "Type R": [{ from: 2017, to: 2025, size: "265/30R19" }],
    },
    Accord: {
      "LX / EX": [{ from: 2018, to: 2025, size: "225/50R17" }],
      "Sport / Touring": [{ from: 2018, to: 2025, size: "235/40R19" }],
    },
    "CR-V": {
      "LX / EX": [{ from: 2017, to: 2025, size: "235/65R17" }],
      "EX-L / Touring": [{ from: 2017, to: 2025, size: "235/60R18" }],
    },
    "HR-V": {
      "LX / Sport": [{ from: 2016, to: 2025, size: "215/55R17" }],
      "EX-L": [{ from: 2023, to: 2025, size: "225/50R18" }],
    },
    Passport: {
      "EX-L / TrailSport": [{ from: 2019, to: 2025, size: "245/60R18" }],
      "Elite": [{ from: 2019, to: 2025, size: "245/50R20" }],
    },
    Pilot: {
      "EX / EX-L": [{ from: 2016, to: 2025, size: "245/60R18" }],
      "Elite / Black Edition": [{ from: 2016, to: 2025, size: "255/50R20" }],
    },
    Ridgeline: {
      "Sport / RTL": [{ from: 2017, to: 2025, size: "245/60R18" }],
      "TrailSport / Black Edition": [{ from: 2021, to: 2025, size: "245/60R18" }],
    },
    Odyssey: {
      "EX / EX-L": [{ from: 2018, to: 2025, size: "235/65R18" }],
      "Touring / Elite": [{ from: 2018, to: 2025, size: "235/60R19" }],
    },
  },
  Ford: {
    "F-150": {
      "XL / XLT": [{ from: 2015, to: 2025, size: "265/70R17" }],
      "Lariat": [{ from: 2015, to: 2025, size: "275/65R18" }],
      "Platinum / King Ranch": [{ from: 2015, to: 2025, size: "275/55R20" }],
      "Raptor": [{ from: 2017, to: 2025, size: "315/70R17" }],
    },
    "F-250": {
      "XL / XLT": [{ from: 2017, to: 2025, size: "275/70R18" }],
      "Lariat / Platinum": [{ from: 2017, to: 2025, size: "275/65R20" }],
    },
    Ranger: {
      "XL / XLT": [{ from: 2019, to: 2025, size: "255/70R17" }],
      "Lariat / Raptor": [{ from: 2019, to: 2025, size: "285/70R17" }],
    },
    Maverick: {
      "XL / XLT": [{ from: 2022, to: 2025, size: "225/65R17" }],
      "Lariat / Tremor": [{ from: 2022, to: 2025, size: "235/60R18" }],
    },
    Mustang: {
      "EcoBoost": [{ from: 2015, to: 2025, size: "235/50R18" }],
      "GT": [{ from: 2015, to: 2025, size: "255/40R19", rear: "275/40R19" }],
      "Shelby GT500": [{ from: 2020, to: 2022, size: "305/30R20", rear: "315/30R20" }],
    },
    Escape: {
      "S / SE": [{ from: 2020, to: 2025, size: "225/65R17" }],
      "Titanium": [{ from: 2020, to: 2025, size: "225/55R19" }],
    },
    Edge: {
      "SE / SEL": [{ from: 2015, to: 2024, size: "245/60R18" }],
      "Titanium / ST": [{ from: 2019, to: 2024, size: "265/40R21" }],
    },
    Bronco: {
      "Big Bend / Outer Banks": [{ from: 2021, to: 2025, size: "255/70R18" }],
      "Badlands": [{ from: 2021, to: 2025, size: "285/70R17" }],
      "Wildtrak / Raptor": [{ from: 2021, to: 2025, size: "315/70R17" }],
    },
    "Bronco Sport": {
      "Big Bend / Outer Banks": [{ from: 2021, to: 2025, size: "225/65R17" }],
      "Badlands": [{ from: 2021, to: 2025, size: "235/65R17" }],
    },
    Explorer: {
      "Base / XLT": [{ from: 2020, to: 2025, size: "255/65R18" }],
      "Limited / Platinum": [{ from: 2020, to: 2025, size: "255/55R20" }],
      "ST": [{ from: 2020, to: 2025, size: "275/45R21" }],
    },
    Expedition: {
      "XL / XLT": [{ from: 2018, to: 2025, size: "265/70R18" }],
      "Limited / Platinum": [{ from: 2018, to: 2025, size: "285/45R22" }],
    },
  },
  Chevrolet: {
    "Silverado 1500": {
      "WT / Custom": [{ from: 2019, to: 2025, size: "265/70R17" }],
      "LT": [{ from: 2019, to: 2025, size: "275/60R20" }],
      "High Country": [{ from: 2019, to: 2025, size: "275/50R22" }],
      "ZR2 / Trail Boss": [{ from: 2019, to: 2025, size: "275/65R18" }],
    },
    Colorado: {
      "WT / LT": [{ from: 2023, to: 2025, size: "255/65R18" }],
      "Z71 / Trail Boss": [{ from: 2023, to: 2025, size: "265/65R18" }],
      "ZR2": [{ from: 2023, to: 2025, size: "285/70R17" }],
    },
    Malibu: {
      "L / LT": [{ from: 2016, to: 2025, size: "225/55R17" }],
      "RS / Premier": [{ from: 2016, to: 2025, size: "245/40R19" }],
    },
    Equinox: {
      "LS / LT": [{ from: 2018, to: 2025, size: "225/65R17" }],
      "RS / Premier": [{ from: 2018, to: 2025, size: "235/50R19" }],
    },
    Blazer: {
      "LT": [{ from: 2019, to: 2025, size: "235/65R18" }],
      "RS / Premier": [{ from: 2019, to: 2025, size: "265/45R21" }],
    },
    Traverse: {
      "LS / LT": [{ from: 2018, to: 2025, size: "255/65R18" }],
      "RS / High Country": [{ from: 2018, to: 2025, size: "255/55R20" }],
    },
    Tahoe: {
      "LS / LT": [{ from: 2021, to: 2025, size: "265/65R18" }],
      "Z71 / RST": [{ from: 2021, to: 2025, size: "275/60R20" }],
      "High Country": [{ from: 2021, to: 2025, size: "285/45R22" }],
    },
    Suburban: {
      "LS / LT": [{ from: 2021, to: 2025, size: "265/65R18" }],
      "Z71 / High Country": [{ from: 2021, to: 2025, size: "275/60R20" }],
    },
    Camaro: {
      "LT": [{ from: 2016, to: 2024, size: "245/50R18" }],
      "SS": [{ from: 2016, to: 2024, size: "245/40R20", rear: "275/35R20" }],
      "ZL1": [{ from: 2017, to: 2024, size: "285/30R20", rear: "305/30R20" }],
    },
    Corvette: {
      "Stingray": [{ from: 2020, to: 2025, size: "245/35R19", rear: "305/30R20" }],
      "Z06": [{ from: 2023, to: 2025, size: "275/30R20", rear: "345/25R21" }],
    },
  },
  GMC: {
    "Sierra 1500": {
      "Pro / SLE": [{ from: 2019, to: 2025, size: "265/70R17" }],
      "SLT": [{ from: 2019, to: 2025, size: "275/60R20" }],
      "AT4": [{ from: 2019, to: 2025, size: "275/65R18" }],
      "Denali": [{ from: 2019, to: 2025, size: "275/50R22" }],
    },
    Canyon: {
      "Elevation / AT4": [{ from: 2023, to: 2025, size: "255/65R18" }],
      "AT4X / Denali": [{ from: 2023, to: 2025, size: "275/70R18" }],
    },
    Terrain: {
      "SLE / SLT": [{ from: 2018, to: 2025, size: "225/65R17" }],
      "AT4 / Denali": [{ from: 2018, to: 2025, size: "235/55R19" }],
    },
    Acadia: {
      "SLE / SLT": [{ from: 2017, to: 2025, size: "235/65R18" }],
      "AT4 / Denali": [{ from: 2020, to: 2025, size: "235/55R20" }],
    },
    Yukon: {
      "SLE / SLT": [{ from: 2021, to: 2025, size: "265/65R18" }],
      "AT4": [{ from: 2021, to: 2025, size: "275/60R20" }],
      "Denali": [{ from: 2021, to: 2025, size: "275/50R22" }],
    },
  },
  Ram: {
    "1500": {
      "Tradesman": [{ from: 2019, to: 2025, size: "265/70R18" }],
      "Big Horn / Laramie": [{ from: 2019, to: 2025, size: "275/55R20" }],
      "Rebel": [{ from: 2019, to: 2025, size: "275/70R18" }],
      "Limited": [{ from: 2019, to: 2025, size: "285/45R22" }],
      "TRX": [{ from: 2021, to: 2024, size: "325/65R18" }],
    },
    "2500": {
      "Tradesman / Big Horn": [{ from: 2019, to: 2025, size: "275/70R18" }],
      "Laramie / Limited": [{ from: 2019, to: 2025, size: "285/60R20" }],
      "Power Wagon": [{ from: 2019, to: 2025, size: "285/70R17" }],
    },
  },
  Nissan: {
    Versa: {
      "S / SV": [{ from: 2020, to: 2025, size: "205/55R16" }],
      "SR": [{ from: 2020, to: 2025, size: "205/50R17" }],
    },
    Sentra: {
      "S / SV": [{ from: 2020, to: 2025, size: "205/55R16" }],
      "SR": [{ from: 2020, to: 2025, size: "215/45R18" }],
    },
    Altima: {
      "S / SV": [{ from: 2019, to: 2025, size: "215/60R16" }],
      "SR / SL": [{ from: 2019, to: 2025, size: "235/40R19" }],
    },
    Kicks: {
      "S / SV": [{ from: 2018, to: 2025, size: "205/60R16" }],
      "SR": [{ from: 2018, to: 2025, size: "205/55R17" }],
    },
    Rogue: {
      "S / SV": [{ from: 2021, to: 2025, size: "225/65R17" }],
      "SL / Platinum": [{ from: 2021, to: 2025, size: "235/55R19" }],
    },
    Murano: {
      "S / SV": [{ from: 2015, to: 2024, size: "235/65R18" }],
      "SL / Platinum": [{ from: 2015, to: 2024, size: "235/55R20" }],
    },
    Pathfinder: {
      "S / SV": [{ from: 2022, to: 2025, size: "235/65R18" }],
      "SL / Platinum": [{ from: 2022, to: 2025, size: "255/50R20" }],
    },
    Frontier: {
      "S / SV": [{ from: 2022, to: 2025, size: "265/70R17" }],
      "Pro-4X": [{ from: 2022, to: 2025, size: "265/70R17" }],
    },
    Z: {
      "Sport": [{ from: 2023, to: 2025, size: "245/40R19", rear: "275/35R19" }],
      "Performance": [{ from: 2023, to: 2025, size: "255/40R19", rear: "285/35R19" }],
    },
  },
  Jeep: {
    Renegade: {
      "Sport / Latitude": [{ from: 2015, to: 2023, size: "215/65R16" }],
      "Trailhawk / Limited": [{ from: 2015, to: 2023, size: "235/55R18" }],
    },
    Compass: {
      "Sport / Latitude": [{ from: 2017, to: 2025, size: "225/60R17" }],
      "Limited / Trailhawk": [{ from: 2017, to: 2025, size: "235/45R19" }],
    },
    Cherokee: {
      "Latitude / Limited": [{ from: 2014, to: 2023, size: "225/60R17" }],
      "Trailhawk": [{ from: 2014, to: 2023, size: "245/65R17" }],
    },
    "Grand Cherokee": {
      "Laredo": [{ from: 2021, to: 2025, size: "265/60R18" }],
      "Limited / Overland": [{ from: 2021, to: 2025, size: "265/50R20" }],
      "Trailhawk": [{ from: 2021, to: 2025, size: "265/60R18" }],
      "Summit": [{ from: 2021, to: 2025, size: "265/50R20" }],
    },
    "Grand Cherokee L": {
      "Laredo / Limited": [{ from: 2021, to: 2025, size: "265/60R18" }],
      "Overland / Summit": [{ from: 2021, to: 2025, size: "265/50R20" }],
    },
    Wrangler: {
      "Sport": [{ from: 2018, to: 2025, size: "245/75R17" }],
      "Sahara": [{ from: 2018, to: 2025, size: "255/70R18" }],
      "Rubicon": [{ from: 2018, to: 2025, size: "285/70R17" }],
    },
    Gladiator: {
      "Sport / Overland": [{ from: 2020, to: 2025, size: "245/75R17" }],
      "Rubicon / Mojave": [{ from: 2020, to: 2025, size: "285/70R17" }],
    },
    Wagoneer: {
      "Series II / III": [{ from: 2022, to: 2025, size: "275/60R20" }],
      "Carbide / Series III": [{ from: 2022, to: 2025, size: "285/45R22" }],
    },
  },
  Subaru: {
    Impreza: {
      "Base / Premium": [{ from: 2017, to: 2025, size: "205/55R16" }],
      "Sport / RS": [{ from: 2017, to: 2025, size: "225/40R18" }],
    },
    Legacy: {
      "Base / Premium": [{ from: 2020, to: 2025, size: "225/55R17" }],
      "Limited / Sport": [{ from: 2020, to: 2025, size: "225/50R18" }],
    },
    Crosstrek: {
      "Base / Premium": [{ from: 2018, to: 2025, size: "225/60R17" }],
      "Sport / Limited": [{ from: 2021, to: 2025, size: "225/55R18" }],
      "Wilderness": [{ from: 2024, to: 2025, size: "225/65R17" }],
    },
    Forester: {
      "Base / Premium": [{ from: 2019, to: 2025, size: "225/60R17" }],
      "Sport / Limited / Touring": [{ from: 2019, to: 2025, size: "225/55R18" }],
      "Wilderness": [{ from: 2022, to: 2025, size: "225/65R17" }],
    },
    Outback: {
      "Base / Premium": [{ from: 2020, to: 2025, size: "225/65R17" }],
      "Limited / Touring": [{ from: 2020, to: 2025, size: "225/60R18" }],
      "Wilderness": [{ from: 2022, to: 2025, size: "225/65R17" }],
    },
    Ascent: {
      "Base / Premium": [{ from: 2019, to: 2025, size: "245/60R18" }],
      "Limited / Touring": [{ from: 2019, to: 2025, size: "245/50R20" }],
    },
    WRX: {
      "Base / Premium": [{ from: 2015, to: 2025, size: "235/45R17" }],
      "Limited / GT": [{ from: 2022, to: 2025, size: "245/40R18" }],
      "STI": [{ from: 2015, to: 2021, size: "245/35R19" }],
    },
    BRZ: {
      "Premium / Limited": [{ from: 2022, to: 2025, size: "215/40R18" }],
    },
  },
  Hyundai: {
    Elantra: {
      "SE / SEL": [{ from: 2021, to: 2025, size: "205/55R16" }],
      "N Line": [{ from: 2021, to: 2025, size: "235/40R18" }],
      "N": [{ from: 2022, to: 2025, size: "245/35R19" }],
    },
    Sonata: {
      "SE / SEL": [{ from: 2020, to: 2025, size: "215/55R17" }],
      "Limited": [{ from: 2020, to: 2025, size: "235/45R18" }],
      "N Line": [{ from: 2021, to: 2025, size: "245/40R19" }],
    },
    Venue: {
      "SE / SEL": [{ from: 2020, to: 2025, size: "205/55R17" }],
    },
    Kona: {
      "SE / SEL": [{ from: 2018, to: 2025, size: "215/55R17" }],
      "N Line / Limited": [{ from: 2018, to: 2025, size: "235/45R18" }],
      "N": [{ from: 2022, to: 2023, size: "235/40R19" }],
    },
    Tucson: {
      "SE / SEL": [{ from: 2022, to: 2025, size: "235/65R17" }],
      "Limited": [{ from: 2022, to: 2025, size: "235/55R19" }],
    },
    "Santa Fe": {
      "SE / SEL": [{ from: 2019, to: 2025, size: "235/65R17" }],
      "Limited / Calligraphy": [{ from: 2019, to: 2025, size: "255/45R20" }],
    },
    "Santa Cruz": {
      "SE / SEL": [{ from: 2022, to: 2025, size: "245/50R20" }],
      "Limited": [{ from: 2022, to: 2025, size: "245/45R20" }],
    },
    Palisade: {
      "SE / SEL": [{ from: 2020, to: 2025, size: "245/60R18" }],
      "Limited / Calligraphy": [{ from: 2020, to: 2025, size: "245/50R20" }],
    },
    "Ioniq 5": {
      "SE / SEL": [{ from: 2022, to: 2025, size: "235/55R19" }],
      "Limited": [{ from: 2022, to: 2025, size: "255/45R20" }],
    },
  },
  Kia: {
    Forte: {
      "LX / GT-Line": [{ from: 2019, to: 2025, size: "205/55R16" }],
      "GT": [{ from: 2020, to: 2025, size: "225/40R18" }],
    },
    K5: {
      "LXS / GT-Line": [{ from: 2021, to: 2025, size: "215/55R17" }],
      "GT": [{ from: 2021, to: 2025, size: "245/40R19" }],
    },
    Soul: {
      "LX / S": [{ from: 2020, to: 2025, size: "205/60R16" }],
      "GT-Line / Turbo": [{ from: 2020, to: 2025, size: "235/45R18" }],
    },
    Seltos: {
      "LX / S": [{ from: 2021, to: 2025, size: "215/60R17" }],
      "SX / X-Line": [{ from: 2021, to: 2025, size: "235/55R18" }],
    },
    Niro: {
      "LX / EX": [{ from: 2018, to: 2025, size: "215/55R17" }],
      "SX Touring": [{ from: 2018, to: 2025, size: "225/45R18" }],
    },
    Sportage: {
      "LX / EX": [{ from: 2023, to: 2025, size: "235/65R17" }],
      "SX / X-Line": [{ from: 2023, to: 2025, size: "235/55R19" }],
    },
    Sorento: {
      "LX / S": [{ from: 2021, to: 2025, size: "235/65R17" }],
      "EX / SX": [{ from: 2021, to: 2025, size: "235/55R19" }],
    },
    Telluride: {
      "LX / S": [{ from: 2020, to: 2025, size: "245/60R18" }],
      "EX / SX": [{ from: 2020, to: 2025, size: "245/50R20" }],
    },
    Carnival: {
      "LX / EX": [{ from: 2022, to: 2025, size: "235/65R17" }],
      "SX / SX Prestige": [{ from: 2022, to: 2025, size: "235/55R19" }],
    },
    EV6: {
      "Light / Wind": [{ from: 2022, to: 2025, size: "235/55R19" }],
      "GT-Line / GT": [{ from: 2022, to: 2025, size: "255/45R20" }],
    },
    Stinger: {
      "GT-Line": [{ from: 2018, to: 2023, size: "225/45R18" }],
      "GT": [{ from: 2018, to: 2023, size: "225/40R19", rear: "255/35R19" }],
    },
  },
  Mazda: {
    "Mazda3": {
      "Base / Select": [{ from: 2019, to: 2025, size: "205/60R16" }],
      "Preferred / Turbo": [{ from: 2019, to: 2025, size: "215/45R18" }],
    },
    "Mazda6": {
      "Sport / Touring": [{ from: 2014, to: 2021, size: "225/55R17" }],
      "Grand Touring / Signature": [{ from: 2014, to: 2021, size: "225/45R19" }],
    },
    "CX-30": {
      "S / Select": [{ from: 2020, to: 2025, size: "215/55R18" }],
      "Premium / Turbo": [{ from: 2020, to: 2025, size: "215/55R18" }],
    },
    "CX-5": {
      "S / Select": [{ from: 2017, to: 2025, size: "225/65R17" }],
      "Premium / Turbo": [{ from: 2017, to: 2025, size: "225/55R19" }],
    },
    "CX-50": {
      "S / Select": [{ from: 2023, to: 2025, size: "235/65R17" }],
      "Premium / Turbo": [{ from: 2023, to: 2025, size: "245/45R20" }],
    },
    "CX-90": {
      "Select / Preferred": [{ from: 2024, to: 2025, size: "235/60R19" }],
      "Premium / Turbo S": [{ from: 2024, to: 2025, size: "275/45R21" }],
    },
    "MX-5 Miata": {
      "Sport": [{ from: 2016, to: 2025, size: "195/50R16" }],
      "Club / Grand Touring": [{ from: 2016, to: 2025, size: "205/45R17" }],
    },
  },
  Volkswagen: {
    Jetta: {
      "S / SE": [{ from: 2019, to: 2025, size: "205/60R16" }],
      "SEL": [{ from: 2019, to: 2025, size: "225/45R17" }],
      "GLI": [{ from: 2019, to: 2025, size: "225/40R18" }],
    },
    "Golf GTI": {
      "S / SE": [{ from: 2015, to: 2025, size: "225/45R18" }],
      "Autobahn / R": [{ from: 2015, to: 2025, size: "235/35R19" }],
    },
    Passat: {
      "S / SE": [{ from: 2016, to: 2022, size: "215/60R16" }],
      "R-Line / SEL": [{ from: 2016, to: 2022, size: "235/45R18" }],
    },
    Taos: {
      "S / SE": [{ from: 2022, to: 2025, size: "215/65R17" }],
      "SEL": [{ from: 2022, to: 2025, size: "225/45R19" }],
    },
    Tiguan: {
      "S / SE": [{ from: 2018, to: 2025, size: "235/55R18" }],
      "SEL / R-Line": [{ from: 2018, to: 2025, size: "235/50R19" }],
    },
    Atlas: {
      "S / SE": [{ from: 2018, to: 2025, size: "245/60R18" }],
      "SEL / R-Line": [{ from: 2018, to: 2025, size: "255/50R20" }],
    },
    "ID.4": {
      "Standard / Pro": [{ from: 2021, to: 2025, size: "235/55R19" }],
      "Pro S / AWD": [{ from: 2021, to: 2025, size: "235/50R20" }],
    },
  },
  Audi: {
    A3: {
      "Premium": [{ from: 2015, to: 2025, size: "225/45R17" }],
      "Premium Plus / Prestige": [{ from: 2015, to: 2025, size: "225/40R18" }],
      "S3": [{ from: 2015, to: 2025, size: "235/35R19" }],
    },
    A4: {
      "Premium": [{ from: 2017, to: 2025, size: "225/50R17" }],
      "Premium Plus / Prestige": [{ from: 2017, to: 2025, size: "245/40R18" }],
      "S4": [{ from: 2018, to: 2025, size: "245/35R19" }],
    },
    A5: {
      "Premium": [{ from: 2018, to: 2025, size: "245/40R18" }],
      "Premium Plus / S5": [{ from: 2018, to: 2025, size: "245/35R19" }],
    },
    A6: {
      "Premium": [{ from: 2019, to: 2025, size: "225/55R18" }],
      "Premium Plus / Prestige": [{ from: 2019, to: 2025, size: "245/45R19" }],
      "S6": [{ from: 2020, to: 2025, size: "255/40R20" }],
    },
    Q3: {
      "Premium": [{ from: 2019, to: 2025, size: "235/55R18" }],
      "Premium Plus / S line": [{ from: 2019, to: 2025, size: "255/40R20" }],
    },
    Q5: {
      "Premium": [{ from: 2018, to: 2025, size: "235/60R18" }],
      "Premium Plus / Prestige": [{ from: 2018, to: 2025, size: "255/45R20" }],
      "SQ5": [{ from: 2018, to: 2025, size: "255/40R21" }],
    },
    Q7: {
      "Premium": [{ from: 2017, to: 2025, size: "255/55R19" }],
      "Prestige / SQ7": [{ from: 2017, to: 2025, size: "285/40R21" }],
    },
    Q8: {
      "Premium": [{ from: 2019, to: 2025, size: "285/45R20" }],
      "Prestige / SQ8": [{ from: 2019, to: 2025, size: "285/40R21" }],
    },
  },
  BMW: {
    "2 Series": {
      "230i": [{ from: 2022, to: 2025, size: "225/45R18" }],
      "M240i": [{ from: 2022, to: 2025, size: "245/35R19", rear: "255/35R19" }],
      "M2": [{ from: 2023, to: 2025, size: "275/35R19", rear: "285/30R20" }],
    },
    "3 Series": {
      "330i": [{ from: 2019, to: 2025, size: "225/45R18" }, { from: 2012, to: 2018, size: "225/45R17" }],
      "M340i": [{ from: 2020, to: 2025, size: "225/40R19", rear: "255/35R19" }],
      "M3": [{ from: 2021, to: 2025, size: "275/35R19", rear: "285/30R20" }],
    },
    "4 Series": {
      "430i": [{ from: 2021, to: 2025, size: "225/45R18" }],
      "M440i": [{ from: 2021, to: 2025, size: "225/40R19", rear: "255/35R19" }],
      "M4": [{ from: 2021, to: 2025, size: "275/35R19", rear: "285/30R20" }],
    },
    "5 Series": {
      "530i": [{ from: 2017, to: 2025, size: "245/45R18" }],
      "540i": [{ from: 2017, to: 2025, size: "245/40R19" }],
      "M550i": [{ from: 2018, to: 2025, size: "245/40R19", rear: "275/35R19" }],
      "M5": [{ from: 2018, to: 2025, size: "275/35R20", rear: "285/35R20" }],
    },
    "7 Series": {
      "740i": [{ from: 2016, to: 2025, size: "245/45R19" }],
      "760i / i7": [{ from: 2023, to: 2025, size: "255/45R20" }],
    },
    X1: {
      "sDrive28i / xDrive28i": [{ from: 2016, to: 2025, size: "225/55R18" }],
      "M35i": [{ from: 2023, to: 2025, size: "245/45R19" }],
    },
    X3: {
      "xDrive30i": [{ from: 2018, to: 2025, size: "245/50R19" }],
      "M40i": [{ from: 2019, to: 2025, size: "245/45R20" }],
      "X3 M": [{ from: 2020, to: 2025, size: "255/40R21", rear: "265/45R21" }],
    },
    X5: {
      "xDrive40i": [{ from: 2019, to: 2025, size: "265/50R19" }],
      "xDrive50e / M50i": [{ from: 2020, to: 2025, size: "275/45R20" }],
      "X5 M": [{ from: 2020, to: 2025, size: "295/35R21", rear: "315/35R21" }],
    },
    X7: {
      "xDrive40i": [{ from: 2019, to: 2025, size: "275/45R21" }],
      "M60i": [{ from: 2023, to: 2025, size: "285/45R22" }],
    },
  },
  "Mercedes-Benz": {
    "A-Class": {
      "A220": [{ from: 2019, to: 2025, size: "205/55R17" }],
      "AMG A35": [{ from: 2020, to: 2025, size: "225/45R18" }],
    },
    "C-Class": {
      "C300": [{ from: 2015, to: 2025, size: "225/45R18" }],
      "AMG C43": [{ from: 2017, to: 2025, size: "225/40R19", rear: "255/35R19" }],
      "AMG C63": [{ from: 2017, to: 2025, size: "245/35R19", rear: "265/35R19" }],
    },
    "E-Class": {
      "E350": [{ from: 2017, to: 2025, size: "245/45R18" }],
      "E450": [{ from: 2017, to: 2025, size: "245/40R19" }],
      "AMG E53 / E63": [{ from: 2019, to: 2025, size: "265/35R20", rear: "295/30R20" }],
    },
    "S-Class": {
      "S500 / S580": [{ from: 2021, to: 2025, size: "255/45R19" }],
      "Maybach / AMG": [{ from: 2021, to: 2025, size: "255/40R20" }],
    },
    GLA: {
      "GLA250": [{ from: 2021, to: 2025, size: "235/50R19" }],
      "AMG GLA35": [{ from: 2021, to: 2025, size: "235/45R20" }],
    },
    GLC: {
      "GLC300": [{ from: 2016, to: 2025, size: "235/60R18" }],
      "AMG GLC43": [{ from: 2017, to: 2025, size: "255/45R20" }],
    },
    GLE: {
      "GLE350 / GLE450": [{ from: 2020, to: 2025, size: "255/55R19" }],
      "AMG GLE53 / GLE63": [{ from: 2020, to: 2025, size: "275/50R20", rear: "315/40R21" }],
    },
    GLS: {
      "GLS450 / GLS580": [{ from: 2020, to: 2025, size: "275/50R20" }],
      "AMG GLS63": [{ from: 2021, to: 2025, size: "275/45R21" }],
    },
  },
  Lexus: {
    UX: {
      "250h": [{ from: 2019, to: 2025, size: "225/50R18" }],
      "F Sport": [{ from: 2019, to: 2025, size: "225/50R18" }],
    },
    IS: {
      "300 / 350": [{ from: 2021, to: 2025, size: "225/45R17" }],
      "350 F Sport": [{ from: 2021, to: 2025, size: "235/40R19", rear: "265/35R19" }],
    },
    ES: {
      "350": [{ from: 2019, to: 2025, size: "215/55R17" }],
      "350 F Sport": [{ from: 2019, to: 2025, size: "235/40R19" }],
    },
    RC: {
      "300 / 350": [{ from: 2015, to: 2025, size: "235/45R18" }],
      "F": [{ from: 2015, to: 2025, size: "255/35R19", rear: "275/35R19" }],
    },
    NX: {
      "250 / 350": [{ from: 2022, to: 2025, size: "235/60R18" }],
      "350 F Sport": [{ from: 2022, to: 2025, size: "235/50R20" }],
    },
    RX: {
      "350": [{ from: 2016, to: 2025, size: "235/65R18" }],
      "350 F Sport": [{ from: 2016, to: 2025, size: "235/55R20" }],
    },
    GX: {
      "Premium / Luxury": [{ from: 2010, to: 2025, size: "265/60R18" }],
      "Overtrail": [{ from: 2024, to: 2025, size: "265/70R18" }],
    },
    LX: {
      "600 / Premium": [{ from: 2022, to: 2025, size: "265/60R18" }],
      "F Sport / Ultra Luxury": [{ from: 2022, to: 2025, size: "265/55R20" }],
    },
  },
  Acura: {
    Integra: {
      "Base / A-Spec": [{ from: 2023, to: 2025, size: "235/40R18" }],
      "Type S": [{ from: 2024, to: 2025, size: "265/30R19" }],
    },
    TLX: {
      "Base / Technology": [{ from: 2021, to: 2025, size: "225/50R18" }],
      "A-Spec": [{ from: 2021, to: 2025, size: "255/40R19" }],
      "Type S": [{ from: 2021, to: 2025, size: "255/35R20" }],
    },
    RDX: {
      "Base / Technology": [{ from: 2019, to: 2025, size: "235/60R18" }],
      "A-Spec / Advance": [{ from: 2019, to: 2025, size: "255/45R20" }],
    },
    MDX: {
      "Base / Technology": [{ from: 2022, to: 2025, size: "255/55R19" }],
      "A-Spec / Advance": [{ from: 2022, to: 2025, size: "275/45R20" }],
      "Type S": [{ from: 2022, to: 2025, size: "275/40R21" }],
    },
  },
  Tesla: {
    "Model 3": {
      "RWD / Long Range": [{ from: 2017, to: 2025, size: "235/45R18" }],
      "Performance": [{ from: 2018, to: 2025, size: "235/35R20" }],
    },
    "Model Y": {
      "RWD / Long Range": [{ from: 2020, to: 2025, size: "255/45R19" }],
      "Performance": [{ from: 2020, to: 2025, size: "255/35R21" }],
    },
    "Model S": {
      "Dual Motor": [{ from: 2016, to: 2025, size: "245/45R19" }],
      "Plaid": [{ from: 2021, to: 2025, size: "265/35R21" }],
    },
    "Model X": {
      "Dual Motor": [{ from: 2016, to: 2025, size: "255/45R20" }],
      "Plaid": [{ from: 2021, to: 2025, size: "285/35R22" }],
    },
    Cybertruck: {
      "All-Wheel Drive / Cyberbeast": [{ from: 2024, to: 2025, size: "285/65R20" }],
    },
  },
  Dodge: {
    Hornet: {
      "GT / R/T": [{ from: 2023, to: 2025, size: "235/45R20" }],
    },
    Charger: {
      "SXT / GT": [{ from: 2015, to: 2023, size: "235/55R18" }],
      "R/T": [{ from: 2015, to: 2023, size: "245/45R20" }],
      "Scat Pack / Hellcat": [{ from: 2015, to: 2023, size: "275/40R20" }],
    },
    Challenger: {
      "SXT / GT": [{ from: 2015, to: 2023, size: "235/55R18" }],
      "R/T": [{ from: 2015, to: 2023, size: "245/45R20" }],
      "Scat Pack / Hellcat": [{ from: 2015, to: 2023, size: "275/40R20" }],
    },
    Durango: {
      "SXT / GT": [{ from: 2014, to: 2025, size: "265/60R18" }],
      "R/T / Citadel": [{ from: 2014, to: 2025, size: "265/50R20" }],
      "SRT": [{ from: 2018, to: 2025, size: "295/45R20" }],
    },
  },
  Porsche: {
    "718 Cayman / Boxster": {
      "Base / S": [{ from: 2017, to: 2025, size: "235/40R19", rear: "265/40R19" }],
      "GTS / GT4": [{ from: 2020, to: 2025, size: "245/35R20", rear: "295/30R20" }],
    },
    "911": {
      "Carrera": [{ from: 2016, to: 2025, size: "245/35R20", rear: "305/30R21" }],
      "Turbo / Turbo S": [{ from: 2016, to: 2025, size: "255/35R20", rear: "315/30R21" }],
    },
    Macan: {
      "Base / T": [{ from: 2019, to: 2025, size: "235/60R18" }],
      "S / GTS": [{ from: 2019, to: 2025, size: "265/45R20" }],
    },
    Cayenne: {
      "Base": [{ from: 2019, to: 2025, size: "255/55R19" }],
      "S / GTS / Turbo": [{ from: 2019, to: 2025, size: "285/45R21", rear: "315/35R21" }],
    },
    Panamera: {
      "Base / 4": [{ from: 2017, to: 2025, size: "265/45R20", rear: "295/40R20" }],
      "GTS / Turbo": [{ from: 2017, to: 2025, size: "275/35R21", rear: "315/30R21" }],
    },
    Taycan: {
      "Base / 4S": [{ from: 2020, to: 2025, size: "245/45R20", rear: "285/40R20" }],
      "Turbo / Turbo S": [{ from: 2020, to: 2025, size: "265/35R21", rear: "305/30R21" }],
    },
  },
  Cadillac: {
    CT4: {
      "Luxury / Premium": [{ from: 2020, to: 2025, size: "225/45R17" }],
      "V-Series": [{ from: 2020, to: 2025, size: "235/40R18" }],
      "CT4-V Blackwing": [{ from: 2022, to: 2025, size: "255/35R18", rear: "275/35R19" }],
    },
    CT5: {
      "Luxury": [{ from: 2020, to: 2025, size: "245/45R18" }],
      "Premium / Sport": [{ from: 2020, to: 2025, size: "245/40R19" }],
      "CT5-V Blackwing": [{ from: 2022, to: 2025, size: "275/35R19", rear: "305/30R19" }],
    },
    XT4: {
      "Luxury / Premium": [{ from: 2019, to: 2025, size: "235/55R18" }],
      "Sport": [{ from: 2019, to: 2025, size: "235/50R20" }],
    },
    XT5: {
      "Luxury": [{ from: 2017, to: 2025, size: "235/65R18" }],
      "Premium / Sport": [{ from: 2017, to: 2025, size: "235/55R20" }],
    },
    XT6: {
      "Luxury / Premium": [{ from: 2020, to: 2025, size: "235/60R19" }],
      "Sport": [{ from: 2020, to: 2025, size: "265/45R21" }],
    },
    Escalade: {
      "Luxury / Premium": [{ from: 2021, to: 2025, size: "275/60R20" }],
      "Sport / Platinum": [{ from: 2021, to: 2025, size: "285/45R22" }],
    },
  },
  Volvo: {
    S60: {
      "Core / Plus": [{ from: 2019, to: 2025, size: "235/45R18" }],
      "Ultimate / Polestar": [{ from: 2019, to: 2025, size: "235/40R19" }],
    },
    S90: {
      "Core / Plus": [{ from: 2017, to: 2025, size: "245/45R18" }],
      "Ultimate": [{ from: 2017, to: 2025, size: "255/35R20" }],
    },
    XC40: {
      "Core / Plus": [{ from: 2019, to: 2025, size: "235/55R18" }],
      "Ultimate / R-Design": [{ from: 2019, to: 2025, size: "235/50R19" }],
    },
    XC60: {
      "Core / Plus": [{ from: 2018, to: 2025, size: "235/60R18" }],
      "Ultimate / R-Design": [{ from: 2018, to: 2025, size: "255/45R20" }],
    },
    XC90: {
      "Core / Plus": [{ from: 2016, to: 2025, size: "235/60R18" }],
      "Ultimate / R-Design": [{ from: 2016, to: 2025, size: "275/45R20" }],
    },
    C40: {
      "Core / Plus": [{ from: 2022, to: 2025, size: "235/50R19" }],
      "Ultimate": [{ from: 2022, to: 2025, size: "235/45R20" }],
    },
  },
};

export const MAKES = Object.keys(FITMENT);

export function modelsFor(make) {
  return FITMENT[make] ? Object.keys(FITMENT[make]) : [];
}

export function trimsFor(make, model) {
  return FITMENT[make]?.[model] ? Object.keys(FITMENT[make][model]) : [];
}

export function yearsFor(make, model, trim) {
  const gens = FITMENT[make]?.[model]?.[trim];
  if (!gens) return [];
  const min = Math.min(...gens.map((g) => g.from));
  const max = Math.max(...gens.map((g) => g.to));
  const out = [];
  for (let y = max; y >= min; y--) out.push(y);
  return out;
}

// Find the generation entry for a given year (falls back to the first entry).
function genFor(make, model, trim, year) {
  const gens = FITMENT[make]?.[model]?.[trim];
  if (!gens) return null;
  const y = Number(year);
  return gens.find((g) => y >= g.from && y <= g.to) || gens[0] || null;
}

// Full fitment for the picker: { front, rear, staggered }.
export function fitmentFor(make, model, trim, year) {
  const gen = genFor(make, model, trim, year);
  if (!gen) return null;
  const front = gen.size;
  const rear = gen.rear || gen.size;
  return { front, rear, staggered: !!gen.rear && gen.rear !== gen.size };
}

// Primary (front) size — kept for callers that just want one value.
export function sizeFor(make, model, trim, year) {
  return genFor(make, model, trim, year)?.size || null;
}
