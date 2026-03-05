import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/merchants - List approved merchants (public for authenticated users)
router.get("/", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const { city, type, search } = req.query;

    const where: any = { status: "APPROVED" };
    if (city) where.city = city as string;
    if (type) where.businessType = type as string;
    if (search) {
      where.OR = [
        { businessName: { contains: search as string } },
        { description: { contains: search as string } },
        { address: { contains: search as string } },
      ];
    }

    const merchants = await prisma.merchantProfile.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        businessType: true,
        description: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        discountRate: true,
      },
      orderBy: { discountRate: "desc" },
    });

    res.json({ merchants });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch merchants" });
  }
});

// GET /api/merchants/:id - Get single merchant details
router.get("/:id", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        description: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        discountRate: true,
        status: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    res.json({ merchant });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch merchant" });
  }
});

// PUT /api/merchants/profile - Update own merchant profile
router.put("/profile", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "MERCHANT") {
      return res.status(403).json({ error: "Only merchants can update their profile" });
    }

    const { businessName, description, address, city, discountRate, imageUrl } = req.body;

    // Validate discount rate (minimum 5%)
    if (discountRate !== undefined && (discountRate < 5 || discountRate > 25)) {
      return res.status(400).json({ error: "Discount rate must be between 5% and 25%" });
    }

    const updated = await prisma.merchantProfile.update({
      where: { userId: req.user!.userId },
      data: {
        ...(businessName && { businessName }),
        ...(description !== undefined && { description }),
        ...(address && { address }),
        ...(city && { city }),
        ...(discountRate !== undefined && { discountRate }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    res.json({ message: "Profile updated", merchant: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
