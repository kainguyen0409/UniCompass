// Auth routes: register, login, and me
// Returns a JWT that the frontend stores and sends with progress requests.

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { JWT_SECRET, requireAuth } from "../middleware/auth.js";
import { validateCredentials, validateRegistration } from "../lib/validation.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const validated = validateRegistration(req.body);
  if (validated.error) {
    res.status(400).json({ error: validated.error });
    return;
  }
  const { email, password, name, grade, interests } = validated.value!;

  try {
    // LOWER also finds older accounts created with uppercase letters.
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email đã được đăng ký" });
      return;
    }

    // Store a one-way password hash. Login compares against it without recovering the password.
    const hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      // Save the account and its initial interests together; either both succeed or neither does.
      await client.query("BEGIN");
      const result = await client.query(
        "INSERT INTO users (email, password_hash, name, grade) VALUES ($1, $2, $3, $4) RETURNING id, name, grade",
        [email, hash, name, grade]
      );
      const user = result.rows[0];
      await client.query("INSERT INTO user_progress (user_id, interests) VALUES ($1, $2::jsonb)", [user.id, JSON.stringify(interests)]);
      // The token identifies this account on later requests. Send it only after the save commits.
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      await client.query("COMMIT");
      res.status(201).json({ token, user: { id: user.id, name: user.name, grade: user.grade } });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    // Two signups can pass the email check at once; the unique constraint catches the second.
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Email đã được đăng ký" });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Chưa tạo được tài khoản. Bạn thử lại nhé." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const validated = validateCredentials(req.body);
  if (validated.error) {
    res.status(400).json({ error: validated.error });
    return;
  }
  const { email, password } = validated.value!;

  try {
    const result = await pool.query(
      "SELECT id, password_hash, name, grade FROM users WHERE LOWER(email) = $1",
      [email]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
      return;
    }

    const user = result.rows[0];
    // Use the same error for a missing email and a wrong password so login doesn't reveal accounts.
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, grade: user.grade } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Chưa đăng nhập được. Bạn thử lại nhé." });
  }
});

// GET /api/auth/me — return current user info from the token
router.get("/me", requireAuth, async (req, res) => {
  try {
    // Read current profile details from the database; the token only contains the user ID.
    const result = await pool.query(
      "SELECT id, name, grade FROM users WHERE id = $1",
      [req.userId]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Tài khoản không còn tồn tại. Bạn đăng nhập lại nhé." });
      return;
    }
    const user = result.rows[0];
    res.json({ id: user.id, name: user.name, grade: user.grade });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Chưa tải được tài khoản. Bạn thử lại nhé." });
  }
});

export default router;
