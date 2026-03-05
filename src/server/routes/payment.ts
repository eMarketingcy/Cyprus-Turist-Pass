import { Router } from "express";
import crypto from "crypto";
import prisma from "../db.js";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/payment/create-qr - Customer generates a QR code for a merchant
router.post("/create-qr", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const { merchantId } = req.body;

    if (!merchantId) {
      return res.status(400).json({ error: "Merchant ID is required" });
    }

    // Verify customer has active contract
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { contract: true },
    });

    if (!profile?.contract) {
      return res.status(400).json({ error: "No active rental contract. Please validate your contract first." });
    }

    const now = new Date();
    if (!profile.contract.isValid || now < profile.contract.startDate || now > profile.contract.endDate) {
      return res.status(400).json({ error: "Your rental contract has expired." });
    }

    // Verify merchant exists and is approved
    const merchant = await prisma.merchantProfile.findUnique({ where: { id: merchantId } });
    if (!merchant || merchant.status !== "APPROVED") {
      return res.status(400).json({ error: "Merchant not found or not approved" });
    }

    // Generate unique QR token (valid for 15 minutes)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.qrToken.create({
      data: {
        token,
        customerId: profile.id,
        merchantId: merchant.id,
        discountRate: merchant.discountRate,
        expiresAt,
      },
    });

    res.json({
      qrToken: token,
      merchantName: merchant.businessName,
      discountRate: merchant.discountRate,
      expiresAt,
    });
  } catch (error) {
    console.error("QR creation error:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// POST /api/payment/validate-qr - Merchant validates a scanned QR code
router.post("/validate-qr", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ error: "QR token is required" });
    }

    const qr = await prisma.qrToken.findUnique({ where: { token: qrToken } });

    if (!qr) {
      return res.status(400).json({ error: "Invalid QR code" });
    }

    if (qr.used) {
      return res.status(400).json({ error: "This QR code has already been used" });
    }

    if (new Date() > qr.expiresAt) {
      return res.status(400).json({ error: "QR code has expired" });
    }

    // Get merchant profile for the logged-in merchant
    const merchantProfile = await prisma.merchantProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!merchantProfile || merchantProfile.id !== qr.merchantId) {
      return res.status(400).json({ error: "This QR code is not for your business" });
    }

    // Get customer info
    const customer = await prisma.customerProfile.findUnique({
      where: { id: qr.customerId },
      include: { user: true },
    });

    res.json({
      valid: true,
      customerName: customer ? `${customer.user.firstName} ${customer.user.lastName}` : "Tourist",
      discountRate: qr.discountRate,
      qrToken: qr.token,
      customerId: qr.customerId,
    });
  } catch (error) {
    console.error("QR validation error:", error);
    res.status(500).json({ error: "Failed to validate QR code" });
  }
});

// POST /api/payment/process - Process a payment (Stripe Connect simulation)
router.post("/process", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const { qrToken, originalAmount } = req.body;

    if (!qrToken || !originalAmount || originalAmount <= 0) {
      return res.status(400).json({ error: "QR token and valid amount are required" });
    }

    // Find and validate QR token
    const qr = await prisma.qrToken.findUnique({ where: { token: qrToken } });
    if (!qr || qr.used || new Date() > qr.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired QR code" });
    }

    // Get merchant
    const merchant = await prisma.merchantProfile.findUnique({ where: { id: qr.merchantId } });
    if (!merchant) {
      return res.status(400).json({ error: "Merchant not found" });
    }

    // Get platform settings for fee calculation
    const settings = await prisma.platformSettings.findFirst();
    const platformFeeRate = merchant.platformFeeRate ?? settings?.defaultPlatformFee ?? 10;

    // Calculate amounts
    const discountRate = qr.discountRate;
    const discountAmount = originalAmount * (discountRate / 100);
    const finalAmount = originalAmount - discountAmount;
    const platformFee = finalAmount * (platformFeeRate / 100);
    const merchantPayout = finalAmount - platformFee;

    // Simulate Stripe API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        customerId: qr.customerId,
        merchantId: qr.merchantId,
        originalAmount,
        discountRate,
        discountAmount: Number(discountAmount.toFixed(2)),
        finalAmount: Number(finalAmount.toFixed(2)),
        platformFeeRate,
        platformFee: Number(platformFee.toFixed(2)),
        merchantPayout: Number(merchantPayout.toFixed(2)),
        status: "COMPLETED",
        stripePaymentId: `pi_${crypto.randomBytes(12).toString("hex")}`,
        qrToken: qr.token,
      },
    });

    // Mark QR token as used
    await prisma.qrToken.update({
      where: { id: qr.id },
      data: { used: true },
    });

    res.json({
      success: true,
      message: "Payment processed successfully",
      transaction: {
        id: transaction.id,
        originalAmount: transaction.originalAmount,
        discountRate: transaction.discountRate,
        discountAmount: transaction.discountAmount,
        finalAmount: transaction.finalAmount,
        platformFeeRate: transaction.platformFeeRate,
        platformFee: transaction.platformFee,
        merchantPayout: transaction.merchantPayout,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
});

// GET /api/payment/transactions - Get transaction history
router.get("/transactions", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { customerProfile: true, merchantProfile: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    let transactions;
    if (user.role === "CUSTOMER" && user.customerProfile) {
      transactions = await prisma.transaction.findMany({
        where: { customerId: user.customerProfile.id },
        include: { merchant: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } else if (user.role === "MERCHANT" && user.merchantProfile) {
      transactions = await prisma.transaction.findMany({
        where: { merchantId: user.merchantProfile.id },
        include: { customer: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } else {
      transactions = [];
    }

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
