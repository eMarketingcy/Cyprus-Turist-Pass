import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import authRoutes from "./src/server/routes/auth.js";
import rentalRoutes from "./src/server/routes/rental.js";
import paymentRoutes from "./src/server/routes/payment.js";
import merchantRoutes from "./src/server/routes/merchants.js";
import adminRoutes from "./src/server/routes/admin.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Cyprus Tourism API is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/rental", rentalRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/merchants", merchantRoutes);
  app.use("/api/admin", adminRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
