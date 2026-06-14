import { isStateAbbr } from "@/lib/states";

// Build a Prisma `where.AND` array from a plain params object (the browse
// filters). Shared by the browse page and saved-search match counting.
// Note: radius/geo filtering is applied separately in JS, not here.
export function buildListingWhere(p = {}) {
  const AND = [{ status: "active" }];
  if (p.state && isStateAbbr(p.state)) AND.push({ state: String(p.state).toUpperCase() });
  if (p.brand) AND.push({ brand: p.brand });
  if (p.condition) AND.push({ condition: p.condition });
  if (p.size) AND.push({ size: { contains: p.size } });
  if (p.season) AND.push({ season: p.season });
  if (p.runFlat === "1" || p.runFlat === true) AND.push({ runFlat: true });
  if (p.maxPrice) AND.push({ priceCents: { lte: Math.round(Number(p.maxPrice) * 100) } });
  if (p.minYear) AND.push({ dotYear: { gte: Number(p.minYear) } });
  if (p.qty) AND.push({ quantity: { gte: Number(p.qty) } });
  if (p.shipping === "1" || p.shipping === true) AND.push({ shipping: true });
  if (p.q) {
    AND.push({
      OR: [
        { brand: { contains: p.q } },
        { size: { contains: p.q } },
        { location: { contains: p.q } },
        { description: { contains: p.q } },
      ],
    });
  }
  return AND;
}

// Human label for a saved search, e.g. "Winter · 225/45R17 · Texas".
export function describeSearch(p = {}, stateName) {
  const parts = [];
  if (p.q) parts.push(`"${p.q}"`);
  if (p.brand) parts.push(p.brand);
  if (p.size) parts.push(p.size);
  if (p.season) parts.push(p.season);
  if (p.condition) parts.push(p.condition === "new" ? "New" : "Used");
  if (p.runFlat === "1") parts.push("Run-flat");
  if (p.minYear) parts.push(`${p.minYear}+ DOT`);
  if (p.qty) parts.push(`${p.qty}+ tires`);
  if (p.shipping === "1") parts.push("Ships");
  if (p.minRating) parts.push(`★ ${p.minRating}+`);
  if (p.maxPrice) parts.push(`under $${p.maxPrice}`);
  if (p.state && stateName) parts.push(stateName(p.state));
  return parts.length ? parts.join(" · ") : "All tires";
}
