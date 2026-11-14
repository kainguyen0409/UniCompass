// Milestones route
// GET /api/milestones — returns all milestones, optionally filtered by route

import { Router } from "express";
import { readMilestones } from "../services/milestones.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const route = req.query.route;
    if (route !== undefined && (typeof route !== "string" || !["all", "thpt", "hsa", "sat"].includes(route))) {
      res.status(400).json({ error: "Phương thức xét tuyển không hợp lệ." });
      return;
    }

    const milestones = await readMilestones(route as string | undefined);
    res.json(milestones);
  } catch (err) {
    console.error("Milestones error:", err);
    res.status(500).json({ error: "Chưa tải được lộ trình. Bạn thử lại nhé." });
  }
});

export default router;
