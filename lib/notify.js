import "server-only";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

// Email the other party when they receive a new message or offer.
//
// Rate-limiting is structural, not a timer: the caller only invokes this when
// the recipient is "caught up" (they have NO unread messages from us in this
// thread yet). So a burst of N messages produces at most ONE email — the first
// one that finds them caught up — and no further email until they open the
// thread (which marks messages read) and fall behind again. A 30-msg/min flood
// therefore cannot spam their inbox.
//
// Fire-and-forget by contract: fully guarded so a notification failure can
// never block or 500 the underlying message send. We intentionally do NOT
// include the raw message body (privacy); offers include the amount since that
// is the point of the notification.
export async function notifyNewMessage({
  recipientEmail,
  senderName,
  listingTitle,
  threadId,
  isOffer = false,
  offerCents = null,
}) {
  try {
    if (!recipientEmail) return false;
    const who = senderName || "Someone";
    const item = listingTitle || "your listing";
    const url = `${SITE_URL}/messages/${threadId}`;

    const subject = isOffer
      ? `New offer on ${item} — TireKind`
      : `New message from ${who} — TireKind`;

    const lead = isOffer
      ? `${who} sent an offer of $${(Number(offerCents) / 100).toLocaleString()} on "${item}".`
      : `${who} sent you a message about "${item}".`;

    const text =
      `${lead}\n\n` +
      `View and reply:\n${url}\n\n` +
      `You're getting this because you have a conversation on TireKind. ` +
      `We only email once per conversation until you've read your messages.`;

    return await sendEmail({ to: recipientEmail, subject, text });
  } catch {
    // Never let a notification failure break messaging.
    return false;
  }
}
