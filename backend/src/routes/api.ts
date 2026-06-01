import { Router } from "express";
import { prisma, broadcast } from "../index";
import { authenticateToken } from "./auth";

const router = Router();

// Middleware to ensure user is logged in for all API routes
router.use(authenticateToken);

// ------------------------------------------------------------------
// OFFICES
// ------------------------------------------------------------------
router.get("/offices", async (req, res) => {
  const offices = await prisma.office.findMany();
  res.json(offices);
});

// ------------------------------------------------------------------
// TOKENS
// ------------------------------------------------------------------
router.get("/tokens", async (req: any, res) => {
  const user = req.user;
  
  let tokens;
  if (user.role === "STUDENT") {
    tokens = await prisma.token.findMany({
      where: { student_id: user.id },
      include: { student: { select: { full_name: true, university_id: true } } }
    });
  } else if (user.role === "STAFF") {
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!profile?.assigned_office_ids?.length) {
      return res.json([]);
    }
    tokens = await prisma.token.findMany({
      where: { office_id: { in: profile.assigned_office_ids } },
      include: { student: { select: { full_name: true, university_id: true } } }
    });
  } else {
    tokens = await prisma.token.findMany({
      include: { student: { select: { full_name: true, university_id: true } } }
    });
  }

  res.json(tokens);
});

router.post("/tokens", async (req: any, res) => {
  const { office_id, purpose, priority } = req.body;
  const user = req.user;

  const office = await prisma.office.findUnique({ where: { id: office_id } });
  if (!office) return res.status(404).json({ error: "Office not found" });

  const tokenCount = await prisma.token.count({ where: { office_id } });
  const token_number = `${office.prefix}-${tokenCount + 1}`;

  const token = await prisma.token.create({
    data: {
      student_id: user.id,
      office_id,
      purpose,
      priority,
      token_number,
      status: "WAITING",
    },
    include: { student: { select: { full_name: true, university_id: true } } }
  });

  // Broadcast new token to all connected clients
  broadcast("token_created", token);

  res.json(token);
});

router.put("/tokens/:id", async (req, res) => {
  const { id } = req.params;
  const { status, is_checked_in } = req.body;

  const data: any = {};
  if (status !== undefined) data.status = status;
  if (is_checked_in !== undefined) data.is_checked_in = is_checked_in;

  if (status === "COMPLETED") {
    data.completed_at = new Date();
  } else if (status === "IN_PROGRESS") {
    data.called_at = new Date();
  }

  const token = await prisma.token.update({
    where: { id },
    data,
    include: { student: { select: { full_name: true, university_id: true } } }
  });

  // Broadcast update
  broadcast("token_updated", token);

  res.json(token);
});

// ------------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------------
router.get("/notifications", async (req: any, res) => {
  const notifications = await prisma.notification.findMany({
    where: { user_id: req.user.id }
  });
  res.json(notifications);
});

router.post("/notifications", async (req, res) => {
  const { user_id, message } = req.body;
  const notif = await prisma.notification.create({
    data: { user_id, message }
  });

  broadcast("notification_created", notif);
  res.json(notif);
});

// ------------------------------------------------------------------
// PROFILES / USERS
// ------------------------------------------------------------------
router.get("/users", async (req: any, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const users = await prisma.profile.findMany();
  res.json(users);
});

export default router;
