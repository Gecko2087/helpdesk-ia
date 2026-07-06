export function formatTicketCode(nextNumber) {
  return `HD-${String(nextNumber).padStart(4, "0")}`;
}
