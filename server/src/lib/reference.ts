import { REFERENCE_ALPHABET } from "../config/constants.js";

function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
  }
  return out;
}

/** Payment reference, e.g. SF-BLOK-4821 */
export function generatePaymentRef(groupId: string): string {
  const shortGroupId = groupId.slice(-4).toUpperCase();
  return `SF-${shortGroupId}-${randomDigits(4)}`;
}

/** Payout disbursement reference, e.g. SF-PO-4821 */
export function generatePayoutRef(): string {
  return `SF-PO-${randomDigits(4)}`;
}
