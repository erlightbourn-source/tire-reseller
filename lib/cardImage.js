// Loading policy for listing-card photos.
//
// The first few cards on a list are above the fold on phones and desktops, so
// they load eagerly (the first two also at high fetch priority). Deeper cards
// stay lazy. A lazy image that is slow to start can sit as broken alt text, so
// the above-the-fold set is not left to the lazy-load heuristic.
export const EAGER_CARD_COUNT = 4;
export const HIGH_PRIORITY_CARD_COUNT = 2;

/**
 * @param {number|null|undefined} index position of the card in its list.
 *   Missing/invalid means "unknown position", which stays lazy.
 * @returns {{ loading: "eager"|"lazy", fetchPriority: "high"|undefined }}
 */
export function cardImageLoading(index) {
  const i = Number.isInteger(index) && index >= 0 ? index : Infinity;
  return {
    loading: i < EAGER_CARD_COUNT ? "eager" : "lazy",
    fetchPriority: i < HIGH_PRIORITY_CARD_COUNT ? "high" : undefined,
  };
}
