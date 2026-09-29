// Transcribed from FTU's final 2025 cutoff notice, tables 1–5.
// All scores below are published values; no score conversions are calculated here.
// See docs/data-ftu-2025.md for source pages, scope and exclusions.
type Program = [code: string, name: string, campus: string, categories: string[]];
type CombinedProgram = [...Program, score: number];
type StandardProgram = [...Program, thpt: number, hsa: number, vact: number];

const combinedPrograms: CombinedProgram[] = [
  // Table 1: advanced and high-quality programs, PT2 / group 2.2.
  ["KTEH4_1", "Kinh tế đối ngoại (tiên tiến)", "Hà Nội", ["economics"], 28.5],
  ["KTEH2_1", "Kinh tế đối ngoại (chất lượng cao)", "Hà Nội", ["economics"], 27.5],
  ["KTQH2_1", "Kinh tế quốc tế (chất lượng cao)", "Hà Nội", ["economics"], 26.4],
  ["KDQH4_1", "Kinh doanh quốc tế và Phân tích dữ liệu kinh doanh (tiên tiến i-Hons, hợp tác Đại học Queensland)", "Hà Nội", ["business", "computing"], 28],
  ["KDQH2_1", "Kinh doanh quốc tế (chất lượng cao)", "Hà Nội", ["business"], 27.5],
  ["QTKH4_1", "Quản trị kinh doanh (tiên tiến)", "Hà Nội", ["business"], 25.5],
  ["QTKH2_1", "Quản trị kinh doanh (chất lượng cao)", "Hà Nội", ["business"], 25.2],
  ["TCHH4_1", "Tài chính - Ngân hàng (tiên tiến)", "Hà Nội", ["finance"], 27],
  ["TCHH2_1", "Tài chính - Ngân hàng (chất lượng cao)", "Hà Nội", ["finance"], 26],
  ["KTES2_1", "Kinh tế đối ngoại (chất lượng cao)", "TP. Hồ Chí Minh", ["economics"], 26.35],
  ["QTKS2_1", "Quản trị kinh doanh (chất lượng cao)", "TP. Hồ Chí Minh", ["business"], 25.65],
  // The final notice prints a dot in this code; preserve the source spelling.
  ["TCHS2.1", "Tài chính - Ngân hàng (chất lượng cao)", "TP. Hồ Chí Minh", ["finance"], 26.2],
  // Table 4: international career/development-oriented programs, PT2 / group 2.2.
  ["KDQH2_2", "Logistics và Quản lý chuỗi cung ứng (định hướng nghề nghiệp quốc tế)", "Hà Nội", ["logistics"], 27.6],
  ["KDQH2_3", "Kinh doanh quốc tế theo mô hình tiên tiến Nhật Bản", "Hà Nội", ["business"], 26.3],
  ["KDQH2_4", "Kinh doanh số (định hướng nghề nghiệp quốc tế)", "Hà Nội", ["business", "computing"], 26.3],
  ["MKTH2_1", "Marketing số (định hướng nghề nghiệp quốc tế)", "Hà Nội", ["business"], 27.15],
  ["QKSH2_1", "Quản trị khách sạn (định hướng nghề nghiệp quốc tế)", "Hà Nội", ["business"], 24.2],
  ["KTKH2_1", "Kế toán - Kiểm toán theo định hướng ACCA", "Hà Nội", ["accounting"], 25.7],
  ["LAWH2_1", "Luật Kinh doanh quốc tế theo mô hình thực hành nghề nghiệp", "Hà Nội", ["law"], 25],
  ["KTCH2_1", "Kinh tế chính trị quốc tế (định hướng phát triển quốc tế)", "Hà Nội", ["economics"], 24],
  ["KDQS2_1", "Logistics và Quản lý chuỗi cung ứng (định hướng nghề nghiệp quốc tế)", "TP. Hồ Chí Minh", ["logistics"], 28.3],
  ["MKTS2_1", "Truyền thông Marketing tích hợp (định hướng nghề nghiệp quốc tế)", "TP. Hồ Chí Minh", ["business"], 27.5],
];

// Table 2: THPT A00 and the two explicitly published, converted assessment columns.
const standardPrograms: StandardProgram[] = [
  ["KTEH1_1", "Kinh tế đối ngoại (tiêu chuẩn)", "Hà Nội", ["economics"], 27.55, 28.07, 28.44],
  ["KTQH1_1", "Kinh tế quốc tế (tiêu chuẩn)", "Hà Nội", ["economics"], 26.7, 27.79, 28.29],
  ["KDQH1_1", "Kinh doanh quốc tế (tiêu chuẩn)", "Hà Nội", ["business"], 28, 28.2, 28.51],
  ["QTKH1_1", "Quản trị kinh doanh (tiêu chuẩn)", "Hà Nội", ["business"], 25.9, 27.56, 28.23],
  ["TCHH1_1", "Tài chính - Ngân hàng (tiêu chuẩn)", "Hà Nội", ["finance"], 26.36, 27.7, 28.26],
  ["KTKH1_1", "Kế toán - Kiểm toán (tiêu chuẩn)", "Hà Nội", ["accounting"], 26.8, 27.82, 28.3],
  ["LAWH1_1", "Luật thương mại quốc tế (tiêu chuẩn)", "Hà Nội", ["law"], 25.7, 27.48, 28.21],
  ["KTES1_1", "Kinh tế đối ngoại (tiêu chuẩn)", "TP. Hồ Chí Minh", ["economics"], 27.2, 27.96, 28.38],
  ["QTKS1_1", "Quản trị kinh doanh (tiêu chuẩn)", "TP. Hồ Chí Minh", ["business"], 26.75, 27.8, 28.29],
  ["TCHS1_1", "Tài chính - Ngân hàng (tiêu chuẩn)", "TP. Hồ Chí Minh", ["finance"], 27.65, 28.1, 28.46],
  ["KTKS1_1", "Kế toán - Kiểm toán (tiêu chuẩn)", "TP. Hồ Chí Minh", ["accounting"], 26.45, 27.72, 28.27],
  ["KDQQ1_1", "Kinh doanh quốc tế (tiêu chuẩn)", "Quảng Ninh", ["business"], 24, 27, 27],
  ["KTKQ1_1", "Kế toán - Kiểm toán (tiêu chuẩn)", "Quảng Ninh", ["accounting"], 24, 27, 27],
];

// Table 5: languages have their own 40-point scale. Blank cells stay omitted.
const languageStandardPrograms: [code: string, name: string, thpt: number, hsa: number][] = [
  ["NNAH1_1", "Tiếng Anh thương mại (tiêu chuẩn)", 32.4, 36.29],
  ["NNNH1_1", "Tiếng Nhật thương mại (tiêu chuẩn)", 30, 36],
  ["NNTH1_1", "Tiếng Trung thương mại (tiêu chuẩn)", 35.15, 36.77],
  ["NNPH1_1", "Tiếng Pháp thương mại (tích hợp)", 30, 36],
];
const languageCombinedPrograms: [code: string, name: string, subjectGroup: string, score: number][] = [
  ["NNAH2_1", "Tiếng Anh thương mại (chất lượng cao)", "D01", 35.3],
  ["NNNH2_1", "Tiếng Nhật thương mại (chất lượng cao)", "D06", 30],
  ["NNTH2_1", "Tiếng Trung thương mại (chất lượng cao)", "D04", 35],
  ["NNPH1_1", "Tiếng Pháp thương mại (tích hợp)", "D01", 30],
];

export const ftuSources = [{
  id: "FTU25", shortLabel: "FTU25",
  title: "Thông báo ngưỡng điểm trúng tuyển đại học chính quy năm 2025",
  publisher: "Phòng Quản lý đào tạo · Trường Đại học Ngoại thương",
  url: "https://qldt.ftu.edu.vn/thong-bao-nguong-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2025/",
  cycle: "Tuyển sinh 2025", publishedAt: "22/08/2025", verifiedAt: "27/09/2026", status: "Archived",
  fields: ["Điểm chuẩn cuối cùng", "Chương trình và cơ sở", "Phương thức xét tuyển"],
  note: "Thông báo 766/TB-ĐHNT. 77 mốc điểm của 43 chương trình tại Hà Nội, TP. Hồ Chí Minh và Quảng Ninh từ bảng 1–5; chưa bao gồm mọi nhóm đối tượng xét tuyển."
}, {
  id: "FTU25QD", shortLabel: "FTU25 QĐ",
  title: "Quy đổi điểm tương đương giữa các phương thức xét tuyển FTU năm 2025",
  publisher: "Phòng Quản lý đào tạo · Trường Đại học Ngoại thương",
  url: "https://qldt.ftu.edu.vn/thong-bao-quy-doi-diem-tuong-duong-giua-cac-phuong-thuc-xet-tuyen-nhom-doi-tuong-xet-tuyen-dai-hoc-chinh-quy-nam-2025/",
  cycle: "Tuyển sinh 2025", publishedAt: "23/07/2025", verifiedAt: "27/09/2026", status: "Archived",
  fields: ["Thang điểm", "Điểm HSA / V-ACT đã quy đổi", "Tổ hợp gốc"],
  note: "Thông báo 638/TB-ĐHNT ngày 22/07/2025, mục 2.1–2.7. Dùng để xác nhận thang điểm và tổ hợp gốc; ứng dụng không tự quy đổi điểm."
}, {
  id: "FTU25TT", shortLabel: "FTU25 TT",
  title: "Thông tin tuyển sinh đại học chính quy FTU năm 2025",
  publisher: "Phòng Quản lý đào tạo · Trường Đại học Ngoại thương",
  url: "https://qldt.ftu.edu.vn/thong-tin-tuyen-sinh-trinh-do-dai-hoc-hinh-thuc-dao-tao-chinh-quy-nam-2025/",
  cycle: "Tuyển sinh 2025", publishedAt: "08/05/2025", verifiedAt: "27/09/2026", status: "Archived",
  fields: ["Cơ sở đào tạo", "Tổ hợp xét tuyển", "Môn nhân hệ số 2"],
  note: "Quyết định 1646/QĐ-ĐHNT. Phụ lục 2 xác nhận cơ sở Hà Nội cho các chương trình ngôn ngữ và Khoa học máy tính; mục 6.2 xác nhận hệ số môn học."
}];

function base([code, program, campus, categoryIds]: Program) {
  return {
    universityId: "ftu", university: "Đại học Ngoại thương",
    programId: code, program, code, campus, categoryIds,
    admissionRound: "Đợt 1", scale: 30, cycle: "2025", sourceId: "FTU25"
  };
}

export const ftuBenchmarks = [
  ...combinedPrograms.map(([code, program, campus, categoryIds, score]) => ({
    ...base([code, program, campus, categoryIds]),
    id: `ftu-${code.toLowerCase()}-thpt-ccnnqt-2025`,
    methodId: "ftu-thpt-ccnnqt", methodLabel: "THPT + chứng chỉ ngoại ngữ",
    subjectGroups: ["D01"], score,
    note: "PT2, nhóm 2.2: kết hợp 2 môn thi THPT và chứng chỉ ngoại ngữ quốc tế. Điểm xét tuyển thang 30, tổ hợp gốc D01, gồm điểm ưu tiên theo quy định FTU; không phải tổng 3 môn THPT."
  })),
  ...standardPrograms.flatMap(([code, program, campus, categoryIds, thpt, hsa, vact]) => {
    const common = base([code, program, campus, categoryIds]);
    return [{
      ...common, id: `ftu-${code.toLowerCase()}-thpt-2025`,
      methodId: "ftu-thpt", methodLabel: "THPT", subjectGroups: ["A00"], score: thpt,
      note: "PT2, nhóm 2.1: điểm xét tuyển 3 môn THPT theo tổ hợp gốc A00, thang 30, gồm điểm ưu tiên theo quy định FTU. Các tổ hợp khác có mức chênh lệch riêng; xem thông báo gốc."
    }, {
      ...common, id: `ftu-${code.toLowerCase()}-hsa-2025`,
      methodId: "ftu-hsa-converted", methodLabel: "HSA · điểm quy đổi", subjectGroups: [], score: hsa,
      note: "PT3: điểm HSA đã quy đổi sang thang 30 được FTU công bố tại bảng 2. Đây không phải điểm HSA gốc trên thang 150."
    }, {
      ...common, id: `ftu-${code.toLowerCase()}-vact-2025`,
      methodId: "ftu-vact-converted", methodLabel: "V-ACT · điểm quy đổi", subjectGroups: [], score: vact,
      note: "PT3: điểm V-ACT đã quy đổi sang thang 30 được FTU công bố tại bảng 2. Đây không phải điểm bài thi ĐGNL ĐHQG TP. Hồ Chí Minh gốc trên thang 1.200."
    }];
  }),
  ...languageStandardPrograms.flatMap(([code, program, thpt, hsa]) => {
    const common = { ...base([code, program, "Hà Nội", ["languages"]]), scale: 40 };
    return [{
      ...common, id: `ftu-${code.toLowerCase()}-thpt-2025`,
      methodId: "ftu-thpt-language", methodLabel: "THPT · ngoại ngữ hệ số 2", subjectGroups: ["D01"], score: thpt,
      note: "PT2, nhóm 2.1: thang 40, môn ngoại ngữ nhân hệ số 2; tổ hợp gốc D01. Điểm đã gồm ưu tiên theo quy định FTU. Các tổ hợp được nhận của từng chương trình xem thông tin tuyển sinh."
    }, {
      ...common, id: `ftu-${code.toLowerCase()}-hsa-2025`,
      methodId: "ftu-hsa-converted", methodLabel: "HSA · điểm quy đổi", subjectGroups: [], score: hsa,
      note: "PT3: điểm HSA đã quy đổi sang thang 40 được FTU công bố tại bảng 5; không phải điểm HSA gốc trên thang 150. Nhóm ngôn ngữ yêu cầu phần 3 Tiếng Anh của bài HSA theo quy định FTU."
    }];
  }),
  ...languageCombinedPrograms.map(([code, program, subjectGroup, score]) => ({
    ...base([code, program, "Hà Nội", ["languages"]]), scale: 40,
    id: `ftu-${code.toLowerCase()}-thpt-ccnnqt-2025`,
    methodId: "ftu-thpt-ccnnqt", methodLabel: "THPT + chứng chỉ ngoại ngữ", subjectGroups: [subjectGroup], score,
    note: "PT2, nhóm 2.2: Toán + Ngữ văn thi THPT và điểm chứng chỉ ngoại ngữ quốc tế đã quy đổi, phần ngoại ngữ nhân hệ số 2. Thang 40, gồm điểm ưu tiên theo quy định FTU."
  })),
  // Table 3: native scale 40 for this specific program, not a normalized /30 score.
  ...([
    ["thpt", "ftu-thpt-math", "THPT · Toán hệ số 2", ["A00", "A01", "D01", "D07"], 36.4,
      "PT2, nhóm 2.1: thang 40, môn Toán nhân hệ số 2, gồm điểm ưu tiên theo quy định FTU. Trường không áp dụng chênh lệch điểm giữa các tổ hợp cho chương trình này."],
    ["thpt-ccnnqt", "ftu-thpt-ccnnqt", "THPT + chứng chỉ ngoại ngữ", [], 36.59,
      "PT2, nhóm 2.2: kết hợp 2 môn thi THPT và chứng chỉ ngoại ngữ quốc tế đã quy đổi. Thang 40, Toán nhân hệ số 2, gồm điểm ưu tiên theo quy định FTU."],
    ["hsa", "ftu-hsa-converted", "HSA · điểm quy đổi", [], 36.9,
      "PT3: điểm HSA đã quy đổi sang thang 40 được FTU công bố tại bảng 3; không phải điểm HSA gốc trên thang 150."],
    ["vact", "ftu-vact-converted", "V-ACT · điểm quy đổi", [], 37.75,
      "PT3: điểm V-ACT đã quy đổi sang thang 40 được FTU công bố tại bảng 3; không phải điểm bài thi ĐGNL ĐHQG TP. Hồ Chí Minh gốc trên thang 1.200."],
  ] satisfies [string, string, string, string[], number, string][]).map(([id, methodId, methodLabel, subjectGroups, score, note]) => ({
    ...base(["KHMH2_1", "Khoa học máy tính và dữ liệu trong kinh tế và kinh doanh", "Hà Nội", ["computing", "business"]]),
    id: `ftu-khmh2_1-${id}-2025`, scale: 40, methodId, methodLabel, subjectGroups, score, note
  }))
];
