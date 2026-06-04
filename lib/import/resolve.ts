/**
 * Fuzzy-ish entity resolution for bulk imports: match a user-supplied cell
 * (an id, a code, or a bilingual name) back to a known record. Used to map
 * human-friendly spreadsheet columns onto the slug PKs the API expects.
 */

function norm(s: string | undefined | null): string {
  return (s ?? '').trim().toLowerCase();
}

/**
 * Build a resolver from a list of records. The record's `id` always matches,
 * plus any additional keys (names, codes, phone) returned by `keysOf`.
 * Earlier records win on collisions so seed/canonical rows take precedence.
 */
export function buildLookup<T extends { id: string }>(
  items: T[],
  keysOf: (item: T) => (string | undefined | null)[],
): (raw: string | undefined) => T | undefined {
  const map = new Map<string, T>();
  for (const item of items) {
    const idKey = norm(item.id);
    if (idKey && !map.has(idKey)) map.set(idKey, item);
    for (const k of keysOf(item)) {
      const nk = norm(k);
      if (nk && !map.has(nk)) map.set(nk, item);
    }
  }
  return (raw) => {
    const key = norm(raw);
    return key ? map.get(key) : undefined;
  };
}

/**
 * Read the first non-empty value among several candidate column names from a
 * parsed row. Lets a template accept either `client` or `client_id`, etc.
 */
export function pickColumn(
  record: Record<string, string>,
  ...names: string[]
): string {
  for (const n of names) {
    const v = record[n];
    if (v && v.trim() !== '') return v.trim();
  }
  return '';
}
