import { universities, categories } from "./catalog.js";
import { uetSources, uetBenchmarks } from "./uet2025.js";
import { neuSources, neuBenchmarks } from "./neu2025.js";
import { hustSources, hustBenchmarks } from "./hust2025.js";
import { ftuSources, ftuBenchmarks } from "./ftu2025.js";

// Keep each school's data in its own file, then combine it for validation and the database import.
export const benchmarkSources = [...uetSources, ...neuSources, ...hustSources, ...ftuSources];
export const benchmarks = [...uetBenchmarks, ...neuBenchmarks, ...hustBenchmarks, ...ftuBenchmarks];

// Fail before changing the database if a hand-edited dataset has broken links,
// duplicate IDs, invalid categories, or a score outside its published scale.
export function validateCutoffData() {
  // Collect source IDs first so every cutoff can be checked against a known citation below.
  const sourceIds = new Set<string>();
  for (const source of benchmarkSources) {
    if (!source.id || source.id.length > 10 || sourceIds.has(source.id) || !source.url.startsWith("https://")) {
      throw new Error(`Invalid or duplicate source: ${source.id}`);
    }
    sourceIds.add(source.id);
  }
  const recordIds = new Set<string>();
  const recordKeys = new Set<string>();
  for (const item of benchmarks) {
    // Catch the same cutoff entered twice under different IDs, while allowing separate
    // campuses, rounds, methods, and subject combinations for the same program.
    const key = JSON.stringify([item.universityId, item.programId, item.campus, item.cycle,
      item.admissionRound, item.methodId, item.subjectGroups]);
    if (!item.id || item.id.length > 50 || recordIds.has(item.id) || recordKeys.has(key)
      || !universities.some((entry) => entry.id === item.universityId)
      || !item.categoryIds.length || item.categoryIds.some((id) => !categories.some((entry) => entry.id === id))
      || !sourceIds.has(item.sourceId) || !item.code || item.code.length > 20
      || !item.programId || !item.methodId || !item.methodLabel || !item.admissionRound
      || item.cycle !== "2025" || !Number.isFinite(item.score) || item.score <= 0
      || !Number.isInteger(item.scale) || item.scale <= 0 || item.score > item.scale) {
      throw new Error(`Invalid or duplicate cutoff: ${item.id}`);
    }
    recordIds.add(item.id); recordKeys.add(key);
  }
}
