// Sources route
// GET /api/sources — list all sources
// GET /api/sources/:id — get a single source

import { Router } from "express";
import pool from "../db.js";
import { benchmarkSources } from "../data/admissions2025.js";

const router = Router();

// Helper to convert a DB row to the frontend's camelCase format
function toSource(row: Record<string, unknown>) {
  return {
    id: row.id,
    shortLabel: row.short_label,
    title: row.title,
    publisher: row.publisher,
    url: row.url,
    cycle: row.cycle,
    publishedAt: row.published_at,
    verifiedAt: row.verified_at,
    status: row.status,
    fields: row.fields,
    note: row.note
  };
}

router.get("/", async (_req, res) => {
  try {
    // Old floor/conversion records may remain after an upgrade. Show only the
    // sources used by the current roadmap or sourced final-cutoff browser.
    const result = await pool.query(`
      SELECT * FROM sources WHERE id IN (
        SELECT unnest(source_ids) FROM milestones
        UNION
        SELECT source_id FROM benchmarks
        WHERE benchmark_type = 'Final cutoff' AND method_id IS NOT NULL
        UNION
        SELECT unnest($1::text[])
      ) ORDER BY id
    `, [benchmarkSources.map((source) => source.id)]);
    res.json(result.rows.map(toSource));
  } catch (err) {
    console.error("Sources error:", err);
    res.status(500).json({ error: "Chưa tải được nguồn dữ liệu. Bạn thử lại nhé." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sources WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Không tìm thấy nguồn này." });
      return;
    }
    res.json(toSource(result.rows[0]));
  } catch (err) {
    console.error("Source detail error:", err);
    res.status(500).json({ error: "Chưa tải được nguồn dữ liệu. Bạn thử lại nhé." });
  }
});

export default router;
