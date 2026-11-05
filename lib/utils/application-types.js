// A new tinted permit and its renewal differ only in required documents, price
// and agent pay. Everywhere else (status copy, agent steps, routing) they are
// one service, so check with this rather than comparing to "tinted_permit".
export const TINTED_PERMIT_TYPES = ["tinted_permit", "tinted_permit_renewal"];

export function isTintedPermit(applicationType) {
  return TINTED_PERMIT_TYPES.includes(applicationType);
}
