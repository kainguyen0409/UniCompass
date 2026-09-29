import type { Benchmark, Interests } from "../types";

// Vietnamese search also accepts text without accents (including đ).
export function searchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}

export function matchesInterests(item: Benchmark, interests: Interests) {
  // Leaving either selection empty means there's no filter for that group.
  return (!interests.universityIds.length || interests.universityIds.includes(item.universityId))
    && (!interests.categoryIds.length || item.categoryIds.some((id) => interests.categoryIds.includes(id)));
}

export function groupBenchmarks(items: Benchmark[]) {
  const groups = new Map<string, Benchmark[]>();
  for (const item of items) {
    // Keep campuses, years and admission rounds separate even when codes match.
    const key = JSON.stringify([item.universityId, item.programId, item.campus, item.cycle, item.admissionRound]);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([id, records]) => ({
    id,
    // Put the familiar THPT basis first, without ranking unlike score scales.
    records: records.sort((a, b) => Number(!a.methodId.includes("thpt")) - Number(!b.methodId.includes("thpt")))
  }));
}
