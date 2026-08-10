// Single source of truth for "does this seller get Pro-tier treatment?"
// True for paid Pro sellers AND founding-promo sellers (free Pro perks +
// ranked placement). Used by the write-time sellerPro mirror, perk gates,
// and trust-badge rendering so the two paths can never drift apart.
export const isProSeller = (s) => !!(s && (s.pro || s.foundingSeller));
