// All 20 final cutoffs in UET's official 2025 announcement.
// The announcement uses one common /30 admission score, not raw HSA/SAT scores.
// Categories are navigation labels chosen for this demo, not official groupings.
const programs: [code: string, name: string, score: number, categories: string[]][] = [
  ["CN1", "Công nghệ thông tin", 28.19, ["computing"]],
  ["CN2", "Kỹ thuật máy tính", 27.00, ["computing", "engineering"]],
  ["CN3", "Vật lý kỹ thuật", 25.20, ["science", "engineering"]],
  ["CN4", "Cơ kỹ thuật", 26.15, ["engineering"]],
  ["CN5", "Công nghệ kỹ thuật xây dựng", 22.25, ["engineering"]],
  ["CN6", "Công nghệ kỹ thuật cơ – điện tử", 26.73, ["engineering"]],
  ["CN7", "Công nghệ hàng không vũ trụ", 23.96, ["engineering"]],
  ["CN8", "Khoa học máy tính", 27.86, ["computing"]],
  ["CN9", "Công nghệ kỹ thuật điện tử – viễn thông", 26.63, ["engineering"]],
  ["CN10", "Công nghệ nông nghiệp", 22.00, ["science", "engineering"]],
  ["CN11", "Kỹ thuật điều khiển và tự động hoá", 27.90, ["engineering"]],
  ["CN12", "Trí tuệ nhân tạo", 27.75, ["computing"]],
  ["CN13", "Kỹ thuật năng lượng", 24.87, ["engineering"]],
  ["CN14", "Hệ thống thông tin", 26.38, ["computing"]],
  ["CN15", "Mạng máy tính và truyền thông dữ liệu", 26.73, ["computing"]],
  ["CN17", "Kỹ thuật Robot", 26.00, ["engineering", "computing"]],
  ["CN18", "Thiết kế công nghiệp và Đồ họa", 24.20, ["engineering"]],
  ["CN19", "Công nghệ vật liệu", 25.60, ["science", "engineering"]],
  ["CN20", "Khoa học dữ liệu", 27.38, ["computing", "science"]],
  ["CN21", "Công nghệ sinh học", 22.13, ["science"]]
];

export const uetSources = [{
  id: "UET25", shortLabel: "UET25",
  title: "Điểm trúng tuyển đại học chính quy UET năm 2025",
  publisher: "Trường Đại học Công nghệ · ĐHQGHN",
  url: "https://tuyensinh.uet.vnu.edu.vn/uncategorized/thong-bao-diem-trung-tuyen-dai-hoc-chinh-quy-vao-truong-dai-hoc-cong-nghe-dhqghn-nam-2025/",
  cycle: "Tuyển sinh 2025", publishedAt: "22/08/2025", verifiedAt: "27/09/2026", status: "Archived",
  fields: ["Điểm chuẩn cuối cùng", "20 ngành đào tạo", "Thang điểm xét tuyển chung 30"],
  note: "Đủ 20 ngành trong thông báo. Điểm chuẩn dùng chung giữa các tổ hợp; HSA và SAT dùng điểm quy đổi theo quy định UET 2025. Nhóm ngành trên ứng dụng phục vụ tìm kiếm."
}];

export const uetBenchmarks = programs.map(([code, program, score, categoryIds]) => ({
  id: `uet-${code.toLowerCase()}-2025`, universityId: "uet", university: "Trường Đại học Công nghệ · ĐHQGHN",
  programId: code, program, code, campus: null, categoryIds,
  methodId: "uet-common", methodLabel: "THPT / điểm quy đổi", subjectGroups: [],
  admissionRound: "Đợt 1", score, scale: 30, cycle: "2025", sourceId: "UET25",
  note: "Điểm xét tuyển chung thang 30, gồm điểm cộng và ưu tiên theo quy định; HSA/SAT dùng điểm quy đổi. Khi bằng điểm ở cuối danh sách, trường ưu tiên nguyện vọng có thứ tự cao hơn."
}));
