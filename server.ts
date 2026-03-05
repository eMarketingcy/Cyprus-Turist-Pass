import express from "express";
import { createServer as createViteServer } from "vite";
import authRoutes from "./src/server/routes/auth.js";
import rentalRoutes from "./src/server/routes/rental.js";
import paymentRoutes from "./src/server/routes/payment.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Cyprus Tourism API is running" });
  });

  // Mount feature routes
  app.use("/api/auth", authRoutes);
  app.use("/api/rental", rentalRoutes);
  app.use("/api/payment", paymentRoutes);

  // Vite middleware for development (Serves the React frontend)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
