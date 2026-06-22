function isEven(value: number) {
  return value % 2 === 0;
}

function firstEvenInside(value: number) {
  return isEven(value) ? value : value + 1;
}

function lastEvenInside(value: number) {
  return isEven(value) ? value : value - 1;
}

export function parseSizes(input: string): number[] {
  const sizes = new Set<number>();

  input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const rangeMatch = part.match(/^(\d{1,3})\s*-\s*(\d{1,3})$/);

      if (rangeMatch) {
        const rawStart = Number(rangeMatch[1]);
        const rawEnd = Number(rangeMatch[2]);
        const min = Math.min(rawStart, rawEnd);
        const max = Math.max(rawStart, rawEnd);
        const start = firstEvenInside(min);
        const end = lastEvenInside(max);

        for (let size = start; size <= end; size += 2) {
          sizes.add(size);
        }
        return;
      }

      const singleMatch = part.match(/^\d{1,3}$/);
      if (singleMatch) {
        sizes.add(Number(part));
      }
    });

  return Array.from(sizes).sort((a, b) => a - b);
}
