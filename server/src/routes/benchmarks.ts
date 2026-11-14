// Benchmarks route
// GET /api/benchmarks — sourced final cutoffs, filtered by interests in the client

import { Router } from "express";
import { readBenchmarks } from "../services/benchmarks.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const benchmarks = await readBenchmarks();
    res.json(benchmarks);
  } catch (err) {
    console.error("Benchmarks error:", err);
    res.status(500).json({ error: "Chưa tải được điểm chuẩn. Bạn thử lại nhé." });
  }
});

export default router;
