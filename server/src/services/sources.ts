import pool from "../db.js";
import { benchmarkSources } from "../data/admissions2025.js";
export function toSource(row: Record<string, unknown>) {
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

export async function readSources() {
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
return result.rows.map(toSource);
}
