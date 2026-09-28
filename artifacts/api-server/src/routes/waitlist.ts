import { Router } from "express";
import { db, waitlistTable } from "@workspace/db";
const router = Router();
router.post("/waitlist", async (req, res) => {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  try {
    await db.insert(waitlistTable).values({ email }).onConflictDoNothing();
    res.status(201).json({ saved: true });
  } catch {
    res.status(503).json({ error: "Waitlist unavailable" });
  }
});
export default router;
