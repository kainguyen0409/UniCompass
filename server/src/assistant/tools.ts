import { z } from "zod";
import pool from "../db.js";
import { universities, categories, emptyInterests, type Interests } from "../data/catalog.js";
import { readBenchmarks } from "../services/benchmarks.js";
import { readMilestones } from "../services/milestones.js";
import { readSources } from "../services/sources.js";
import { AssistantError, routeSchema } from "./contracts.js";

export const readers = { benchmarks: readBenchmarks, milestones: readMilestones, sources: readSources };
export type Readers = typeof readers;
export type Benchmark = Awaited<ReturnType<typeof readBenchmarks>>[number];
export type Milestone = Awaited<ReturnType<typeof readMilestones>>[number];
export type Source = Awaited<ReturnType<typeof readSources>>[number];
export type Student = { interests: Interests; completedTaskIds: string[] };
export async function readStudent(userId: number): Promise<Student> {
  const result = await pool.query(`SELECT interests, completed_task_ids FROM users
    LEFT JOIN user_progress ON users.id = user_progress.user_id WHERE users.id = $1`, [userId]);
  if (!result.rows.length) throw new AssistantError(401, "Tài khoản không còn tồn tại. Bạn đăng nhập lại nhé.");
  return { interests: result.rows[0].interests ?? emptyInterests(), completedTaskIds: result.rows[0].completed_task_ids ?? [] };
}
export const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
export const programKey = (b: Benchmark) => JSON.stringify([b.universityId, b.programId, b.campus, b.cycle, b.admissionRound]);
const idList = (allowed: string[]) => z.array(z.string().refine(id => allowed.includes(id))).max(12);
const schemas = {
  search_programs: z.object({ query: z.string().max(200), universityIds: idList(universities.map(x => x.id)), categoryIds: idList(categories.map(x => x.id)), useSavedInterests: z.boolean() }).strict(),
  get_program_details: z.object({ programRef: z.string().max(600) }).strict(),
  get_my_roadmap: z.object({ route: routeSchema }).strict(),
  get_sources: z.object({ sourceIds: z.array(z.string().max(50)).min(1).max(12) }).strict()
};
const descriptions = {
  search_programs: "Tìm chương trình trong dữ liệu 2025. Dùng categoryIds computing cho CNTT; query chỉ chứa từ có trong tên/mã/trường. Danh sách rỗng không giới hạn. Trả tối đa 12 kết quả; thu hẹp tìm kiếm nếu có nhiều hơn.",
  get_program_details: "Lấy đầy đủ phương thức và điểm chuẩn của một programRef do search_programs trả về.",
  get_my_roadmap: "Tra cứu quy trình, số bước, các mốc xét tuyển đại học và tiến độ của người đang đăng nhập. Dùng cho câu hỏi chung như Có bao nhiêu bước để xét tuyển đại học, không chỉ câu hỏi về tiến độ cá nhân. route=all nếu không nêu phương thức. Đây là các mốc UniCompass lưu cho 2025, không phải số bước bắt buộc chung cho mọi trường. Không suy ra hạn sắp tới từ ngày hiện tại.",
  get_sources: "Đọc metadata nguồn đã lưu. Không tải hoặc đọc toàn văn trang web."
};
export const toolDefinitions = Object.entries(schemas).map(([name, schema]) => ({
  type: "function" as const, name, description: descriptions[name as keyof typeof descriptions],
  parameters: z.toJSONSchema(schema), strict: false
}));
export function createTools(student: Student, db: Readers = readers) {
  const programs = new Map<string, Benchmark[]>();
  const milestones = new Map<string, Milestone>();
  const sources = new Map<string, Source>();
  let allBenchmarks: Benchmark[] | undefined;
  let allSources: Source[] | undefined;
  async function attachSources(ids: string[]) {
    allSources ??= await db.sources();
    for (const id of ids) {
      const source = allSources.find(s => s.id === id);
      if (source) sources.set(id, source);
    }
  }
  return {
    programs, milestones, sources,
    async execute(name: string, raw: unknown) {
      if (!Object.hasOwn(schemas, name)) throw new AssistantError(502, "Công cụ được yêu cầu không hợp lệ.");
      const args = schemas[name as keyof typeof schemas].safeParse(raw);
      if (!args.success) return { error: "Invalid arguments. Use the declared tool schema and catalog IDs." };
      if (name === "search_programs") {
        const a = schemas.search_programs.parse(raw);
        allBenchmarks ??= await db.benchmarks();
        const matches = (b: Benchmark, i: Interests) => (!i.universityIds.length || i.universityIds.includes(b.universityId)) && (!i.categoryIds.length || b.categoryIds.some((id: string) => i.categoryIds.includes(id)));
        const words = normalize(a.query).split(/\s+/).filter(Boolean);
        const groups = new Map<string, Benchmark[]>();
        for (const b of allBenchmarks) {
          if (String(b.cycle) !== "2025") continue;
          const text = normalize([b.university, universities.find(u => u.id === b.universityId)?.shortName, b.program, b.code, b.campus].join(" "));
          if (!matches(b, a) || (a.useSavedInterests && !matches(b, student.interests)) || !words.every(w => text.includes(w))) continue;
          const key = programKey(b);
          groups.set(key, [...(groups.get(key) ?? []), b]);
        }
        const selected = [...groups].slice(0, 12);
        for (const [key, rows] of selected) programs.set(key, rows);
        await attachSources(selected.flatMap(([, rows]) => rows.map(b => b.sourceId)));
        return { cycle: "2025", total: groups.size, programs: selected.map(([programRef, rows]) => ({ programRef, university: rows[0].university, program: rows[0].program, code: rows[0].code, campus: rows[0].campus, sourceIds: [...new Set(rows.map(b => b.sourceId))] })) };
      }
      if (name === "get_program_details") {
        const { programRef } = schemas.get_program_details.parse(raw);
        const rows = programs.get(programRef);
        return rows ? { programRef, records: rows } : { error: "Unknown programRef. Search programs first." };
      }
      if (name === "get_my_roadmap") {
        const { route } = schemas.get_my_roadmap.parse(raw);
        const rows = await db.milestones(route);
        const next = rows.find(m => !student.completedTaskIds.includes(m.id));
        for (const row of rows) milestones.set(row.id, { ...row, status: student.completedTaskIds.includes(row.id) ? "complete" : row.id === next?.id ? "next" : "later" });
        await attachSources(rows.flatMap(m => m.sourceIds));
        return { cycle: "2025", route, totalMilestones: rows.length, completedMilestones: rows.filter(m => student.completedTaskIds.includes(m.id)).length, nextMilestoneId: next?.id ?? null, milestones: rows.map(m => milestones.get(m.id)) };
      }
      const { sourceIds } = schemas.get_sources.parse(raw);
      await attachSources(sourceIds);
      return { sources: sourceIds.flatMap(id => sources.has(id) ? [sources.get(id)] : []), missingIds: sourceIds.filter(id => !sources.has(id)) };
    }
  };
}
