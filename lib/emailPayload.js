// Builds the JSON body for Resend's POST /emails. Kept free of "server-only" so node --test can load it.
//
// Resend honours Reply-To only as the top-level `reply_to` field; a "Reply-To" inside custom `headers`
// is dropped. The L1314 preview proof (2026-10-11) showed it: the guest-inquiry email arrived with no
// Reply-To, so a seller's plain reply went to noreply@ instead of the buyer. Any Reply-To key (any case)
// is lifted out of `headers` into `reply_to`; every other custom header (List-Unsubscribe etc.) passes
// through unchanged.
export function buildResendBody({ from, to, subject, text, headers }) {
  const rest = {};
  let replyTo;
  for (const [k, v] of Object.entries(headers || {})) {
    if (k.toLowerCase() === "reply-to") replyTo = v;
    else rest[k] = v;
  }
  return {
    from,
    to,
    subject,
    text,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(Object.keys(rest).length ? { headers: rest } : {}),
  };
}
