import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Benchmark, Catalog, Milestone, Source } from "./types";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function milestone(id: string, title: string, routeIds: Milestone["routeIds"], status: Milestone["status"]): Milestone {
  return { id, title, routeIds, status, phase: "Chuẩn bị", plainLanguage: "Làm theo hướng dẫn.", displayDate: "06/06/2025", sourceIds: ["S1"], checklist: ["Kiểm tra hồ sơ"] };
}

// Deliberately mix routes and archived status values to exercise live progress.
const milestones: Milestone[] = [
  milestone("profile-review", "Kiểm tra hồ sơ", ["thpt"], "complete"),
  milestone("priority-admission", "Nộp hồ sơ ưu tiên", ["hsa"], "complete"),
  milestone("preference-registration", "Đăng ký nguyện vọng", ["thpt"], "next"),
  milestone("sat-submission", "Nộp điểm SAT", ["sat"], "later"),
  milestone("hsa-submission", "Nộp điểm HSA", ["hsa"], "later")
];

const benchmarks: Benchmark[] = [{
  id: "uet-cn1", universityId: "uet", university: "UET", programId: "CN1", program: "Công nghệ thông tin", code: "CN1",
  campus: "Hà Nội", categoryIds: ["computing"], methodId: "thpt", methodLabel: "THPT", subjectGroups: [], admissionRound: "Đợt 1",
  score: 28.19, scale: 30, cycle: "2025", sourceId: "S1", note: "Điểm năm 2025."
}, {
  id: "neu-finance", universityId: "neu", university: "Đại học Kinh tế Quốc dân", programId: "7340201", program: "Tài chính-Ngân hàng", code: "7340201",
  campus: "Hà Nội", categoryIds: ["finance"], methodId: "common", methodLabel: "THPT / điểm quy đổi", subjectGroups: [], admissionRound: "Đợt 1",
  score: 27.34, scale: 30, cycle: "2025", sourceId: "S1", note: "Điểm chung."
}];
const catalog: Catalog = {
  universities: [{ id: "uet", name: "Trường Đại học Công nghệ", shortName: "UET" }, { id: "neu", name: "Đại học Kinh tế Quốc dân", shortName: "NEU" }],
  categories: [{ id: "computing", label: "Máy tính & CNTT" }, { id: "finance", label: "Tài chính & ngân hàng" }]
};

const sources: Source[] = [{
  id: "S1", shortLabel: "S1", title: "Lịch tuyển sinh 2025", publisher: "Bộ GD&ĐT",
  url: "https://example.com/source", cycle: "Tuyển sinh 2025", publishedAt: "19/05/2025",
  verifiedAt: "25/09/2026", status: "Archived", fields: ["Lịch tuyển sinh"], note: "Dữ liệu kỳ trước."
}];

describe("admissions demo flows", () => {
  let root: Root;
  let host: HTMLDivElement;
  let failMilestones: boolean;

  beforeEach(() => {
    localStorage.clear();
    failMilestones = false;
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0; });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/milestones" && failMilestones) throw new Error("Connection interrupted");
      const values: Record<string, unknown> = { "/api/milestones": milestones, "/api/benchmarks": benchmarks, "/api/sources": sources, "/api/catalog": catalog };
      if (!(url in values)) throw new Error(`Unexpected API request: ${url}`);
      return new Response(JSON.stringify(values[url]), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    localStorage.clear();
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  async function render() {
    await act(async () => { root.render(<App />); });
  }

  function button(text: string) {
    const found = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
      .find((item) => item.textContent?.trim() === text);
    expect(found, `Expected button: ${text}`).toBeDefined();
    return found!;
  }

  async function click(target: HTMLElement) {
    await act(async () => { target.click(); });
  }

  it("returns to the first unfinished step when an earlier step is reopened", async () => {
    await render();
    expect(host.querySelector(".next-action-card h2")?.textContent).toBe("Đăng ký nguyện vọng");
    const firstStep = host.querySelector(".timeline-item")!;
    const checkbox = firstStep.querySelector<HTMLInputElement>("input[type='checkbox']")!;
    expect(checkbox.checked).toBe(true);

    await click(checkbox);

    expect(host.querySelector(".next-action-card h2")?.textContent).toBe("Kiểm tra hồ sơ");
    expect(firstStep.querySelector(".status-tag")?.textContent).toBe("Tiếp theo");
    const nextBadges = Array.from(host.querySelectorAll(".timeline .status-tag"))
      .filter((badge) => badge.textContent === "Tiếp theo");
    expect(nextBadges).toHaveLength(1);
  });

  it("uses the same filtered steps for the completion count and percentage", async () => {
    await render();
    expect(host.querySelector(".progress-number")?.textContent).toBe("40%");
    await click(button("THPT"));

    expect(host.querySelectorAll(".timeline-item")).toHaveLength(2);
    expect(host.querySelector(".progress-number")?.textContent).toBe("50%");
    const cardText = host.querySelector(".progress-card")?.textContent?.replace(/\s/g, "");
    expect(cardText).toContain("1/2");
  });

  it("keeps available views usable after a loading failure and lets the user retry", async () => {
    failMilestones = true;
    await render();
    expect(host.querySelector("[role='alert']")?.textContent).toContain("lộ trình");
    expect(host.querySelector(".timeline")).toBeNull();

    await click(button("Điểm chuẩn"));
    expect(host.querySelector(".benchmark-card h3")?.textContent).toBe("Công nghệ thông tin");
    await click(button("Nguồn dữ liệu"));
    expect(host.querySelector(".source-card h3")?.textContent).toBe("Lịch tuyển sinh 2025");

    failMilestones = false;
    await click(button("Thử lại"));
    expect(host.querySelector("[role='alert']")).toBeNull();
    await click(button("Lộ trình"));
    expect(host.querySelectorAll(".timeline-item")).toHaveLength(5);
  });

  it("shows sources without irrelevant route filters and preserves the score view when filtering", async () => {
    await render();
    await click(button("Điểm chuẩn"));
    expect(host.querySelector(".profile-routes")).toBeNull();
    expect(host.querySelector("input[type=number]")).toBeNull();
    expect(host.querySelector(".benchmark-card")).not.toBeNull();
    expect(host.querySelector(".timeline")).toBeNull();

    await click(button("Nguồn dữ liệu"));
    expect(host.querySelectorAll(".source-card")).toHaveLength(1);
    expect(host.querySelector(".filter-set")).toBeNull();
    expect(host.querySelector(".profile-routes")).toBeNull();
  });

  it("lets guests edit interests, cancel drafts, and explore all results without changing preferences", async () => {
    await render();
    await click(button("Điểm chuẩn"));
    expect(host.querySelectorAll(".benchmark-card")).toHaveLength(2);
    await click(button("Chọn sở thích"));
    function modalButton(text: string) {
      return [...document.querySelectorAll<HTMLButtonElement>("[role=dialog] button")].find((item) => item.textContent?.trim() === text)!;
    }
    function pickNeu() {
      return [...document.querySelectorAll<HTMLLabelElement>(".interest-option")].find((item) => item.textContent?.includes("NEU"))!.querySelector<HTMLInputElement>("input")!;
    }
    await click(pickNeu());
    await click(modalButton("Hủy"));
    expect(host.querySelectorAll(".benchmark-card")).toHaveLength(2);
    await click(button("Chọn sở thích"));
    expect(pickNeu().checked).toBe(false);
    await click(pickNeu());
    await click(modalButton("Lưu sở thích"));
    expect(host.querySelectorAll(".benchmark-card")).toHaveLength(1);
    expect(host.querySelector(".benchmark-card h3")?.textContent).toBe("Tài chính-Ngân hàng");
    await click(button("Tất cả"));
    expect(host.querySelectorAll(".benchmark-card")).toHaveLength(2);
    expect(host.querySelector(".interest-summary")?.textContent).toContain("NEU");
    await click(button("Theo sở thích"));
    expect(host.querySelectorAll(".benchmark-card")).toHaveLength(1);
  });

  it("includes the student's interests in registration", async () => {
    await render();
    await click(host.querySelector<HTMLButtonElement>("button.student-chip")!);
    const registerToggle = [...document.querySelectorAll<HTMLButtonElement>("[role=dialog] button")].find((item) => item.textContent?.trim() === "Đăng ký")!;
    await click(registerToggle);
    const dialog = document.querySelector("[role=dialog]")!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    for (const [selector, value] of [["input[autocomplete=name]", "Minh"], ["input[type=email]", "minh@example.test"], ["input[autocomplete=new-password]", "DemoPass9"], ["input[placeholder='Nhập lại mật khẩu']", "DemoPass9"]]) {
      const input = dialog.querySelector<HTMLInputElement>(selector)!;
      act(() => { setValue.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
    }
    const label = [...dialog.querySelectorAll<HTMLLabelElement>(".interest-option")].find((item) => item.textContent?.includes("NEU"))!;
    await click(label.querySelector<HTMLInputElement>("input")!);
    // Reject after capture so the test can inspect the exact registration payload.
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Email đã tồn tại." }), { status: 409 }));
    await act(async () => dialog.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    const call = vi.mocked(fetch).mock.calls.find(([url]) => url === "/api/auth/register")!;
    expect(JSON.parse(call[1]!.body as string)).toMatchObject({ name: "Minh", interests: { universityIds: ["neu"], categoryIds: [] } });
    expect(dialog.querySelector("[role=alert]")?.textContent).toContain("Email đã tồn tại");
  });
  it("keeps browsing usable when the catalog response is malformed", async () => {
    const originalFetch = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(async (input, init) => String(input) === "/api/catalog"
      ? new Response("{}", { status: 200 }) : originalFetch(input, init));
    await render();
    expect(host.querySelector("[role=alert]")?.textContent).toContain("danh sách trường, ngành");
    await click(button("Điểm chuẩn"));
    expect(host.querySelectorAll(".benchmark-card")).toHaveLength(2);
    expect(button("Chọn sở thích").disabled).toBe(true);
  });

  it("prevents a second login attempt while the first response is pending", async () => {
    await render();
    await click(host.querySelector<HTMLButtonElement>("button.student-chip")!);
    const dialog = document.querySelector("[role=dialog]")!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    for (const [selector, value] of [["input[type=email]", "minh@example.test"], ["input[type=password]", "DemoPass9"]]) {
      const input = dialog.querySelector<HTMLInputElement>(selector)!;
      act(() => { setValue.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
    }
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>((resolve) => { finish = resolve; }));
    await act(async () => { dialog.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    const close = dialog.querySelector<HTMLButtonElement>("button[aria-label='Đóng']")!;
    expect(close.disabled).toBe(true);
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(document.querySelector("[role=dialog]")).toBe(dialog);
    await act(async () => finish(new Response(JSON.stringify({ error: "Thử lại nhé." }), { status: 503 })));
    expect(close.disabled).toBe(false);
    await click(close);
    expect(document.querySelector("[role=dialog]")).toBeNull();
  });

});
