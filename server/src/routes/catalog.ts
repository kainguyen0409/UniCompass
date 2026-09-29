import { Router } from "express";
import { categories, universities } from "../data/catalog.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ universities, categories });
});

export default router;
