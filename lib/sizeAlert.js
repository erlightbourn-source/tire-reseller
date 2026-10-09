// Who sees the listing-page size alert (PR #61): logged-out buyers only.
// Pure and dependency-free so it is unit-testable in plain Node (see test/sizeAlertGuard.test.mjs).
export function showSizeAlert(user) {
  return !user;
}
