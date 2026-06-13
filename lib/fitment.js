// Curated vehicle → factory tire-size lookup for the most popular models.
// Sizes are common OE fitments; many trims have options, so this gives the
// typical size to search by. Expand over time or back with a fitment API.
//
// Shape: { Make: { Model: [ { from, to, size } ... ] } }

export const FITMENT = {
  Toyota: {
    Camry: [{ from: 2018, to: 2025, size: "215/55R17" }, { from: 2012, to: 2017, size: "205/65R16" }],
    Corolla: [{ from: 2020, to: 2025, size: "205/55R16" }, { from: 2014, to: 2019, size: "195/65R15" }],
    RAV4: [{ from: 2019, to: 2025, size: "225/65R17" }, { from: 2013, to: 2018, size: "225/65R17" }],
    Tacoma: [{ from: 2016, to: 2025, size: "265/70R16" }],
    Highlander: [{ from: 2020, to: 2025, size: "235/65R18" }],
  },
  Honda: {
    Civic: [{ from: 2016, to: 2025, size: "215/55R16" }, { from: 2012, to: 2015, size: "195/65R15" }],
    Accord: [{ from: 2018, to: 2025, size: "225/50R17" }, { from: 2013, to: 2017, size: "215/55R17" }],
    "CR-V": [{ from: 2017, to: 2025, size: "235/65R17" }, { from: 2012, to: 2016, size: "225/65R17" }],
    Pilot: [{ from: 2016, to: 2025, size: "245/60R18" }],
  },
  Ford: {
    "F-150": [{ from: 2015, to: 2025, size: "265/70R17" }],
    Escape: [{ from: 2020, to: 2025, size: "225/65R17" }, { from: 2013, to: 2019, size: "235/55R17" }],
    Explorer: [{ from: 2020, to: 2025, size: "255/65R18" }, { from: 2011, to: 2019, size: "245/60R18" }],
    Mustang: [{ from: 2015, to: 2025, size: "235/55R17" }],
  },
  Chevrolet: {
    Silverado: [{ from: 2014, to: 2025, size: "265/70R17" }],
    Equinox: [{ from: 2018, to: 2025, size: "225/65R17" }],
    Malibu: [{ from: 2016, to: 2025, size: "225/55R17" }],
    Tahoe: [{ from: 2015, to: 2025, size: "265/65R18" }],
  },
  Nissan: {
    Altima: [{ from: 2019, to: 2025, size: "215/55R17" }, { from: 2013, to: 2018, size: "215/60R16" }],
    Rogue: [{ from: 2014, to: 2025, size: "225/65R17" }],
    Sentra: [{ from: 2020, to: 2025, size: "205/55R16" }],
  },
  Jeep: {
    "Grand Cherokee": [{ from: 2011, to: 2025, size: "265/60R18" }],
    Wrangler: [{ from: 2018, to: 2025, size: "245/75R17" }],
    Cherokee: [{ from: 2014, to: 2023, size: "225/60R17" }],
  },
  Subaru: {
    Outback: [{ from: 2020, to: 2025, size: "225/65R17" }, { from: 2015, to: 2019, size: "225/65R17" }],
    Forester: [{ from: 2019, to: 2025, size: "225/60R17" }],
    Impreza: [{ from: 2017, to: 2025, size: "205/50R17" }],
  },
  BMW: {
    "3 Series": [{ from: 2019, to: 2025, size: "225/45R18" }, { from: 2012, to: 2018, size: "225/45R17" }],
    "5 Series": [{ from: 2017, to: 2025, size: "245/45R18" }],
    X5: [{ from: 2019, to: 2025, size: "265/50R19" }],
  },
  "Mercedes-Benz": {
    "C-Class": [{ from: 2015, to: 2025, size: "225/45R18" }],
    "E-Class": [{ from: 2017, to: 2025, size: "245/45R18" }],
    GLC: [{ from: 2016, to: 2025, size: "235/60R18" }],
  },
  Tesla: {
    "Model 3": [{ from: 2017, to: 2025, size: "235/45R18" }],
    "Model Y": [{ from: 2020, to: 2025, size: "255/45R19" }],
  },
  Hyundai: {
    Elantra: [{ from: 2021, to: 2025, size: "205/55R16" }, { from: 2017, to: 2020, size: "205/55R16" }],
    Tucson: [{ from: 2022, to: 2025, size: "235/60R18" }],
    Santa: [{ from: 2019, to: 2025, size: "235/60R18" }],
  },
  Ram: {
    "1500": [{ from: 2019, to: 2025, size: "275/65R18" }, { from: 2012, to: 2018, size: "265/70R17" }],
  },
  GMC: {
    Sierra: [{ from: 2014, to: 2025, size: "265/70R17" }],
    Acadia: [{ from: 2017, to: 2025, size: "235/65R18" }],
  },
};

export const MAKES = Object.keys(FITMENT);

export function modelsFor(make) {
  return FITMENT[make] ? Object.keys(FITMENT[make]) : [];
}

export function yearsFor(make, model) {
  const gens = FITMENT[make]?.[model];
  if (!gens) return [];
  const min = Math.min(...gens.map((g) => g.from));
  const max = Math.max(...gens.map((g) => g.to));
  const out = [];
  for (let y = max; y >= min; y--) out.push(y);
  return out;
}

export function sizeFor(make, model, year) {
  const gens = FITMENT[make]?.[model];
  if (!gens) return null;
  const y = Number(year);
  const gen = gens.find((g) => y >= g.from && y <= g.to) || gens[0];
  return gen ? gen.size : null;
}
