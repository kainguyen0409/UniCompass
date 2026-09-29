// Benchmarks route
// GET /api/benchmarks — sourced final cutoffs, filtered by interests in the client

import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM benchmarks
      WHERE benchmark_type = 'Final cutoff'
        AND university_id IS NOT NULL AND university_id <> ''
        AND program_id IS NOT NULL AND program_id <> ''
        AND method_id IS NOT NULL AND method_id <> ''
        AND method_label IS NOT NULL AND method_label <> ''
        AND admission_round IS NOT NULL AND admission_round <> ''
        AND cardinality(category_ids) > 0
        AND source_id IS NOT NULL AND scale > 0
      ORDER BY university_id, program, campus, method_id, id
    `);

    // Convert snake_case to camelCase
    const benchmarks = result.rows.map((row) => ({
      id: row.id,
      university: row.university,
      universityId: row.university_id,
      program: row.program,
      programId: row.program_id,
      code: row.code,
      campus: row.campus,
      categoryIds: row.category_ids,
      methodId: row.method_id,
      methodLabel: row.method_label,
      subjectGroups: row.subject_groups,
      admissionRound: row.admission_round,
      score: parseFloat(row.score),
      scale: row.scale,
      cycle: row.cycle,
      sourceId: row.source_id,
      note: row.note
    }));

    res.json(benchmarks);
  } catch (err) {
    console.error("Benchmarks error:", err);
    res.status(500).json({ error: "Chưa tải được điểm chuẩn. Bạn thử lại nhé." });
  }
});

export default router;
