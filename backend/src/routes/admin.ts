import { Router } from "express";
import { prisma, broadcast } from "../index";
import bcrypt from "bcryptjs";
import { authenticateToken } from "./auth";

const router = Router();

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

router.use(authenticateToken);
router.use(requireAdmin);

// === USERS ===

router.get("/users", async (req, res) => {
  const users = await prisma.profile.findMany();
  res.json({
    data: users.map((u: any) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      universityId: u.university_id,
      role: u.role,
      assignedOfficeIds: u.assigned_office_ids,
    })),
  });
});

router.post("/users", async (req, res) => {
  const { name, email, password, role, assignedOfficeIds } = req.body;
  
  if (!email || !name) return res.status(400).json({ error: "Missing required fields" });
  
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "Email already taken" });
  
  const password_hash = password ? await bcrypt.hash(password, 10) : undefined;
  
  const newUser = await prisma.profile.create({
    data: {
      full_name: name,
      email,
      password_hash,
      role: role || "STAFF",
      assigned_office_ids: assignedOfficeIds || [],
      is_verified: false, // New users need to verify
    }
  });

  const formattedUser = {
    id: newUser.id,
    name: newUser.full_name,
    email: newUser.email,
    universityId: newUser.university_id,
    role: newUser.role,
    assignedOfficeIds: newUser.assigned_office_ids,
  };

  broadcast("user_created", formattedUser);
  res.json(formattedUser);
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role, assignedOfficeIds } = req.body;
  
  const updated = await prisma.profile.update({
    where: { id },
    data: {
      full_name: name,
      role,
      assigned_office_ids: assignedOfficeIds || [],
    }
  });

  const formattedUser = {
    id: updated.id,
    name: updated.full_name,
    email: updated.email,
    universityId: updated.university_id,
    role: updated.role,
    assignedOfficeIds: updated.assigned_office_ids,
  };

  broadcast("user_updated", formattedUser);
  res.json(formattedUser);
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  
  // Clean up references if any, though for simplicity we just delete
  // (In real app, we handle FK constraints)
  await prisma.profile.delete({ where: { id } });
  
  broadcast("user_deleted", id);
  res.json({ success: true });
});

// === OFFICES ===

router.post("/offices", async (req, res) => {
  const { name, prefix, operatingHours, tokenLimit, isActive } = req.body;
  
  const newOffice = await prisma.office.create({
    data: {
      name,
      prefix,
      operating_hours: operatingHours,
      token_limit: tokenLimit,
      is_active: isActive !== undefined ? isActive : true,
    }
  });

  const formattedOffice = {
    id: newOffice.id,
    name: newOffice.name,
    operatingHours: newOffice.operating_hours,
    tokenLimit: newOffice.token_limit,
    isActive: newOffice.is_active,
    prefix: newOffice.prefix,
  };

  broadcast("office_created", formattedOffice);
  res.json(formattedOffice);
});

router.put("/offices/:id", async (req, res) => {
  const { id } = req.params;
  const { name, prefix, operatingHours, tokenLimit, isActive } = req.body;
  
  const updated = await prisma.office.update({
    where: { id },
    data: {
      name,
      prefix,
      operating_hours: operatingHours,
      token_limit: tokenLimit,
      is_active: isActive,
    }
  });

  const formattedOffice = {
    id: updated.id,
    name: updated.name,
    operatingHours: updated.operating_hours,
    tokenLimit: updated.token_limit,
    isActive: updated.is_active,
    prefix: updated.prefix,
  };

  broadcast("office_updated", formattedOffice);
  res.json(formattedOffice);
});

router.delete("/offices/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.office.delete({ where: { id } });
  
  broadcast("office_deleted", id);
  res.json({ success: true });
});

export default router;
