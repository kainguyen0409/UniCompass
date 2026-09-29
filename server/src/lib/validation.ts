import { categories, emptyInterests, universities, type Interests } from "../data/catalog.js";

// Each validator returns either cleaned data or a message the route can show to the user.
type ValidationResult<T> = { value: T; error?: never } | { error: string; value?: never };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type ProgressUpdate = {
  completedTaskIds?: string[];
  scores?: { thpt?: number; hsa?: number; sat?: number };
  interests?: Interests;
};

// Accept only schools and categories from our catalog, then remove repeated selections.
export function validateInterests(value: unknown): ValidationResult<Interests> {
  if (!isObject(value) || Object.keys(value).some((key) => !["universityIds", "categoryIds"].includes(key))) {
    return { error: "Lựa chọn trường và nhóm ngành không hợp lệ." };
  }
  const { universityIds, categoryIds } = value;
  if (!Array.isArray(universityIds) || universityIds.some((id) => typeof id !== "string" || !universities.some((university) => university.id === id))) {
    return { error: "Bạn chọn trường trong danh sách nhé." };
  }
  if (!Array.isArray(categoryIds) || categoryIds.some((id) => typeof id !== "string" || !categories.some((category) => category.id === id))) {
    return { error: "Bạn chọn nhóm ngành trong danh sách nhé." };
  }
  return { value: { universityIds: [...new Set(universityIds)], categoryIds: [...new Set(categoryIds)] } };
}

// An omitted field means “keep the saved value”; zero and [] are valid updates.
export function validateProgressUpdate(body: unknown): ValidationResult<ProgressUpdate> {
  if (!isObject(body) || Object.keys(body).some((key) => !["completedTaskIds", "scores", "interests"].includes(key))) {
    return { error: "Dữ liệu tiến độ không hợp lệ." };
  }

  // Build a partial update from the fields actually supplied. Adding defaults here
  // would accidentally erase saved values when the student changes just one field.
  const update: ProgressUpdate = {};
  if ("completedTaskIds" in body) {
    if (!Array.isArray(body.completedTaskIds) || body.completedTaskIds.some((id) => typeof id !== "string" || !id || id.length > 50)) {
      return { error: "Danh sách việc đã làm không hợp lệ." };
    }
    update.completedTaskIds = [...new Set(body.completedTaskIds)];
  }

  if ("scores" in body) {
    if (!isObject(body.scores) || Object.keys(body.scores).some((key) => !["thpt", "hsa", "sat"].includes(key))) {
      return { error: "Điểm không hợp lệ." };
    }
    update.scores = {};
    // Each exam has its own range. THPT allows decimals; HSA and SAT use whole numbers.
    const limits = { thpt: 30, hsa: 150, sat: 1600 } as const;
    for (const key of ["thpt", "hsa", "sat"] as const) {
      if (!(key in body.scores)) continue;
      const score = body.scores[key];
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > limits[key]) {
        return { error: `Điểm ${key.toUpperCase()} phải từ 0 đến ${limits[key]}.` };
      }
      if (key !== "thpt" && !Number.isInteger(score)) {
        return { error: `Điểm ${key.toUpperCase()} phải là số nguyên.` };
      }
      // Allow tiny floating-point rounding errors when checking the two-decimal limit.
      if (key === "thpt" && Math.abs(score * 100 - Math.round(score * 100)) > 0.000001) {
        return { error: "Điểm THPT có tối đa 2 chữ số thập phân." };
      }
      update.scores[key] = score;
    }
  }

  if ("interests" in body) {
    const interests = validateInterests(body.interests);
    if (interests.error) return { error: interests.error };
    update.interests = interests.value!;
  }

  // Reject requests that change nothing. An empty task list still counts: it clears the list.
  if (!update.completedTaskIds && !update.interests && Object.keys(update.scores ?? {}).length === 0) {
    return { error: "Chưa có tiến độ để lưu." };
  }
  return { value: update };
}

type Credentials = { email: string; password: string };

// Login and registration share these basic checks. Normalize the email, but preserve
// the password exactly as entered because spaces and letter case are part of it.
export function validateCredentials(body: unknown): ValidationResult<Credentials> {
  if (!isObject(body) || typeof body.email !== "string" || typeof body.password !== "string") {
    return { error: "Nhập email và mật khẩu." };
  }
  const email = body.email.trim().toLowerCase();
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email chưa đúng định dạng." };
  }
  if (!body.password) return { error: "Nhập mật khẩu." };
  // bcrypt only uses the first 72 bytes; Vietnamese characters can take more than one byte.
  if (Buffer.byteLength(body.password, "utf8") > 72) return { error: "Mật khẩu quá dài. Bạn dùng mật khẩu ngắn hơn nhé." };
  return { value: { email, password: body.password } };
}

// Signup adds profile fields and password-strength rules to the shared login checks.
export function validateRegistration(body: unknown): ValidationResult<Credentials & { name: string; grade: string | null; interests: Interests }> {
  const credentials = validateCredentials(body);
  if (credentials.error) return { error: credentials.error };
  if (!isObject(body) || typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) {
    return { error: "Nhập tên của bạn (tối đa 100 ký tự)." };
  }
  if (body.grade !== undefined && body.grade !== null && (typeof body.grade !== "string" || body.grade.trim().length > 50)) {
    return { error: "Thông tin lớp không hợp lệ." };
  }
  const { password } = credentials.value!;
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: "Mật khẩu cần ít nhất 8 ký tự, 1 chữ hoa và 1 số." };
  }
  // Choosing interests is optional at signup; students can fill them in later.
  const interests = "interests" in body ? validateInterests(body.interests) : { value: emptyInterests() };
  if (interests.error) return { error: interests.error };
  return { value: {
    ...credentials.value!, name: body.name.trim(),
    grade: typeof body.grade === "string" ? body.grade.trim() || null : null,
    interests: interests.value!
  } };
}
