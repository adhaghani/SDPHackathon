export function suppressSmallGroup(value: number, minimum = 5): number | null {
  return value < minimum ? null : value
}

export function estimatedPurchasesAvoided(
  loans: Array<{ estimated_new_price_rm?: number | null; would_have_bought?: string | null }>
): number {
  return loans
    .filter((loan) => loan.would_have_bought === "yes")
    .reduce((sum, loan) => sum + Number(loan.estimated_new_price_rm ?? 0), 0)
}
