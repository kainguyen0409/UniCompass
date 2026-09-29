// Seed script — populates the database with demo data
// Run with: npm run seed (from the server directory)

import pool from "./db.js";
import { benchmarkSources, benchmarks, validateCutoffData } from "./data/admissions2025.js";

async function seed() {
  // Check the bundled cutoff records before opening a transaction or changing any data.
  validateCutoffData();
  const db = await pool.connect();
  try {
    // Commit the whole import together so a failed row cannot leave a half-loaded dataset.
    await db.query("BEGIN");
    console.log("Seeding database...");

    // Routes
    await db.query(`
      INSERT INTO routes (id, label, detail, scale) VALUES
        ('thpt', 'Điểm thi THPT', 'A00 · thang 30', 30),
        ('hsa', 'HSA · ĐHQGHN', 'Đánh giá năng lực · thang 150', 150),
        ('sat', 'SAT · College Board', 'Chứng chỉ quốc tế · thang 1.600', 1600)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("  ✓ Routes");

    // Source dates describe the archived cycle, not the current admissions year.
    const sources = [{
      id: "S1", shortLabel: "S1",
      title: "Kế hoạch triển khai công tác tuyển sinh đại học, cao đẳng năm 2025",
      publisher: "Bộ Giáo dục và Đào tạo",
      url: "https://tuyensinh.moet.gov.vn/ts/van-ban/ban-hanh-ke-hoach-trien-khai-cong-tac-tuyen-sinh-dai-hoc-tuyen-sinh-cao-dang-nam-2025--fdd9922e-4755-46de-84aa-4329ef922335",
      cycle: "Tuyển sinh 2025", publishedAt: "19/05/2025", verifiedAt: "25/09/2026", status: "Archived",
      fields: ["Lịch tuyển sinh quốc gia", "Mốc nộp hồ sơ", "Xác nhận nhập học"],
      note: "Lịch tuyển sinh 2025, dùng để trải nghiệm lộ trình trong bản demo."
    }, ...benchmarkSources];
    // Re-running the seed refreshes source details under the same IDs used by the app.
    for (const source of sources) {
      await db.query(`
        INSERT INTO sources (id, short_label, title, publisher, url, cycle, published_at, verified_at, status, fields, note)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET short_label=EXCLUDED.short_label, title=EXCLUDED.title,
          publisher=EXCLUDED.publisher, url=EXCLUDED.url, cycle=EXCLUDED.cycle,
          published_at=EXCLUDED.published_at, verified_at=EXCLUDED.verified_at,
          status=EXCLUDED.status, fields=EXCLUDED.fields, note=EXCLUDED.note
      `, [source.id, source.shortLabel, source.title, source.publisher, source.url, source.cycle,
          source.publishedAt, source.verifiedAt, source.status, source.fields, source.note]);
    }
    console.log("  ✓ Sources");

    // Keep milestone IDs stable: user progress refers to these IDs to remember completed tasks.
    await db.query(`
      INSERT INTO milestones (id, phase, title, plain_language, display_date, route_ids, source_ids, checklist, status, sort_order) VALUES
        ('profile-review', 'Chuẩn bị', 'Rà soát học bạ và thông tin ưu tiên',
         'Kiểm tra học bạ và thông tin ưu tiên trên hệ thống.',
         'Trước 17:00 · 06/06/2025',
         ARRAY['thpt','hsa','sat'], ARRAY['S1'],
         ARRAY['Kiểm tra điểm học bạ','Kiểm tra khu vực ưu tiên','Báo lỗi cho trường nếu cần'],
         'complete', 1),
        ('priority-admission', 'Chuẩn bị', 'Nộp hồ sơ xét tuyển thẳng / ưu tiên',
         'Chỉ cần làm nếu bạn thuộc diện xét tuyển thẳng hoặc ưu tiên.',
         'Trước 17:00 · 30/06/2025',
         ARRAY['thpt','hsa','sat'], ARRAY['S1'],
         ARRAY['Xác nhận diện đủ điều kiện','Chuẩn bị minh chứng','Nộp đúng trường'],
         'complete', 2),
        ('preference-registration', 'Đăng ký', 'Xếp và đăng ký nguyện vọng',
         'Xếp ngành bạn muốn học nhất lên đầu.',
         '16/07 — 17:00 · 28/07/2025',
         ARRAY['thpt','hsa','sat'], ARRAY['S1'],
         ARRAY['Chọn ngành / chương trình','Kiểm tra điều kiện từng phương thức','Sắp thứ tự nguyện vọng'],
         'next', 3),
        ('admission-fee', 'Hoàn tất', 'Nộp lệ phí xét tuyển trực tuyến',
         'Nguyện vọng chỉ được xử lý sau khi thanh toán thành công.',
         '29/07 — 17:00 · 05/08/2025',
         ARRAY['thpt','hsa','sat'], ARRAY['S1'],
         ARRAY['Kiểm tra số nguyện vọng','Thanh toán','Lưu xác nhận giao dịch'],
         'later', 4),
        ('admission-result', 'Kết quả', 'Tra cứu kết quả trúng tuyển',
         'Chỉ một nguyện vọng cao nhất đủ điều kiện sẽ được xác nhận.',
         'Công bố theo lịch Bộ GD&ĐT · 08/2025',
         ARRAY['thpt','hsa','sat'], ARRAY['S1'],
         ARRAY['Đăng nhập hệ thống','Kiểm tra kết quả','Đọc hướng dẫn của trường'],
         'later', 5),
        ('enrolment-confirmation', 'Xác nhận', 'Xác nhận nhập học trực tuyến',
         'Xác nhận trên hệ thống để nhận chỗ trúng tuyển.',
         'Trước 17:00 · 30/08/2025',
         ARRAY['thpt','hsa','sat'], ARRAY['S1'],
         ARRAY['Xác nhận nhập học','Lưu biên nhận','Theo dõi hướng dẫn nhập học của trường'],
         'later', 6)
      ON CONFLICT (id) DO UPDATE SET
        phase = EXCLUDED.phase,
        title = EXCLUDED.title,
        plain_language = EXCLUDED.plain_language,
        display_date = EXCLUDED.display_date,
        route_ids = EXCLUDED.route_ids,
        source_ids = EXCLUDED.source_ids,
        checklist = EXCLUDED.checklist,
        status = EXCLUDED.status,
        sort_order = EXCLUDED.sort_order
    `);
    console.log("  ✓ Milestones");

    // Each university owns its method labels and scales. No conversion is run here.
    for (const item of benchmarks) {
      await db.query(`
        INSERT INTO benchmarks (id, university, program, code, route, score, scale, benchmark_type,
          cycle, source_id, note, comparable, university_id, program_id, campus, category_ids,
          method_id, method_label, subject_groups, admission_round)
        VALUES ($1,$2,$3,$4,NULL,$5,$6,'Final cutoff',$7,$8,$9,false,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO UPDATE SET university=EXCLUDED.university, program=EXCLUDED.program,
          code=EXCLUDED.code, route=NULL, score=EXCLUDED.score, scale=EXCLUDED.scale,
          benchmark_type=EXCLUDED.benchmark_type, cycle=EXCLUDED.cycle, source_id=EXCLUDED.source_id,
          note=EXCLUDED.note, comparable=false, university_id=EXCLUDED.university_id,
          program_id=EXCLUDED.program_id, campus=EXCLUDED.campus, category_ids=EXCLUDED.category_ids,
          method_id=EXCLUDED.method_id, method_label=EXCLUDED.method_label,
          subject_groups=EXCLUDED.subject_groups, admission_round=EXCLUDED.admission_round
      `, [item.id, item.university, item.program, item.code, item.score, item.scale, item.cycle,
          item.sourceId, item.note, item.universityId, item.programId, item.campus, item.categoryIds,
          item.methodId, item.methodLabel, item.subjectGroups, item.admissionRound]);
    }
    console.log(`  ✓ ${benchmarks.length} final cutoff records`);
    await db.query("COMMIT");

    console.log("Done! Database seeded successfully.");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    // Release the connection and close the pool so this standalone script can exit.
    db.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
