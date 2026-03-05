import { Router } from "express";

const router = Router();

// Mock Transaction Processing (Simulating Stripe Connect)
router.post("/process", async (req, res) => {
  try {
    const { customerCode, merchantId, originalAmount } = req.body;
    
    if (!customerCode || !originalAmount || originalAmount <= 0) {
      return res.status(400).json({ error: "Invalid transaction details" });
    }

    // Mock Merchant Data (In a real app, fetch from Prisma DB using merchantId)
    // Let's assume this is "Ocean View Seafood" with a 15% discount
    const merchantDiscountRate = 15; // 15% discount for tourists
    const platformFeeRate = 10; // 10% platform fee taken from the final paid amount

    // 1. Calculate Discount
    const discountApplied = originalAmount * (merchantDiscountRate / 100);
    const finalAmount = originalAmount - discountApplied;
    
    // 2. Calculate Platform Split (Stripe Connect logic)
    const platformFee = finalAmount * (platformFeeRate / 100);
    const merchantPayout = finalAmount - platformFee;

    // Simulate Stripe API network delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    res.json({
      success: true,
      message: "Payment processed successfully",
      transaction: {
        id: `txn_${Math.random().toString(36).substr(2, 9)}`,
        originalAmount: Number(originalAmount.toFixed(2)),
        discountRate: merchantDiscountRate,
        discountApplied: Number(discountApplied.toFixed(2)),
        finalAmount: Number(finalAmount.toFixed(2)),
        platformFeeRate,
        platformFee: Number(platformFee.toFixed(2)),
        merchantPayout: Number(merchantPayout.toFixed(2)),
        status: "COMPLETED",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
});

export default router;
