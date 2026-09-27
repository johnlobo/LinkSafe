export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeMetadataValues(values: string[], knownValues: string[] = []): string[] {
  const canonicalValues = new Map<string, string>();

  for (const value of [...knownValues, ...values]) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (!canonicalValues.has(key)) {
      canonicalValues.set(key, trimmed);
    }
  }

  const requestedKeys = new Set(
    values.map((value) => value.trim().toLowerCase()).filter(Boolean)
  );

  return Array.from(canonicalValues.entries())
    .filter(([key]) => requestedKeys.has(key))
    .map(([, value]) => value);
}

export function collectMetadataValues(values: string[]): string[] {
  const normalized = normalizeMetadataValues(values, values);
  return normalized.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
