export function formatRM(amount: number): string {
  const formatted = amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `RM ${formatted}`;
}

/** Figures for a note face: whole ringgit without cents, cents only when they exist. */
export function formatFigure(amount: number): string {
  const whole = Number.isInteger(amount);
  return amount.toLocaleString("en-MY", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
