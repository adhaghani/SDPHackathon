const SYNONYMS: Record<string, string> = {
  drill: "drill",
  drills: "drill",
  gerudi: "drill",
  ladder: "ladder",
  ladders: "ladder",
  tangga: "ladder",
  table: "table",
  tables: "table",
  meja: "table",
  chair: "chair",
  chairs: "chair",
  kerusi: "chair",
  pot: "pot",
  pots: "pot",
  periuk: "pot",
}

export function normalizeSearchTerm(term: string): string {
  const normalized = term.trim().toLowerCase().replace(/\s+/g, " ")
  return SYNONYMS[normalized] ?? normalized
}
