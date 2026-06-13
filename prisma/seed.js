/* Seed realistic demo data: accounts, listings, photos, and a sample chat. */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Generate a self-contained, studio-style SVG "tire photo" so the app needs no
// external images. Head-on alloy wheel on a soft spotlight backdrop, with the
// brand on the sidewall and a contact-shadow under the tire.
function makePhoto(brand, size, condition, idx) {
  const palettes = [
    ["#1f2937", "#0b1220"], // slate
    ["#1e293b", "#0a0f1a"], // navy slate
    ["#26211c", "#100b07"], // warm graphite
    ["#1b2530", "#080d13"], // steel
  ];
  const [c1, c2] = palettes[Math.abs(hashCode(brand + size)) % palettes.length];
  const spokes = 5 + (Math.abs(hashCode(size)) % 3); // 5..7 spokes
  const uid = `g${idx}`;

  const spokeShapes = Array.from({ length: spokes }).map((_, i) => {
    const a = (i / spokes) * 360;
    return `<g transform="rotate(${a})"><path d="M -16 -52 Q 0 -118 16 -52 L 22 -120 Q 0 -132 -22 -120 Z" fill="url(#${uid}spoke)" stroke="#0b0e14" stroke-width="2"/></g>`;
  }).join("");

  const treadBlocks = Array.from({ length: 60 }).map((_, i) => {
    const a = (i / 60) * Math.PI * 2;
    const x = Math.cos(a) * 192, y = Math.sin(a) * 192;
    return `<rect x="${(x - 7).toFixed(1)}" y="${(y - 11).toFixed(1)}" width="14" height="22" rx="2" transform="rotate(${(a * 180 / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#05070b"/>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <radialGradient id="${uid}bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </radialGradient>
    <radialGradient id="${uid}rim" cx="42%" cy="36%" r="70%">
      <stop offset="0" stop-color="#e8edf5"/>
      <stop offset="0.55" stop-color="#aab4c4"/>
      <stop offset="1" stop-color="#5b6675"/>
    </radialGradient>
    <linearGradient id="${uid}spoke" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dfe5ee"/>
      <stop offset="1" stop-color="#8b95a6"/>
    </linearGradient>
    <radialGradient id="${uid}rubber" cx="50%" cy="42%" r="60%">
      <stop offset="0" stop-color="#23262d"/>
      <stop offset="1" stop-color="#0a0c10"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#${uid}bg)"/>
  <ellipse cx="400" cy="520" rx="220" ry="34" fill="#000" opacity="0.45"/>
  <g transform="translate(400,290)">
    <circle r="232" fill="url(#${uid}rubber)"/>
    ${treadBlocks}
    <circle r="205" fill="#0c0e12"/>
    <circle r="205" fill="none" stroke="#000" stroke-width="2"/>
    <text font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#e5e7eb" letter-spacing="3" opacity="0.85">
      <textPath href="#${uid}arc" startOffset="50%" text-anchor="middle">${brand.toUpperCase()} · ${size}</textPath>
    </text>
    <path id="${uid}arc" d="M -176 0 A 176 176 0 0 1 176 0" fill="none"/>
    <circle r="150" fill="#11141a"/>
    <circle r="150" fill="none" stroke="#2a2f3a" stroke-width="3"/>
    <circle r="138" fill="url(#${uid}rim)"/>
    ${spokeShapes}
    <circle r="44" fill="#1a1e26"/>
    <circle r="44" fill="none" stroke="#3a4150" stroke-width="3"/>
    <circle r="14" fill="#0b0e14"/>
    ${Array.from({ length: 5 }).map((_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return `<circle cx="${(Math.cos(a) * 27).toFixed(1)}" cy="${(Math.sin(a) * 27).toFixed(1)}" r="5" fill="#2a2f3a"/>`;
    }).join("")}
    <ellipse cx="-60" cy="-70" rx="120" ry="60" fill="#fff" opacity="0.06"/>
  </g>
</svg>`;
  const fname = `seed-${slug(brand)}-${slug(size)}-${idx}.svg`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fname), svg);
  return `/uploads/${fname}`;
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  console.log("Clearing existing data…");
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // Remove old seed images
  for (const f of fs.readdirSync(UPLOAD_DIR)) {
    if (f.startsWith("seed-")) fs.unlinkSync(path.join(UPLOAD_DIR, f));
  }

  const pw = (p) => bcrypt.hashSync(p, 10);
  // Every seller is in their free first year (no charge until this date).
  const freeUntil = new Date(Date.now() + 365 * 864e5);

  console.log("Creating users…");
  const demo = await prisma.user.create({
    data: {
      email: "demo@tiretrader.test",
      passwordHash: pw("demo1234"),
      name: "Demo Seller",
      location: "Dallas, TX",
      role: "seller",
      sellerFreeUntil: freeUntil,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@tiretrader.test",
      passwordHash: pw("buyer1234"),
      name: "Sam Buyer",
      location: "Fort Worth, TX",
      role: "buyer",
    },
  });

  const sellerData = [
    { email: "mike@tiretrader.test", name: "Mike's Tire Co", location: "Houston, TX" },
    { email: "rosa@tiretrader.test", name: "Rosa Wheels", location: "Phoenix, AZ" },
    { email: "ken@tiretrader.test", name: "Ken Auto", location: "Atlanta, GA" },
  ];
  const sellers = [demo];
  for (const s of sellerData) {
    sellers.push(
      await prisma.user.create({
        data: {
          email: s.email,
          passwordHash: pw("seller1234"),
          name: s.name,
          location: s.location,
          role: "seller",
          sellerFreeUntil: freeUntil,
        },
      })
    );
  }

  console.log("Creating listings…");
  // Spread locations across many states so the state map looks alive.
  const catalog = [
    { brand: "Michelin", model: "Pilot Sport 4S", size: "245/40R18", cond: "new", tread: "10/32in", qty: 4, price: 920, loc: "Dallas, TX", desc: "Brand new set of 4, never mounted. Summer performance." },
    { brand: "Goodyear", model: "Eagle F1", size: "225/45R17", cond: "used", tread: "7/32in", qty: 4, price: 340, loc: "Los Angeles, CA", desc: "One season on these. Even wear, no patches or plugs." },
    { brand: "Bridgestone", model: "Blizzak WS90", size: "205/55R16", cond: "used", tread: "8/32in", qty: 4, price: 280, loc: "Chicago, IL", desc: "Winter tires, two seasons. Stored indoors." },
    { brand: "BFGoodrich", model: "All-Terrain T/A KO2", size: "265/70R17", cond: "new", tread: "15/32in", qty: 5, price: 1150, loc: "Phoenix, AZ", desc: "Full set of 5 including spare. Truck/SUV all-terrain." },
    { brand: "Continental", model: "ExtremeContact DWS06", size: "245/45R18", cond: "used", tread: "6/32in", qty: 2, price: 160, loc: "Atlanta, GA", desc: "Pair of 2 fronts. Good rubber left." },
    { brand: "Pirelli", model: "P Zero", size: "275/35R19", cond: "used", tread: "5/32in", qty: 4, price: 420, loc: "Houston, TX", desc: "Staggered rear pair available too. DM me." },
    { brand: "Cooper", model: "Discoverer AT3", size: "265/65R18", cond: "new", tread: "14/32in", qty: 4, price: 760, loc: "Denver, CO", desc: "New takeoffs from a new truck, 20 miles." },
    { brand: "Hankook", model: "Kinergy GT", size: "215/60R16", cond: "used", tread: "9/32in", qty: 4, price: 220, loc: "Miami, FL", desc: "Plenty of tread, all-season touring." },
    { brand: "Falken", model: "Wildpeak A/T3W", size: "285/70R17", cond: "new", tread: "16/32in", qty: 4, price: 980, loc: "Seattle, WA", desc: "Aggressive all-terrain, brand new." },
    { brand: "Toyo", model: "Proxes Sport", size: "255/40R19", cond: "used", tread: "6/32in", qty: 4, price: 380, loc: "New York, NY", desc: "Sticky summer set, lots of grip remaining." },
    { brand: "Yokohama", model: "AVID Ascend GT", size: "225/65R17", cond: "new", tread: "11/32in", qty: 4, price: 540, loc: "Phoenix, AZ", desc: "New set, all-season SUV." },
    { brand: "Firestone", model: "WeatherGrip", size: "235/55R17", cond: "used", tread: "7/32in", qty: 4, price: 260, loc: "Charlotte, NC", desc: "Great all-weather set. Smooth and quiet." },
    { brand: "Michelin", model: "Defender T+H", size: "215/55R17", cond: "used", tread: "8/32in", qty: 4, price: 300, loc: "Dallas, TX", desc: "Long-life touring tires, low miles." },
    { brand: "Goodyear", model: "Wrangler DuraTrac", size: "275/55R20", cond: "new", tread: "17/32in", qty: 4, price: 1240, loc: "Nashville, TN", desc: "Heavy duty, brand new set for full-size trucks." },
  ];
  const stateOf = (loc) => (loc.split(",").pop() || "").trim().toUpperCase();

  const listings = [];
  for (let i = 0; i < catalog.length; i++) {
    const c = catalog[i];
    const seller = sellers[i % sellers.length];
    const ageDays = Math.floor((i * 37) % 60);
    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        brand: c.brand,
        size: c.size,
        quantity: c.qty,
        condition: c.cond,
        treadDepth: c.tread,
        priceCents: c.price * 100,
        location: c.loc,
        state: stateOf(c.loc),
        description: `${c.model}. ${c.desc}`,
        status: i === 5 ? "sold" : "active",
        views: (i * 13 + 4) % 90,
        createdAt: new Date(Date.now() - ageDays * 864e5),
        photos: {
          create: [{ url: makePhoto(c.brand, c.size, c.cond, i), sort: 0 }],
        },
      },
    });
    listings.push(listing);
  }

  console.log("Creating a sample conversation…");
  // Buyer asks demo seller about their first listing (Michelin Pilot Sport 4S)
  const target = listings.find((l) => l.sellerId === demo.id);
  const thread = await prisma.thread.create({
    data: { listingId: target.id, buyerId: buyer.id, sellerId: demo.id },
  });
  const convo = [
    [buyer.id, "Hey! Are these still available?"],
    [demo.id, "Yep, all 4 are here. Never mounted."],
    [buyer.id, "Would you take $850 cash?"],
    [demo.id, "Could do $880, they're basically new."],
    [buyer.id, "Deal. Can I pick up this weekend?"],
  ];
  let t = Date.now() - 6 * 3600e3;
  for (const [senderId, body] of convo) {
    await prisma.message.create({
      data: { threadId: thread.id, senderId, body, createdAt: new Date(t), readAt: new Date(t + 60000) },
    });
    t += 22 * 60e3;
  }
  // leave the last buyer message from seller's perspective unread
  await prisma.message.create({
    data: { threadId: thread.id, senderId: buyer.id, body: "Also — do you have the original box?", createdAt: new Date() },
  });
  await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

  console.log("\n✅ Seed complete.");
  console.log(`   Users: ${sellers.length + 1}  Listings: ${listings.length}`);
  console.log("\n   Demo seller:  demo@tiretrader.test  / demo1234   (seller · free first year)");
  console.log("   Demo buyer:   buyer@tiretrader.test / buyer1234   (buyer)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
