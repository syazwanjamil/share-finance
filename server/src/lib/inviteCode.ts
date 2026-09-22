import { INVITE_CODE_ALPHABET, INVITE_CODE_PREFIX, INVITE_CODE_SUFFIX_LENGTH } from "../config/constants.js";

export function generateInviteCode(): string {
  let suffix = "";
  for (let i = 0; i < INVITE_CODE_SUFFIX_LENGTH; i++) {
    suffix += INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)];
  }
  return `${INVITE_CODE_PREFIX}-${suffix}`;
}
