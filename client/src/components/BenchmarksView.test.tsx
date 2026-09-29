import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Benchmark, Catalog, Interests } from "../types";
import { BenchmarksView } from "./BenchmarksView";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const catalog: Catalog = {
  universities: [
    { id: "uet", name: "Đại học Công nghệ", shortName: "UET" },
    { id: "neu", name: "Đại học Kinh tế Quốc dân", shortName: "NEU" },
    { id: "hust", name: "Đại học Bách khoa Hà Nội", shortName: "HUST" },
    { id: "ftu", name: "Đại học Ngoại thương", shortName: "FTU" }
  ],
  categories: [
    { id: "computing", label: "CNTT & máy tính" },
    { id: "engineering", label: "Kỹ thuật" },
    { id: "business", label: "Kinh doanh" },
    { id: "economics", label: "Kinh tế" }
  ]
};

function cutoff(overrides: Partial<Benchmark>): Benchmark {
  return {
    id: "hust-it1-thpt", university: "Đại học Bách khoa Hà Nội", universityId: "hust",
    program: "Công nghệ thông tin", programId: "hust-it1", code: "IT1", campus: "Hà Nội",
    categoryIds: ["computing", "engineering"], methodId: "thpt", methodLabel: "Thi tốt nghiệp THPT",
    subjectGroups: ["A00", "A01"], admissionRound: "Đợt 1", score: 28.5, scale: 30,
    cycle: "2025", sourceId: "S5", note: "Ghi chú chính thức.", ...overrides
  };
}

const benchmarks = [
  cutoff({}),
  cutoff({ id: "hust-it1-tsa", methodId: "tsa", methodLabel: "Đánh giá tư duy", subjectGroups: [], score: 85.63, scale: 100 }),
  cutoff({ id: "uet-cn1", university: "Đại học Công nghệ", universityId: "uet", programId: "uet-cn1", code: "CN1", categoryIds: ["computing"], score: 28.19 }),
  cutoff({ id: "neu-qtkd", university: "Đại học Kinh tế Quốc dân", universityId: "neu", program: "Quản trị kinh doanh", programId: "neu-qtkd", code: "7340101", categoryIds: ["business", "economics"], score: 27.3 }),
  cutoff({ id: "ftu-hn", university: "Đại học Ngoại thương", universityId: "ftu", program: "Kinh tế quốc tế", programId: "ftu-ktqt", code: "7310106", categoryIds: ["economics"], score: 28.2 }),
  cutoff({ id: "ftu-hcm", university: "Đại học Ngoại thương", universityId: "ftu", program: "Kinh tế quốc tế", programId: "ftu-ktqt", code: "7310106", campus: "TP. Hồ Chí Minh", categoryIds: ["economics"], score: 28.1 })
];

describe("cutoff browsing", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  function render(interests: Interests = { universityIds: [], categoryIds: [] }) {
    act(() => root.render(<BenchmarksView benchmarks={benchmarks} catalog={catalog} interests={interests}
      disabled={false} onEditInterests={vi.fn()} SourceBadge={({ sourceId }) => <button>{sourceId}</button>} />));
  }

  const cards = () => Array.from(host.querySelectorAll<HTMLElement>("article"));
  function button(label: string) {
    const target = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
      .find((item) => item.textContent?.trim() === label);
    expect(target, `Expected button ${label}`).toBeDefined();
    return target!;
  }

  function click(label: string) {
    act(() => button(label).click());
  }

  function search(value: string) {
    const input = host.querySelector<HTMLInputElement>("input[type='search']")!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function select(label: string, value: string) {
    const element = Array.from(host.querySelectorAll("label"))
      .find((item) => item.querySelector("span")?.textContent === label)!.querySelector("select")!;
    act(() => {
      element.value = value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  it("starts with saved interests and lets the user browse all schools without changing them", () => {
    const interests = { universityIds: ["hust", "uet"], categoryIds: ["computing"] };
    render(interests);
    expect(cards()).toHaveLength(2);
    expect(button("Theo sở thích").getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelector("[role='status']")?.textContent).toContain("2 ngành");

    click("Tất cả");
    expect(cards()).toHaveLength(5);
    expect(button("Tất cả").getAttribute("aria-pressed")).toBe("true");
    expect(interests).toEqual({ universityIds: ["hust", "uet"], categoryIds: ["computing"] });
    click("Theo sở thích");
    expect(cards()).toHaveLength(2);
  });

  it("shows all records for undecided users and searches multiple words without accents", () => {
    render();
    expect(cards()).toHaveLength(5);
    search("DAI HOC BACH KHOA cong nghe");
    expect(cards()).toHaveLength(1);
    expect(cards()[0].textContent).toContain("Đại học Bách khoa Hà Nội");
    search("ftu kinh te");
    expect(cards()).toHaveLength(2);
    expect(cards().map((card) => card.querySelector(".benchmark-heading small")?.textContent)).toEqual([
      "7310106 · Hà Nội · Đợt 1", "7310106 · TP. Hồ Chí Minh · Đợt 1"
    ]);
  });

  it("combines school and category filters", () => {
    render();
    select("Trường", "ftu");
    expect(cards()).toHaveLength(2);
    select("Nhóm ngành", "computing");
    expect(cards()).toHaveLength(0);
    select("Nhóm ngành", "economics");
    expect(cards()).toHaveLength(2);
    select("Trường", "neu");
    expect(cards()).toHaveLength(1);
    expect(cards()[0].querySelector("h3")?.textContent).toBe("Quản trị kinh doanh");
  });

  it("resets search, school, category, and preference scope after no results", () => {
    render({ universityIds: ["hust"], categoryIds: ["computing"] });
    select("Trường", "ftu");
    select("Nhóm ngành", "economics");
    search("nganh chua co");
    expect(cards()).toHaveLength(0);
    expect(host.querySelector(".empty-state")?.textContent).toContain("Chưa tìm thấy ngành phù hợp");

    click("Xem tất cả ngành");
    expect(cards()).toHaveLength(5);
    expect(host.querySelector<HTMLInputElement>("input[type='search']")?.value).toBe("");
    expect(Array.from(host.querySelectorAll("select")).map((item) => item.value)).toEqual(["", ""]);
    expect(button("Tất cả").getAttribute("aria-pressed")).toBe("true");
  });

  it("shows each official method's score and scale without converting them", () => {
    render({ universityIds: ["hust"], categoryIds: [] });
    expect(cards()).toHaveLength(1);
    const rows = Array.from(cards()[0].querySelectorAll(".cutoff-score-row"));
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector("dt")?.textContent).toContain("Thi tốt nghiệp THPT");
    expect(rows[0].querySelector("dt small")?.textContent).toBe("A00, A01");
    expect(rows.map((row) => [row.querySelector("dd strong")?.textContent, row.querySelector("dd span")?.textContent?.trim()]))
      .toEqual([["28,50", "/ 30"], ["85,63", "/ 100"]]);
    expect(rows[1].querySelector("dt")?.textContent).toBe("Đánh giá tư duy");
    expect(host.querySelector("input[type='number']")).toBeNull();
    expect(cards()[0].querySelectorAll(".source-row button")).toHaveLength(1);
  });
});
