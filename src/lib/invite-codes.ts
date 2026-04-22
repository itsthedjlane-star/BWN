import { randomBytes } from "node:crypto";

/**
 * Generate a cryptographically random invite code with the BWN-
 * prefix. `crypto.randomBytes` (not `Math.random`) so codes can't be
 * predicted from a few observed values.
 *
 * 6 bytes base32-crockford gives ~30 bits of entropy in 8 chars, which
 * is enough for a single-use invite gated by admin approval.
 */
const BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford — no I, L, O, U

export function generateInviteCode(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) {
    out += BASE32[b & 0x1f];
    out += BASE32[(b >> 3) & 0x1f];
  }
  return `BWN-${out.slice(0, 8)}`;
}
