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
  const cityPart = text.split(",")[0].trim().toLowerCase();
  // Prefer the explicit state; else take the first 2-letter-ish token after the
  // first comma (so "Providence, RI 02904, United States" still yields "RI").
  const stRaw = state || text.split(",").slice(1).join(",");
  const stAbbr = (stRaw || "").trim().toUpperCase().split(/[\s,]+/)[0];
  const hit =
    CITIES.find((c) => c[0].toLowerCase() === cityPart && (!stAbbr || c[1] === stAbbr)) ||
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
