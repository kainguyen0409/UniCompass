// Stable IDs connect the signup choices, saved interests, and cutoff data.
export const universities = [
  { id: "uet", name: "Trường Đại học Công nghệ · ĐHQGHN", shortName: "UET" },
  { id: "neu", name: "Đại học Kinh tế Quốc dân", shortName: "NEU" },
  { id: "hust", name: "Đại học Bách khoa Hà Nội", shortName: "HUST" },
  { id: "ftu", name: "Trường Đại học Ngoại thương", shortName: "FTU" }
];

export const categories = [
  { id: "economics", label: "Kinh tế" },
  { id: "business", label: "Kinh doanh & quản lý" },
  { id: "finance", label: "Tài chính & ngân hàng" },
  { id: "accounting", label: "Kế toán & kiểm toán" },
  { id: "law", label: "Luật" },
  { id: "languages", label: "Ngôn ngữ" },
  { id: "engineering", label: "Kỹ thuật" },
  { id: "computing", label: "CNTT & máy tính" },
  { id: "science", label: "Khoa học" },
  { id: "logistics", label: "Logistics" }
];

export interface Interests {
  universityIds: string[];
  categoryIds: string[];
}

export function emptyInterests(): Interests {
  return { universityIds: [], categoryIds: [] };
}
