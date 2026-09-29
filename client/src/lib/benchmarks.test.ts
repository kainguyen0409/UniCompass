import { describe, expect, it } from "vitest";
import type { Benchmark } from "../types";
import { groupBenchmarks, matchesInterests, searchText } from "./benchmarks";

function cutoff(overrides: Partial<Benchmark> = {}): Benchmark {
  return {
    id: "hust-it1-thpt", university: "Đại học Bách khoa Hà Nội", universityId: "hust",
    program: "Công nghệ thông tin", programId: "hust-it1", code: "IT1", campus: "Hà Nội",
    categoryIds: ["computing", "engineering"], methodId: "thpt", methodLabel: "Thi tốt nghiệp THPT",
    subjectGroups: ["A00", "A01"], admissionRound: "Đợt 1", score: 28.5, scale: 30,
    cycle: "2025", sourceId: "S5", note: "", ...overrides
  };
}

describe("cutoff filters and grouping", () => {
  it("requires both selected dimensions while accepting any school or category within each", () => {
    const interests = { universityIds: ["hust", "uet"], categoryIds: ["computing", "science"] };
    expect(matchesInterests(cutoff(), interests)).toBe(true);
    expect(matchesInterests(cutoff({ universityId: "uet", categoryIds: ["science"] }), interests)).toBe(true);
    expect(matchesInterests(cutoff({ universityId: "neu" }), interests)).toBe(false);
    expect(matchesInterests(cutoff({ categoryIds: ["economics"] }), interests)).toBe(false);
  });

  it("treats an empty dimension as unrestricted", () => {
    expect(matchesInterests(cutoff(), { universityIds: [], categoryIds: [] })).toBe(true);
    expect(matchesInterests(cutoff(), { universityIds: ["hust"], categoryIds: [] })).toBe(true);
    expect(matchesInterests(cutoff(), { universityIds: [], categoryIds: ["engineering"] })).toBe(true);
    expect(matchesInterests(cutoff(), { universityIds: [], categoryIds: ["finance"] })).toBe(false);
  });

  it("groups methods of one program without combining different campuses, years, rounds, or schools", () => {
    const original = cutoff();
    const anotherMethod = cutoff({ id: "hust-it1-tsa", methodId: "tsa", methodLabel: "Đánh giá tư duy", score: 85.63, scale: 100 });
    const records = [
      original, anotherMethod,
      cutoff({ id: "other-campus", campus: "Cơ sở khác" }),
      cutoff({ id: "other-year", cycle: "2024" }),
      cutoff({ id: "other-round", admissionRound: "Bổ sung" }),
      cutoff({ id: "other-school", universityId: "uet" }),
      cutoff({ id: "other-program", programId: "hust-it2" })
    ];
    const groups = groupBenchmarks(records);
    expect(groups).toHaveLength(6);
    expect(groups[0].records).toEqual([original, anotherMethod]);
    expect(groups.slice(1).every((group) => group.records.length === 1)).toBe(true);
    expect(groups[0].records.map((item) => [item.score, item.scale])).toEqual([[28.5, 30], [85.63, 100]]);
  });

  it("accepts Vietnamese search with or without accents, including Đ", () => {
    expect(searchText("  ĐẠI HỌC Bách Khoa Hà Nội  ")).toBe("dai hoc bach khoa ha noi");
    expect(searchText("Công nghệ thông tin")).toBe(searchText("Cong nghe thong tin"));
  });
});
