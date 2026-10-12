export type ImpactLoan = {
  estimated_new_price_rm?: number | null
  typical_new_price_rm?: number | null
}

export function estimatedValueShared(loan: ImpactLoan): number {
  return Number(loan.estimated_new_price_rm ?? loan.typical_new_price_rm ?? 0)
}

export function sumEstimatedValueShared(loans: ImpactLoan[]): number {
  return loans.reduce((sum, loan) => sum + estimatedValueShared(loan), 0)
}

export function formatEstimatedMoney(value: number): string {
  return `RM ${Math.round(value).toLocaleString("en-MY")}`
}
