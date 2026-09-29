// Progress route (requires authentication)
// GET  /api/progress — get saved tasks, interests, and earlier score entries
// PUT  /api/progress — update only the supplied fields

import { Router } from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validateProgressUpdate } from "../lib/validation.js";
import { emptyInterests } from "../data/catalog.js";

const router = Router();

// All progress routes require a valid JWT
router.use(requireAuth);

// GET /api/progress
router.get("/", async (req, res) => {
  try {
    // A user without a progress row still gets an empty starting point.
    const result = await pool.query(
      `SELECT completed_task_ids, scores_thpt, scores_hsa, scores_sat, interests
       FROM users LEFT JOIN user_progress ON users.id = user_progress.user_id
       WHERE users.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Tài khoản không còn tồn tại. Bạn đăng nhập lại nhé." });
      return;
    }

    // Translate database columns into the shape used by the client. PostgreSQL numeric
    // values arrive as strings, so convert the THPT score back to a number here.
    const row = result.rows[0];
    res.json({
      completedTaskIds: row.completed_task_ids || [],
      interests: row.interests ?? emptyInterests(),
      scores: {
        thpt: parseFloat(row.scores_thpt) || 0,
        hsa: row.scores_hsa || 0,
        sat: row.scores_sat || 0
      }
    });
  } catch (err) {
    console.error("Get progress error:", err);
    res.status(500).json({ error: "Chưa tải được tiến độ. Bạn thử lại nhé." });
  }
});

// PUT /api/progress
router.put("/", async (req, res) => {
  const validated = validateProgressUpdate(req.body);
  if (validated.error) {
    res.status(400).json({ error: validated.error });
    return;
  }
  const { completedTaskIds, scores, interests } = validated.value!;

  try {
    // Validation checks the ID format; this query also checks that the tasks still exist.
    // An empty list needs no lookup because it simply clears all completed tasks.
    if (completedTaskIds?.length) {
      const milestones = await pool.query("SELECT id FROM milestones WHERE id = ANY($1::text[])", [completedTaskIds]);
      if (milestones.rows.length !== completedTaskIds.length) {
        res.status(400).json({ error: "Có việc không còn trong lộ trình. Bạn tải lại trang nhé." });
        return;
      }
    }

    // One atomic statement handles first saves and preserves omitted fields.
    // Read each existing value during the upsert, not in a separate query.
    // For a new row, missing fields start empty. For an existing row, COALESCE keeps
    // the old value when its input is null; explicit zeroes and empty arrays replace it.
    const result = await pool.query(
      `INSERT INTO user_progress (user_id, completed_task_ids, scores_thpt, scores_hsa, scores_sat, interests)
       SELECT id, COALESCE($2::text[], '{}'), COALESCE($3::numeric, 0),
              COALESCE($4::integer, 0), COALESCE($5::integer, 0),
              COALESCE($6::jsonb, '{"universityIds":[],"categoryIds":[]}')
       FROM users WHERE id = $1
       ON CONFLICT (user_id) DO UPDATE SET
         completed_task_ids = COALESCE($2::text[], user_progress.completed_task_ids),
         scores_thpt = COALESCE($3::numeric, user_progress.scores_thpt),
         scores_hsa = COALESCE($4::integer, user_progress.scores_hsa),
         scores_sat = COALESCE($5::integer, user_progress.scores_sat),
         interests = COALESCE($6::jsonb, user_progress.interests),
         updated_at = NOW()
       RETURNING user_id`,
      [
        req.userId,
        completedTaskIds ?? null,
        scores?.thpt ?? null,
        scores?.hsa ?? null,
        scores?.sat ?? null,
        interests ? JSON.stringify(interests) : null
      ]
    );

    // INSERT selects from users, so no returned row means the account no longer exists.
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Tài khoản không còn tồn tại. Bạn đăng nhập lại nhé." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Update progress error:", err);
    res.status(500).json({ error: "Chưa lưu được tiến độ. Bạn thử lại nhé." });
  }
});

export default router;
