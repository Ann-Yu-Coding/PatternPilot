import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Fail closed when ADMIN_SECRET is absent; never put credentials in URLs. */
export const requireAdmin: RequestHandler = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  const expected = process.env.ADMIN_SECRET;
  const authorization = req.get("authorization") || "";
  const supplied = /^Bearer (.+)$/i.exec(authorization)?.[1];
  if (
    !expected?.trim() ||
    !supplied ||
    !timingSafeEqual(digest(supplied), digest(expected))
  ) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
};
