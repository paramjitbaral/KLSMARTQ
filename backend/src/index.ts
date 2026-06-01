import "express-async-errors";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow frontend access
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

export const broadcast = (event: string, payload: any) => {
  io.emit(event, payload);
};

// Routes
import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import adminRouter from "./routes/admin";

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Background Jobs
setInterval(async () => {
  try {
    const { count } = await prisma.otp.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
    if (count > 0) {
      console.log(`[Job] Cleaned up ${count} expired OTP(s) from database`);
    }
  } catch (err) {
    console.error("[Job] Error cleaning up expired OTPs:", err);
  }
}, 5 * 60 * 1000); // Runs every 5 minutes
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
