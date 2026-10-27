const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const compactInrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount) {
  return inrFormatter.format(Number(amount));
}

export function formatCompactCurrency(amount) {
  return compactInrFormatter.format(Number(amount));
}
