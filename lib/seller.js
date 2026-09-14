// Single source of truth for "does this seller get the seller-plan perks?"
// True for paid-plan sellers (`pro`, set on subscription activation) AND
// founding sellers (perks included free + ranked placement). Used by the write-time sellerPro mirror, perk gates,
// and trust-badge rendering so the two paths can never drift apart.
export const isProSeller = (s) => !!(s && (s.pro || s.foundingSeller));
