// Approximate coordinates for major US cities, used for "near me" radius search.
// Not exhaustive — covers the metros most listings come from. For full ZIP-level
// geocoding in production, swap in a geocoding API (Google/Mapbox) at listing time.

export const CITIES = [
  ["New York", "NY", 40.7128, -74.006], ["Los Angeles", "CA", 34.0522, -118.2437],
  ["Chicago", "IL", 41.8781, -87.6298], ["Houston", "TX", 29.7604, -95.3698],
  ["Phoenix", "AZ", 33.4484, -112.074], ["Philadelphia", "PA", 39.9526, -75.1652],
  ["San Antonio", "TX", 29.4241, -98.4936], ["San Diego", "CA", 32.7157, -117.1611],
  ["Dallas", "TX", 32.7767, -96.797], ["Fort Worth", "TX", 32.7555, -97.3308],
  ["Austin", "TX", 30.2672, -97.7431], ["San Jose", "CA", 37.3382, -121.8863],
  ["Jacksonville", "FL", 30.3322, -81.6557], ["Columbus", "OH", 39.9612, -82.9988],
  ["Charlotte", "NC", 35.2271, -80.8431], ["Indianapolis", "IN", 39.7684, -86.1581],
  ["San Francisco", "CA", 37.7749, -122.4194], ["Seattle", "WA", 47.6062, -122.3321],
  ["Denver", "CO", 39.7392, -104.9903], ["Washington", "DC", 38.9072, -77.0369],
  ["Nashville", "TN", 36.1627, -86.7816], ["Oklahoma City", "OK", 35.4676, -97.5164],
  ["Boston", "MA", 42.3601, -71.0589], ["Las Vegas", "NV", 36.1699, -115.1398],
  ["Portland", "OR", 45.5152, -122.6784], ["Detroit", "MI", 42.3314, -83.0458],
  ["Memphis", "TN", 35.1495, -90.049], ["Louisville", "KY", 38.2527, -85.7585],
  ["Milwaukee", "WI", 43.0389, -87.9065], ["Baltimore", "MD", 39.2904, -76.6122],
  ["Albuquerque", "NM", 35.0844, -106.6504], ["Tucson", "AZ", 32.2226, -110.9747],
  ["Fresno", "CA", 36.7378, -119.7871], ["Sacramento", "CA", 38.5816, -121.4944],
  ["Kansas City", "MO", 39.0997, -94.5786], ["Mesa", "AZ", 33.4152, -111.8315],
  ["Atlanta", "GA", 33.749, -84.388], ["Omaha", "NE", 41.2565, -95.9345],
  ["Colorado Springs", "CO", 38.8339, -104.8214], ["Raleigh", "NC", 35.7796, -78.6382],
  ["Miami", "FL", 25.7617, -80.1918], ["Long Beach", "CA", 33.7701, -118.1937],
  ["Virginia Beach", "VA", 36.8529, -75.978], ["Oakland", "CA", 37.8044, -122.2712],
  ["Minneapolis", "MN", 44.9778, -93.265], ["Tulsa", "OK", 36.154, -95.9928],
  ["Tampa", "FL", 27.9506, -82.4572], ["Arlington", "TX", 32.7357, -97.1081],
  ["New Orleans", "LA", 29.9511, -90.0715], ["Wichita", "KS", 37.6872, -97.3301],
  ["Cleveland", "OH", 41.4993, -81.6944], ["Bakersfield", "CA", 35.3733, -119.0187],
  ["Aurora", "CO", 39.7294, -104.8319], ["Anaheim", "CA", 33.8366, -117.9143],
  ["Honolulu", "HI", 21.3069, -157.8583], ["Santa Ana", "CA", 33.7455, -117.8677],
  ["Riverside", "CA", 33.9806, -117.3755], ["Corpus Christi", "TX", 27.8006, -97.3964],
  ["Lexington", "KY", 38.0406, -84.5037], ["Henderson", "NV", 36.0395, -114.9817],
  ["Stockton", "CA", 37.9577, -121.2908], ["St. Louis", "MO", 38.627, -90.1994],
  ["Cincinnati", "OH", 39.1031, -84.512], ["Pittsburgh", "PA", 40.4406, -79.9959],
  ["Greensboro", "NC", 36.0726, -79.792], ["Orlando", "FL", 28.5383, -81.3792],
  ["Newark", "NJ", 40.7357, -74.1724], ["Durham", "NC", 35.994, -78.8986],
  ["Las Cruces", "NM", 32.3199, -106.7637], ["Chula Vista", "CA", 32.6401, -117.0842],
  ["Buffalo", "NY", 42.8864, -78.8784], ["Madison", "WI", 43.0731, -89.4012],
  ["Lubbock", "TX", 33.5779, -101.8552], ["Chandler", "AZ", 33.3062, -111.8413],
  ["Scottsdale", "AZ", 33.4942, -111.9261], ["Reno", "NV", 39.5296, -119.8138],
  ["Glendale", "AZ", 33.5387, -112.186], ["Norfolk", "VA", 36.8508, -76.2859],
  ["Winston-Salem", "NC", 36.0999, -80.2442], ["Irving", "TX", 32.814, -96.9489],
  ["Chesapeake", "VA", 36.7682, -76.2875], ["Gilbert", "AZ", 33.3528, -111.789],
  ["Hialeah", "FL", 25.8576, -80.2781], ["Garland", "TX", 32.9126, -96.6389],
  ["Fremont", "CA", 37.5485, -121.9886], ["Richmond", "VA", 37.5407, -77.436],
  ["Boise", "ID", 43.615, -116.2023], ["San Bernardino", "CA", 34.1083, -117.2898],
  ["Birmingham", "AL", 33.5186, -86.8104], ["Spokane", "WA", 47.6588, -117.426],
  ["Rochester", "NY", 43.1566, -77.6088], ["Des Moines", "IA", 41.5868, -93.625],
  ["Modesto", "CA", 37.6391, -120.9969], ["Fayetteville", "NC", 35.0527, -78.8784],
  ["Tacoma", "WA", 47.2529, -122.4443], ["Oxnard", "CA", 34.1975, -119.1771],
  ["Fontana", "CA", 34.0922, -117.435], ["Columbus", "GA", 32.4609, -84.9877],
  ["Montgomery", "AL", 32.3668, -86.3], ["Moreno Valley", "CA", 33.9425, -117.2297],
  ["Shreveport", "LA", 32.5252, -93.7502], ["Aurora", "IL", 41.7606, -88.3201],
  ["Yonkers", "NY", 40.9312, -73.8987], ["Akron", "OH", 41.0814, -81.519],
  ["Huntington Beach", "CA", 33.6603, -117.9992], ["Little Rock", "AR", 34.7465, -92.2896],
  ["Augusta", "GA", 33.4735, -82.0105], ["Amarillo", "TX", 35.222, -101.8313],
  ["Salt Lake City", "UT", 40.7608, -111.891], ["Grand Rapids", "MI", 42.9634, -85.6681],
  ["Tallahassee", "FL", 30.4383, -84.2807], ["Knoxville", "TN", 35.9606, -83.9207],
  ["Worcester", "MA", 42.2626, -71.8023], ["Providence", "RI", 41.824, -71.4128],
  ["Newport News", "VA", 37.0871, -76.473], ["Santa Clarita", "CA", 34.3917, -118.5426],
  ["Brownsville", "TX", 25.9017, -97.4975], ["Overland Park", "KS", 38.9822, -94.6708],
  ["Jackson", "MS", 32.2988, -90.1848], ["Garden Grove", "CA", 33.7739, -117.9415],
  ["Chattanooga", "TN", 35.0456, -85.3097], ["Oceanside", "CA", 33.1959, -117.3795],
  ["Fort Lauderdale", "FL", 26.1224, -80.1373], ["Rancho Cucamonga", "CA", 34.1064, -117.5931],
  ["Santa Rosa", "CA", 38.4404, -122.7141], ["Salem", "OR", 44.9429, -123.0351],
  ["Eugene", "OR", 44.0521, -123.0868], ["Cape Coral", "FL", 26.5629, -81.9495],
  ["Charleston", "SC", 32.7765, -79.9311], ["Columbia", "SC", 34.0007, -81.0348],
];

// South Florida (Broward, Miami-Dade, Palm Beach) municipalities and large CDPs, from the
// 2024 Census Gazetteer internal points. TireKind is a SoFla marketplace, so these must NOT
// fall through to the Florida state centroid (near Lake Wales, ~150 mi from Broward), which
// would rank a Coral Springs set behind a Miami one in nearest-first sorting.
export const SOFLA_PLACES = [
  ["Atlantis", "FL", 26.5972, -80.1041], ["Aventura", "FL", 25.9602, -80.133], ["Bal Harbour", "FL", 25.8933, -80.1232],
  ["Bay Harbor Islands", "FL", 25.888, -80.1336], ["Belle Glade", "FL", 26.6922, -80.6656], ["Biscayne Gardens", "FL", 25.913, -80.2007],
  ["Biscayne Park", "FL", 25.8817, -80.1811], ["Boca Raton", "FL", 26.3727, -80.1037], ["Boynton Beach", "FL", 26.5283, -80.0807],
  ["Briny Breezes", "FL", 26.5089, -80.0522], ["Cloud Lake", "FL", 26.6749, -80.0715], ["Coconut Creek", "FL", 26.2809, -80.1847],
  ["Cooper City", "FL", 26.0481, -80.285], ["Coral Gables", "FL", 25.6831, -80.2617], ["Coral Springs", "FL", 26.2707, -80.2593],
  ["Country Club", "FL", 25.9395, -80.3092], ["Cutler Bay", "FL", 25.5761, -80.334], ["Dania Beach", "FL", 26.0572, -80.1646],
  ["Davie", "FL", 26.0792, -80.283], ["Deerfield Beach", "FL", 26.3117, -80.1254], ["Delray Beach", "FL", 26.4559, -80.0904],
  ["Doral", "FL", 25.816, -80.3576], ["El Portal", "FL", 25.8553, -80.1962], ["Florida City", "FL", 25.4441, -80.4677],
  ["Glen Ridge", "FL", 26.6721, -80.0767], ["Glenvar Heights", "FL", 25.7094, -80.3159], ["Golden Beach", "FL", 25.9633, -80.1221],
  ["Golf", "FL", 26.5029, -80.1058], ["Greenacres", "FL", 26.627, -80.1376], ["Gulf Stream", "FL", 26.486, -80.0574],
  ["Hallandale Beach", "FL", 25.984, -80.1408], ["Haverhill", "FL", 26.691, -80.1217], ["Hialeah Gardens", "FL", 25.8877, -80.3569],
  ["Highland Beach", "FL", 26.4116, -80.0644], ["Hillsboro Beach", "FL", 26.2785, -80.0795], ["Hollywood", "FL", 26.031, -80.1646],
  ["Homestead", "FL", 25.4667, -80.4443], ["Homestead Base", "FL", 25.4933, -80.3902], ["Hypoluxo", "FL", 26.5673, -80.0518],
  ["Indian Creek", "FL", 25.8779, -80.1373], ["Juno Beach", "FL", 26.8755, -80.0596], ["Jupiter", "FL", 26.9186, -80.1169],
  ["Jupiter Farms", "FL", 26.9225, -80.218], ["Jupiter Inlet Colony", "FL", 26.948, -80.0752], ["Kendale Lakes", "FL", 25.7069, -80.4116],
  ["Kendall", "FL", 25.6695, -80.3547], ["Key Biscayne", "FL", 25.6907, -80.1656], ["Lake Clarke Shores", "FL", 26.6456, -80.0753],
  ["Lake Park", "FL", 26.8001, -80.0675], ["Lake Worth Beach", "FL", 26.6197, -80.0587], ["Lantana", "FL", 26.5834, -80.0554],
  ["Lauderdale Lakes", "FL", 26.1669, -80.2008], ["Lauderdale-by-the-Sea", "FL", 26.1913, -80.0995], ["Lauderhill", "FL", 26.1622, -80.2244],
  ["Lazy Lake", "FL", 26.1563, -80.1452], ["Lighthouse Point", "FL", 26.2778, -80.0886], ["Loxahatchee Groves", "FL", 26.7209, -80.2772],
  ["Manalapan", "FL", 26.5666, -80.0402], ["Mangonia Park", "FL", 26.7586, -80.0761], ["Margate", "FL", 26.248, -80.2112],
  ["Medley", "FL", 25.8649, -80.3576], ["Miami Beach", "FL", 25.8106, -80.1489], ["Miami Gardens", "FL", 25.9489, -80.2436],
  ["Miami Lakes", "FL", 25.9127, -80.3204], ["Miami Shores", "FL", 25.867, -80.1783], ["Miami Springs", "FL", 25.8202, -80.2889],
  ["Miramar", "FL", 25.9725, -80.3386], ["North Bay Village", "FL", 25.8491, -80.151], ["North Key Largo", "FL", 25.2608, -80.3216],
  ["North Lauderdale", "FL", 26.2125, -80.2214], ["North Miami", "FL", 25.9008, -80.1686], ["North Miami Beach", "FL", 25.93, -80.1652],
  ["North Palm Beach", "FL", 26.8203, -80.0569], ["Oakland Park", "FL", 26.1791, -80.1524], ["Ocean Ridge", "FL", 26.5309, -80.0468],
  ["Opa-locka", "FL", 25.9, -80.2552], ["Pahokee", "FL", 26.8202, -80.662], ["Palm Beach", "FL", 26.6948, -80.0419],
  ["Palm Beach Gardens", "FL", 26.8488, -80.1671], ["Palm Beach Shores", "FL", 26.7774, -80.0344], ["Palm Springs", "FL", 26.6358, -80.0984],
  ["Palmetto Bay", "FL", 25.6217, -80.3189], ["Parkland", "FL", 26.3214, -80.2543], ["Pembroke Park", "FL", 25.9889, -80.1803],
  ["Pembroke Pines", "FL", 26.0147, -80.3402], ["Pinecrest", "FL", 25.6652, -80.3049], ["Plantation", "FL", 26.1256, -80.2618],
  ["Pompano Beach", "FL", 26.2416, -80.1339], ["Princeton", "FL", 25.5406, -80.3984], ["Richmond West", "FL", 25.6093, -80.4296],
  ["Riviera Beach", "FL", 26.7814, -80.0761], ["Royal Palm Beach", "FL", 26.699, -80.2276], ["Sea Ranch Lakes", "FL", 26.1999, -80.0984],
  ["South Bay", "FL", 26.6884, -80.7355], ["South Miami", "FL", 25.7085, -80.2951], ["South Miami Heights", "FL", 25.5882, -80.3858],
  ["South Palm Beach", "FL", 26.5904, -80.038], ["Southwest Ranches", "FL", 26.0497, -80.3738], ["Sunny Isles Beach", "FL", 25.9388, -80.1235],
  ["Sunrise", "FL", 26.1716, -80.2616], ["Surfside", "FL", 25.8788, -80.125], ["Sweetwater", "FL", 25.7844, -80.3871],
  ["Tamarac", "FL", 26.2033, -80.256], ["Tamiami", "FL", 25.7563, -80.4026], ["Tequesta", "FL", 26.9649, -80.1132],
  ["The Acreage", "FL", 26.7742, -80.2769], ["The Hammocks", "FL", 25.6704, -80.4489], ["Virginia Gardens", "FL", 25.8095, -80.2975],
  ["Wellington", "FL", 26.649, -80.2672], ["West Little River", "FL", 25.8569, -80.237], ["West Miami", "FL", 25.7578, -80.2969],
  ["West Palm Beach", "FL", 26.7451, -80.127], ["West Park", "FL", 25.9787, -80.181], ["Westchester", "FL", 25.7454, -80.3535],
  ["Westlake", "FL", 26.7547, -80.3015], ["Weston", "FL", 26.1004, -80.4021], ["Wilton Manors", "FL", 26.1593, -80.1393],
];

// Approximate geographic centroid per state (+ DC), used as a last-resort
// fallback so a listing in a smaller city we don't have in CITIES (e.g. Coral
// Springs, FL) still gets placed roughly in the right state for "near me" radius
// search, instead of dropping out (lat/lng null) of every distance query.
export const STATE_CENTROIDS = {
  AL: [32.806, -86.791], AK: [61.370, -152.404], AZ: [33.729, -111.431],
  AR: [34.970, -92.373], CA: [36.117, -119.681], CO: [39.059, -105.311],
  CT: [41.597, -72.755], DE: [39.318, -75.507], DC: [38.897, -77.026],
  FL: [27.766, -81.687], GA: [33.040, -83.643], HI: [21.094, -157.498],
  ID: [44.240, -114.478], IL: [40.349, -88.986], IN: [39.849, -86.258],
  IA: [42.011, -93.210], KS: [38.526, -96.726], KY: [37.668, -84.670],
  LA: [31.169, -91.867], ME: [44.693, -69.381], MD: [39.064, -76.802],
  MA: [42.230, -71.530], MI: [43.326, -84.536], MN: [45.694, -93.900],
  MS: [32.741, -89.678], MO: [38.456, -92.288], MT: [46.921, -110.454],
  NE: [41.125, -98.268], NV: [38.313, -117.055], NH: [43.452, -71.564],
  NJ: [40.298, -74.521], NM: [34.840, -106.248], NY: [42.166, -74.948],
  NC: [35.630, -79.806], ND: [47.528, -99.784], OH: [40.388, -82.764],
  OK: [35.565, -96.928], OR: [44.572, -122.071], PA: [40.590, -77.209],
  RI: [41.680, -71.511], SC: [33.856, -80.945], SD: [44.299, -99.438],
  TN: [35.747, -86.692], TX: [31.054, -97.563], UT: [40.150, -111.862],
  VT: [44.045, -72.710], VA: [37.769, -78.170], WA: [47.400, -121.490],
  WV: [38.491, -80.954], WI: [44.268, -89.616], WY: [42.756, -107.302],
};

function toRad(d) { return (d * Math.PI) / 180; }

/** Distance in miles between two lat/lng points (haversine). */
export function milesBetween(a, b, c, d) {
  // Use isFinite (not just typeof): NaN is typeof "number", so bad search coords
  // (e.g. Number("abc")) would otherwise yield NaN distances that compare false
  // and silently empty every result.
  if (![a, b, c, d].every(Number.isFinite)) return Infinity;
  const R = 3958.8;
  const dLat = toRad(c - a);
  const dLng = toRad(d - b);
  const lat1 = toRad(a), lat2 = toRad(c);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Look up coordinates for a "City, ST" / "City" string.
 * Returns {lat,lng} for an exact city hit, {lat,lng,approx:true} for a
 * state-centroid fallback when the city isn't in CITIES but the state is known,
 * or null when neither resolves. `state` (2-letter) is preferred over any state
 * parsed from the input text.
 */
export function geocodeCity(input, state) {
  if (!input) return null;
  const text = String(input).trim();
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  // "539 Charles St, Providence, RI 02904" -> the city is the segment after the street.
  const cityPart = (parts.length > 1 && /^\d/.test(parts[0]) ? parts[1] : parts[0] || "").toLowerCase();
  // Prefer the explicit state; else the first 2-letter state code in any later segment
  // (so "Providence, RI 02904, United States" still yields "RI").
  const tokens = parts.slice(1).join(" ").toUpperCase().split(/[\s,]+/);
  const stAbbr = (state || tokens.find((t) => STATE_CENTROIDS[t]) || tokens[0] || "").trim().toUpperCase();
  // SoFla places only match when the state is FL or absent; the legacy any-state
  // fallback stays limited to CITIES.
  const hit =
    CITIES.concat(SOFLA_PLACES).find((c) => c[0].toLowerCase() === cityPart && (!stAbbr || c[1] === stAbbr)) ||
    CITIES.find((c) => c[0].toLowerCase() === cityPart);
  if (hit) return { lat: hit[2], lng: hit[3] };
  const cen = STATE_CENTROIDS[stAbbr];
  if (cen) return { lat: cen[0], lng: cen[1], approx: true };
  return null;
}

/** Distinct city list (for the radius picker). */
export function cityOptions() {
  return CITIES.map((c) => ({ label: `${c[0]}, ${c[1]}`, lat: c[2], lng: c[3], state: c[1] }));
}
