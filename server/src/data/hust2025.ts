// Curated final 2025 cutoffs copied from official HUST records.
// A later publication date does not change the admission year: historical tables
// below are read ONLY from their explicitly labelled 2025 column.
// No cutoff is calculated from another method.
// Categories are search labels chosen for this demo, not official HUST groupings.

type PublishedProgram = {
  code: string;
  program: string;
  categoryIds: string[];
  thpt?: number;
  tsa?: number;
  xttn13?: number;
  subjectGroups?: string[];
  sourceId: string;
  groupNote?: string;
  coverageNote?: string;
};

const computing: PublishedProgram[] = [
  { code: "IT1", program: "Khoa học máy tính", thpt: 29.19, tsa: 83.39, xttn13: 93.92 },
  { code: "IT2", program: "Kỹ thuật máy tính", thpt: 28.83, tsa: 79.86, xttn13: 89.62 },
  { code: "IT-E10", program: "Khoa học dữ liệu và Trí tuệ nhân tạo (CT tiên tiến)", thpt: 29.39, tsa: 86.97, xttn13: 95.64 },
  { code: "IT-E15", program: "An toàn không gian số - Cyber Security", thpt: 28.69, tsa: 78.49, xttn13: 87.95 },
  { code: "IT-E6", program: "Công nghệ thông tin Việt - Nhật", thpt: 27.97, tsa: 72.81, xttn13: 75.17, subjectGroups: ["A00", "A01", "D28", "K01"] },
  { code: "IT-E7", program: "Công nghệ thông tin Global ICT", thpt: 28.66, tsa: 78.19, xttn13: 87.59 },
  { code: "IT-EP", program: "Công nghệ thông tin Việt - Pháp", thpt: 27.83, tsa: 71.83, xttn13: 72.30, subjectGroups: ["A00", "A01", "D29", "K01"] }
].map((item) => ({
  ...item, categoryIds: ["computing"], sourceId: "SOICT25",
  subjectGroups: item.subjectGroups ?? ["A00", "A01", "K01"]
}));

// Official School of Materials Science and Engineering historical table.
// K00 belongs to TSA and is kept separate from the THPT subject groups.
const materials: PublishedProgram[] = [
  { code: "TX1", program: "Công nghệ Dệt May", thpt: 22.48, tsa: 53.17 },
  { code: "MS1", program: "Kỹ thuật vật liệu", thpt: 25.39, tsa: 60.99 },
  { code: "MS2", program: "Kỹ thuật Vi điện tử và Công nghệ nano", thpt: 28.25, tsa: 74.76 },
  { code: "MS3", program: "Công nghệ vật liệu Polyme và Compozit", thpt: 25.16, tsa: 60.04 },
  { code: "MS-E3", program: "Khoa học và Kỹ thuật Vật liệu (CT tiên tiến)", thpt: 23.70, tsa: 55.89 },
  { code: "MS5", program: "Kỹ thuật in", thpt: 24.06, tsa: 56.88 }
].map((item) => ({
  ...item, categoryIds: ["engineering"], sourceId: "SMSE25",
  subjectGroups: ["A00", "A01", "D07", "K01"]
}));

// Historical 2025 columns, pages 28-34 of the first official 2026 PDF.
// These extracts do not state every THPT combination; leave that field empty
// instead of guessing combinations from a later year's admissions plan.
const historical: PublishedProgram[] = [
  { code: "EE1", program: "Kỹ thuật Điện", thpt: 27.55, tsa: 69.88, categoryIds: ["engineering"] },
  { code: "EE2", program: "Kỹ thuật Điều khiển - Tự động hoá", thpt: 28.48, tsa: 76.43, categoryIds: ["engineering"] },
  { code: "EE-E18", program: "Hệ thống điện và năng lượng tái tạo (CT tiên tiến)", thpt: 26.56, tsa: 65.80, categoryIds: ["engineering"] },
  { code: "EE-E8", program: "Kỹ thuật Điều khiển - Tự động hoá (CT tiên tiến)", thpt: 28.12, tsa: 73.86, categoryIds: ["engineering"] },
  { code: "EE-EP", program: "Tin học công nghiệp và Tự động hóa (Việt - Pháp PFIEV)", thpt: 27.27, tsa: 68.73, categoryIds: ["computing", "engineering"] },
  { code: "EM1", program: "Quản lý năng lượng", thpt: 23.70, tsa: 63.32, categoryIds: ["economics", "business"] },
  { code: "EM2", program: "Quản lý công nghiệp", thpt: 23.90, tsa: 64.15, categoryIds: ["business", "engineering"] },
  { code: "EM3", program: "Quản trị kinh doanh", thpt: 24.30, tsa: 65.81, categoryIds: ["business"], subjectGroups: ["D01"], groupNote: "Mốc D01; thông báo 22/08/2025 quy định A00, A01 và K01 cao hơn 0,50 điểm." },
  // Only the TSA figure was fully visible in the verified historical extract.
  { code: "EM5", program: "Tài chính - Ngân hàng", tsa: 65.81, categoryIds: ["finance"], coverageNote: "Demo chưa có mốc THPT đã xác minh cho ngành này, dù HUST có xét tuyển bằng THPT." },
  { code: "ME1", program: "Kỹ thuật Cơ điện tử", thpt: 27.90, tsa: 72.32, categoryIds: ["engineering"] },
  { code: "ME2", program: "Kỹ thuật Cơ khí", thpt: 26.62, tsa: 66.05, categoryIds: ["engineering"] },
  { code: "ME-E1", program: "Kỹ thuật Cơ điện tử (CT tiên tiến)", thpt: 26.74, tsa: 66.54, categoryIds: ["engineering"] },
  { code: "ME-GU", program: "Cơ khí Chế tạo máy - hợp tác với ĐH Griffith (Úc)", thpt: 25.00, tsa: 59.49, categoryIds: ["engineering"] },
  { code: "ME-LUH", program: "Cơ điện tử - hợp tác với ĐH Leibniz Hannover (Đức)", thpt: 26.19, tsa: 64.28, categoryIds: ["engineering"] },
  { code: "ME-NUT", program: "Cơ điện tử - hợp tác với ĐHCN Nagaoka (Nhật Bản)", thpt: 25.68, tsa: 62.18, categoryIds: ["engineering"] },
  { code: "MI1", program: "Toán - Tin", thpt: 27.80, tsa: 71.62, categoryIds: ["science", "computing"] }
].map((item) => ({ ...item, sourceId: "HUSTH25" }));

// Historical 2025 columns, pages 32, 35 and 37 of the signed 2026 PDF.
const historicalFinal: PublishedProgram[] = [
  { code: "FL1", program: "Tiếng Anh Khoa học Kỹ thuật và Công nghệ", thpt: 24.30, tsa: 65.81, categoryIds: ["languages"] },
  { code: "FL2", program: "Tiếng Anh chuyên nghiệp quốc tế", thpt: 24.30, tsa: 65.81, categoryIds: ["languages"] },
  { code: "HE1", program: "Kỹ thuật Nhiệt", thpt: 25.47, tsa: 61.32, categoryIds: ["engineering"] },
  { code: "MI2", program: "Hệ thống thông tin quản lý", thpt: 27.72, tsa: 71.07, categoryIds: ["computing", "business"] },
  { code: "FL3", program: "Tiếng Trung Khoa học và Công nghệ", thpt: 24.86, tsa: 68.14, categoryIds: ["languages"], subjectGroups: ["D01", "D04"], groupNote: "Mốc D01/D04; thông báo 22/08/2025 quy định K01 cao hơn 0,50 điểm." }
].map((item) => ({ ...item, sourceId: "HUSTHF25" }));

const announcement: PublishedProgram[] = [
  { code: "ET1", program: "Kỹ thuật Điện tử - Viễn thông", thpt: 28.07, categoryIds: ["engineering"], sourceId: "HUST25" },
  { code: "TROY-BA", program: "Quản trị kinh doanh - hợp tác với ĐH Troy (Hoa Kỳ)", thpt: 19.00, categoryIds: ["business"], sourceId: "HUST25" }
];

export const hustSources = [
  {
    id: "HUST25", shortLabel: "HUST25",
    title: "HUST công bố điểm chuẩn năm 2025",
    publisher: "Đại học Bách khoa Hà Nội",
    url: "https://hust.edu.vn/vi/news/hoat-dong-chung/dai-hoc-bach-khoa-ha-noi-cong-bo-diem-chuan-xet-tuyen-dai-hoc-nam-2025-655575.html",
    cycle: "Tuyển sinh 2025", publishedAt: "22/08/2025", verifiedAt: "27/09/2026", status: "Archived",
    fields: ["Điểm chuẩn cuối cùng", "Thang điểm", "Độ lệch giữa các tổ hợp"],
    note: "Thông báo kết quả 2025 và cách tính điểm xét tuyển. Một số ngành kinh tế, ngôn ngữ có mốc khác nhau giữa D01/D04 và nhóm tổ hợp kỹ thuật."
  },
  {
    id: "SOICT25", shortLabel: "SoICT25",
    title: "Điểm chuẩn 2025 của 7 chương trình CNTT",
    publisher: "Trường CNTT và Truyền thông · HUST",
    url: "https://soict.hust.edu.vn/diem-chuan-tham-khao.html",
    cycle: "Tuyển sinh 2025", publishedAt: "Cập nhật 09/03/2026", verifiedAt: "27/09/2026", status: "Archived",
    fields: ["THPT và tổ hợp", "TSA", "XTTN diện 1.3"],
    note: "Chỉ lấy cột năm 2025 trong ba bảng điểm trúng tuyển THPT, Đánh giá tư duy và XTTN diện 1.3."
  },
  {
    id: "SMSE25", shortLabel: "SMSE25",
    title: "Điểm chuẩn 2025 của 6 chương trình vật liệu",
    publisher: "Trường Vật liệu · HUST",
    url: "https://smse.hust.edu.vn/vi/tuyen-sinh/tuyen-sinh-truong-vat-lieu/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026-12.html",
    cycle: "Tuyển sinh 2025", publishedAt: "Trang cập nhật cho 2026", verifiedAt: "27/09/2026", status: "Archived",
    fields: ["THPT", "TSA", "Tổ hợp tuyển sinh 2025"],
    note: "Chỉ lấy cột năm 2025 của bảng điểm trúng tuyển ba năm gần đây. K00 là bài thi TSA, không phải tổ hợp THPT."
  },
  {
    id: "HUSTH25", shortLabel: "HUST-H25",
    title: "HUST: bảng kết quả tuyển sinh năm 2025",
    publisher: "Đại học Bách khoa Hà Nội",
    url: "https://hust.edu.vn/uploads/sys/tuyen-sinh/2023_06/thong-tin-tuyen-sinh-dai-hoc-2026.pdf",
    cycle: "Tuyển sinh 2025", publishedAt: "03/06/2026", verifiedAt: "27/09/2026", status: "Archived",
    fields: ["Cột điểm trúng tuyển năm 2025", "THPT /30", "ĐGTD /100"],
    note: "Dữ liệu 2025 được công bố lại trong tài liệu tuyển sinh 2026, trang 28–34. Không sử dụng cột 2024 hoặc điểm XTTN chưa tách diện."
  },
  {
    id: "HUSTHF25", shortLabel: "HUST-F25",
    title: "HUST: kết quả 2025 trong tài liệu tuyển sinh chính thức",
    publisher: "Đại học Bách khoa Hà Nội",
    url: "https://hust.edu.vn/uploads/sys/tuyen-sinh/2023_06/thong-tin-tuyen-sinh-dai-hoc-2026f.pdf",
    cycle: "Tuyển sinh 2025", publishedAt: "03/06/2026", verifiedAt: "27/09/2026", status: "Archived",
    fields: ["Cột điểm trúng tuyển năm 2025", "THPT /30", "ĐGTD /100"],
    note: "Dùng cột năm 2025 tại trang 32, 35 và 37; tài liệu kèm Quyết định 5788/QĐ-ĐHBK. Mốc THPT của FL3 được đối chiếu với thông báo 22/08/2025."
  }
];

const methods = [
  { key: "thpt", id: "hust-thpt", label: "THPT", scale: 30 },
  { key: "tsa", id: "hust-tsa", label: "Đánh giá tư duy (TSA)", scale: 100 },
  { key: "xttn13", id: "hust-xttn-13", label: "XTTN 1.3 · Hồ sơ và phỏng vấn", scale: 100 }
] as const;

export const hustBenchmarks = [...computing, ...materials, ...historical, ...historicalFinal, ...announcement]
  .flatMap((item) => methods.flatMap((method) => {
    const score = item[method.key];
    if (score === undefined) return [];
    const note = method.key === "thpt"
      ? `Điểm xét tuyển THPT năm 2025, gồm ưu tiên theo quy định HUST. ${item.groupNote ?? (item.subjectGroups?.length ? "Áp dụng các tổ hợp được ghi kèm." : "Bảng lịch sử không nêu tổ hợp; xem thông báo HUST để chọn đúng mốc theo tổ hợp.")}`
      : method.key === "tsa"
        ? "Điểm xét tuyển TSA năm 2025, gồm điểm ưu tiên và điểm thưởng theo quy định HUST."
        : "Điểm xét tuyển tài năng diện 1.3 năm 2025: hồ sơ năng lực kết hợp phỏng vấn, gồm ưu tiên theo quy định HUST.";
    return [{
      id: `hust-${item.code.toLowerCase()}-${method.key}-2025`,
      universityId: "hust", university: "Đại học Bách khoa Hà Nội",
      programId: item.code, program: item.program, code: item.code, campus: "Hà Nội", categoryIds: item.categoryIds,
      methodId: method.id, methodLabel: method.label,
      subjectGroups: method.key === "thpt" ? item.subjectGroups ?? [] : method.key === "tsa" ? ["K00"] : [],
      admissionRound: "Đợt 1", score, scale: method.scale, cycle: "2025", sourceId: item.sourceId,
      note: item.coverageNote ? `${note} ${item.coverageNote}` : note
    }];
  }));
