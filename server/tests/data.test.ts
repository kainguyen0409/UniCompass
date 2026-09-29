import assert from "node:assert/strict";
import test from "node:test";
import { benchmarks, benchmarkSources, validateCutoffData } from "../src/data/admissions2025.js";

function cutoff(universityId: string, programId: string, methodId: string) {
  const matches = benchmarks.filter((item) => item.universityId === universityId
    && item.programId === programId && item.methodId === methodId);
  assert.equal(matches.length, 1, `${universityId}/${programId}/${methodId} must identify one published cutoff`);
  return matches[0];
}

test("the complete seed passes its ID, source-link, category, and score checks before touching the database", () => {
  assert.doesNotThrow(validateCutoffData);
  assert.deepEqual([...new Set(benchmarks.map((item) => item.universityId))].sort(), ["ftu", "hust", "neu", "uet"]);
  assert.deepEqual([...new Set(benchmarks.map((item) => item.scale))].sort((a, b) => a - b), [30, 40, 100]);
  for (const source of benchmarkSources) {
    const hostname = new URL(source.url).hostname;
    assert.ok(["vnu.edu.vn", "neu.edu.vn", "hust.edu.vn", "ftu.edu.vn"]
      .some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)), source.url);
  }
});

test("NEU and UET retain published final common-scale cutoffs, not input exam scores", () => {
  const fixtures: [string, string, string, number, string][] = [
    ["neu", "7340201", "neu-common", 27.34, "NEU25"],
    ["neu", "7340122", "neu-common", 28.83, "NEU25"],
    ["uet", "CN1", "uet-common", 28.19, "UET25"]
  ];
  for (const [universityId, programId, methodId, score, sourceId] of fixtures) {
    const item = cutoff(universityId, programId, methodId);
    assert.equal(item.score, score);
    assert.equal(item.scale, 30);
    assert.equal(item.cycle, "2025");
    assert.equal(item.sourceId, sourceId);
    assert.match(item.methodLabel, /quy đổi/);
  }
});

test("HUST IT-E10 keeps the separately published THPT, TSA, and XTTN 1.3 values", () => {
  const fixtures: [string, number, number][] = [
    ["hust-thpt", 29.39, 30],
    ["hust-tsa", 86.97, 100],
    ["hust-xttn-13", 95.64, 100]
  ];
  for (const [methodId, score, scale] of fixtures) {
    const item = cutoff("hust", "IT-E10", methodId);
    assert.equal(item.score, score);
    assert.equal(item.scale, scale);
    assert.equal(item.sourceId, "SOICT25");
  }
});

test("FTU uses each program's published scale, including converted HSA scores", () => {
  const fixtures: [string, string, number, number][] = [
    ["KTEH1_1", "ftu-thpt", 27.55, 30],
    ["KTEH1_1", "ftu-hsa-converted", 28.07, 30],
    ["NNAH1_1", "ftu-thpt-language", 32.4, 40],
    ["NNAH1_1", "ftu-hsa-converted", 36.29, 40],
    ["KHMH2_1", "ftu-thpt-math", 36.4, 40],
    ["KHMH2_1", "ftu-vact-converted", 37.75, 40]
  ];
  for (const [programId, methodId, score, scale] of fixtures) {
    const item = cutoff("ftu", programId, methodId);
    assert.equal(item.score, score);
    assert.equal(item.scale, scale);
    assert.equal(item.campus, "Hà Nội");
    assert.equal(item.sourceId, "FTU25");
    if (methodId.includes("converted")) assert.match(item.methodLabel, /quy đổi/);
  }
  // A blank V-ACT cell in the language table must not become an inferred score.
  assert.equal(benchmarks.some((item) => item.universityId === "ftu"
    && item.programId === "NNAH1_1" && item.methodId === "ftu-vact-converted"), false);
});
