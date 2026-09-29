// JWT authentication middleware
// Extracts the user ID from the Authorization header and attaches it to the request.

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lo-trinh-dev-secret";

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error("Set JWT_SECRET to a private random value of at least 32 characters before starting production.");
}

export { JWT_SECRET };

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Bạn đăng nhập lại để tiếp tục nhé." });
    return;
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "string" || !Number.isInteger(payload.userId) || payload.userId < 1) {
      res.status(401).json({ error: "Phiên đăng nhập không hợp lệ. Bạn đăng nhập lại nhé." });
      return;
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Phiên đăng nhập đã hết. Bạn đăng nhập lại nhé." });
  }
}
