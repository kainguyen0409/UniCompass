// Milestones route
// GET /api/milestones — returns all milestones, optionally filtered by route

import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const route = req.query.route;
    if (route !== undefined && (typeof route !== "string" || !["all", "thpt", "hsa", "sat"].includes(route))) {
      res.status(400).json({ error: "Phương thức xét tuyển không hợp lệ." });
      return;
    }

    let query: string;
    let params: string[];

    if (route && route !== "all") {
      // Filter: only milestones that include this route in their route_ids array
      query = "SELECT * FROM milestones WHERE $1 = ANY(route_ids) ORDER BY sort_order, id";
      params = [route];
    } else {
      query = "SELECT * FROM milestones ORDER BY sort_order, id";
      params = [];
    }

    const result = await pool.query(query, params);

    // Convert snake_case columns to camelCase for the frontend
    const milestones = result.rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      title: row.title,
      plainLanguage: row.plain_language,
      displayDate: row.display_date,
      routeIds: row.route_ids,
      sourceIds: row.source_ids,
      checklist: row.checklist,
      status: row.status
    }));

    res.json(milestones);
  } catch (err) {
    console.error("Milestones error:", err);
    res.status(500).json({ error: "Chưa tải được lộ trình. Bạn thử lại nhé." });
  }
});

export default router;
