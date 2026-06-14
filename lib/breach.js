import "server-only";
import crypto from "crypto";

// Check a password against Have I Been Pwned using k-anonymity: we send only the
// first 5 chars of the SHA-1 hash, never the password or full hash. Free, no key.
// Fail-OPEN: if the API is unreachable we allow the password (don't block signups
// on a network hiccup). https://haveibeenpwned.com/API/v3#PwnedPasswords
export async function isPasswordPwned(password) {
  try {
    const sha1 = crypto.createHash("sha1").update(String(password)).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix && Number(count) > 0) return true;
    }
    return false;
  } catch {
    return false; // fail open
  }
}
