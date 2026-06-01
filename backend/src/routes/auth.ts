import { Router } from "express";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTP } from "../utils/brevo";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

// Helper to generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "Missing fields" });

  let user = await prisma.profile.findUnique({ where: { email } });
  
  if (user) {
    return res.status(400).json({ error: "Email already taken" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  
  user = await prisma.profile.create({
    data: {
      full_name: name,
      email,
      password_hash,
      role: "STUDENT"
    }
  });

  // Generate and send OTP
  const otp = generateOTP();
  const expires_at = new Date(Date.now() + 10 * 60000); // 10 mins
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Instantly delete any old OTPs for this email to prevent clutter
  await prisma.otp.deleteMany({ where: { email } });

  await prisma.otp.create({
    data: { email, code: hashedOtp, purpose: "SIGNUP", expires_at }
  });

  await sendOTP(email, otp);

  res.json({ success: true, message: "Signup successful, please verify email." });
});

router.post("/send-otp", async (req, res) => {
  const { email, type = "SIGNUP" } = req.body;
  
  const otp = generateOTP();
  const expires_at = new Date(Date.now() + 10 * 60000);
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Instantly delete any old OTPs for this email to prevent clutter
  await prisma.otp.deleteMany({ where: { email } });

  await prisma.otp.create({
    data: { email, code: hashedOtp, purpose: type, expires_at }
  });

  await sendOTP(email, otp);
  res.json({ success: true });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp, type = "SIGNUP" } = req.body;

  const validOtp = await prisma.otp.findFirst({
    where: { email, purpose: type, is_used: false, expires_at: { gt: new Date() } },
    orderBy: { created_at: 'desc' }
  });

  if (!validOtp) return res.status(400).json({ error: "Invalid or expired OTP" });

  const isMatch = await bcrypt.compare(otp, validOtp.code);
  if (!isMatch) return res.status(400).json({ error: "Invalid or expired OTP" });

  // Instantly delete the OTP upon successful use instead of keeping it
  await prisma.otp.delete({
    where: { id: validOtp.id }
  });

  let user = await prisma.profile.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!(user as any).is_verified) {
    user = await prisma.profile.update({
      where: { id: user.id },
      data: { is_verified: true } as any
    });
  }

  // Issue JWT
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ success: true, token, user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.profile.findUnique({ where: { email } });
  if (!user || !user.password_hash) return res.status(400).json({ error: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

  if (!(user as any).is_verified) {
    return res.status(403).json({ 
      error: "Email not verified.", 
      code: "email_not_confirmed" 
    });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ success: true, token, user });
});

router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: "Missing fields" });

  const validOtp = await prisma.otp.findFirst({
    where: { email, purpose: "RESET_PASSWORD", is_used: false, expires_at: { gt: new Date() } },
    orderBy: { created_at: 'desc' }
  });

  if (!validOtp) return res.status(400).json({ error: "Invalid or expired OTP" });

  const isMatch = await bcrypt.compare(otp, validOtp.code);
  if (!isMatch) return res.status(400).json({ error: "Invalid or expired OTP" });

  const password_hash = await bcrypt.hash(newPassword, 10);
  await prisma.profile.update({
    where: { email },
    data: { password_hash }
  });

  // Instantly delete the OTP upon successful use
  await prisma.otp.delete({
    where: { id: validOtp.id }
  });

  res.json({ success: true, message: "Password updated successfully" });
});

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

router.get("/me", authenticateToken, async (req: any, res) => {
  const user = await prisma.profile.findUnique({ where: { id: req.user.id } });
  res.json({ user });
});

export default router;
