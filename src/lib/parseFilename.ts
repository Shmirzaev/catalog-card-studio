export type ParsedFilename = {
  model?: string;
  code?: string;
  sizes?: string;
  fabric?: string;
};

function normalizeTokenSeparators(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanFabric(value: string) {
  const fabric = value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/(\d{2,3})\s*%?\s*(cotton)/i, "$1% COTTON")
    .trim()
    .toUpperCase();

  return fabric || undefined;
}

export function parseFilename(filename: string): ParsedFilename {
  const normalized = normalizeTokenSeparators(filename);
  const modelMatch = normalized.match(/\b([A-Z]{1,4}\s*-\s*\d{3,5})\b/i);
  const codeMatch = normalized.match(/\b(V\s*-\s*\d{3,5})\b/i);
  const sizeMatch = normalized.match(/\b(\d{2}\s*-\s*\d{2})\b/);

  let fabricSource = normalized;
  [modelMatch?.[0], codeMatch?.[0], sizeMatch?.[0]].forEach((match) => {
    if (match) {
      fabricSource = fabricSource.replace(match, " ");
    }
  });

  return {
    model: modelMatch?.[1].replace(/\s+/g, "").toUpperCase(),
    code: codeMatch?.[1].replace(/\s+/g, "").toUpperCase(),
    sizes: sizeMatch?.[1].replace(/\s+/g, ""),
    fabric: cleanFabric(fabricSource)
  };
}
