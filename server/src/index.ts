// Express API server for Lộ Trình Đại Học
// Run with: npx tsx src/index.ts (or npm run dev for watch mode)

import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pool from "./db.js";
import authRouter from "./routes/auth.js";
import milestonesRouter from "./routes/milestones.js";
import benchmarksRouter from "./routes/benchmarks.js";
import sourcesRouter from "./routes/sources.js";
import progressRouter from "./routes/progress.js";
import catalogRouter from "./routes/catalog.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from the Vite dev server
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/milestones", milestonesRouter);
app.use("/api/benchmarks", benchmarksRouter);
app.use("/api/sources", sourcesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/catalog", catalogRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API mistakes should return JSON, including when the frontend is served here.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Không tìm thấy dữ liệu yêu cầu." });
});

if (process.env.NODE_ENV === "production") {
  const clientDirectory = fileURLToPath(new URL("../../client/dist/", import.meta.url));
  const indexFile = path.join(clientDirectory, "index.html");
  if (!existsSync(indexFile)) throw new Error("Run npm run build from the project root first.");
  app.use(express.static(clientDirectory));
  app.get("/{*page}", (_req, res) => { res.sendFile(indexFile); });
}

app.use((error: { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error.status === 400 ? 400 : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ error: status === 400 ? "Dữ liệu gửi lên chưa đúng." : "Có lỗi kết nối. Bạn thử lại nhé." });
});

const server = app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => { void pool.end().then(() => process.exit(0)); });
  });
}
