import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth.js";

const router = Router();

// All admin routes require ADMIN role
router.use(authMiddleware as any, requireRole("ADMIN") as any);

// GET /api/admin/stats - Platform overview stats
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const [
      totalTransactions,
      completedTransactions,
      activeMerchants,
      pendingMerchants,
      totalCustomers,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.findMany({ where: { status: "COMPLETED" } }),
      prisma.merchantProfile.count({ where: { status: "APPROVED" } }),
      prisma.merchantProfile.count({ where: { status: "PENDING" } }),
      prisma.customerProfile.count(),
    ]);

    const totalVolume = completedTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const totalPlatformRevenue = completedTransactions.reduce((sum, t) => sum + t.platformFee, 0);
    const totalMerchantPayouts = completedTransactions.reduce((sum, t) => sum + t.merchantPayout, 0);

    res.json({
      stats: {
        totalVolume: Number(totalVolume.toFixed(2)),
        totalPlatformRevenue: Number(totalPlatformRevenue.toFixed(2)),
        totalMerchantPayouts: Number(totalMerchantPayouts.toFixed(2)),
        totalTransactions,
        activeMerchants,
        pendingMerchants,
        totalCustomers,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/admin/merchants - List all merchants (with all statuses)
router.get("/merchants", async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;

    const merchants = await prisma.merchantProfile.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ merchants });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch merchants" });
  }
});

// PUT /api/admin/merchants/:id/status - Approve/reject a merchant
router.put("/merchants/:id/status", async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["APPROVED", "REJECTED", "SUSPENDED", "PENDING"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be: " + validStatuses.join(", ") });
    }

    const merchant = await prisma.merchantProfile.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    res.json({ message: `Merchant ${status.toLowerCase()}`, merchant });
  } catch (error) {
    res.status(500).json({ error: "Failed to update merchant status" });
  }
});

// PUT /api/admin/merchants/:id/fee - Set custom platform fee for a merchant
router.put("/merchants/:id/fee", async (req: AuthRequest, res) => {
  try {
    const { platformFeeRate } = req.body;

    if (platformFeeRate < 2 || platformFeeRate > 15) {
      return res.status(400).json({ error: "Platform fee must be between 2% and 15%" });
    }

    const merchant = await prisma.merchantProfile.update({
      where: { id: req.params.id },
      data: { platformFeeRate },
    });

    res.json({ message: "Platform fee updated", merchant });
  } catch (error) {
    res.status(500).json({ error: "Failed to update platform fee" });
  }
});

// GET /api/admin/transactions - All platform transactions
router.get("/transactions", async (req: AuthRequest, res) => {
  try {
    const { limit = "50", offset = "0" } = req.query;

    const transactions = await prisma.transaction.findMany({
      include: {
        merchant: { select: { businessName: true } },
        customer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.transaction.count();

    res.json({ transactions, total });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET /api/admin/settings - Get platform settings
router.get("/settings", async (req: AuthRequest, res) => {
  try {
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: { defaultPlatformFee: 10, minimumDiscountRate: 5, maximumDiscountRate: 25 },
      });
    }
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/admin/settings - Update platform settings
router.put("/settings", async (req: AuthRequest, res) => {
  try {
    const { defaultPlatformFee, minimumDiscountRate, maximumDiscountRate } = req.body;

    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: { defaultPlatformFee: 10, minimumDiscountRate: 5, maximumDiscountRate: 25 },
      });
    }

    const updated = await prisma.platformSettings.update({
      where: { id: settings.id },
      data: {
        ...(defaultPlatformFee !== undefined && { defaultPlatformFee }),
        ...(minimumDiscountRate !== undefined && { minimumDiscountRate }),
        ...(maximumDiscountRate !== undefined && { maximumDiscountRate }),
      },
    });

    res.json({ message: "Settings updated", settings: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// GET /api/admin/customers - List all customers
router.get("/customers", async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customerProfile.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true, createdAt: true } },
        contract: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
    });

    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

export default router;
