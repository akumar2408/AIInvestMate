

export function toCSV(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach(k => set.add(k));
      return set;
    }, new Set<string>())
  );
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map(h => String((r as any)[h] ?? "")).join(","));
  }
  return lines.join("\n");
}