import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { validateRentalContract } from "../services/mockRentalApi.js";

const router = Router();

// POST /api/rental/validate - Validate & link a rental contract
router.post("/validate", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const { contractNumber, agencyName } = req.body;

    if (!contractNumber || !agencyName) {
      return res.status(400).json({ error: "Contract number and agency name are required" });
    }

    // Check if contract already linked to someone else
    const existingContract = await prisma.rentalContract.findUnique({
      where: { contractNumber: contractNumber.trim().toUpperCase() },
      include: { customerProfile: true },
    });

    if (existingContract?.customerProfile && existingContract.customerProfile.userId !== req.user!.userId) {
      return res.status(400).json({ error: "This contract is already linked to another account" });
    }

    // Validate via mock API
    const validationResult = await validateRentalContract(contractNumber, agencyName);

    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error || "Invalid contract number" });
    }

    const data = validationResult.data!;

    // Create or update the contract in DB
    const contract = await prisma.rentalContract.upsert({
      where: { contractNumber: data.contractNumber },
      create: {
        contractNumber: data.contractNumber,
        agencyName: data.agencyName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        vehicleClass: data.vehicleClass,
        isValid: true,
      },
      update: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        vehicleClass: data.vehicleClass,
        isValid: true,
      },
    });

    // Link contract to customer profile
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (customerProfile) {
      await prisma.customerProfile.update({
        where: { id: customerProfile.id },
        data: { activeContractId: contract.id },
      });
    }

    res.json({
      message: "Contract validated successfully",
      data: {
        contractNumber: contract.contractNumber,
        agencyName: contract.agencyName,
        startDate: contract.startDate,
        endDate: contract.endDate,
        vehicleClass: contract.vehicleClass,
      },
    });
  } catch (error) {
    console.error("Rental validation error:", error);
    res.status(500).json({ error: "Internal server error during validation" });
  }
});

// GET /api/rental/status - Check current contract status
router.get("/status", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { contract: true },
    });

    if (!profile?.contract) {
      return res.json({ hasContract: false });
    }

    const now = new Date();
    const isActive = profile.contract.isValid && now >= profile.contract.startDate && now <= profile.contract.endDate;

    res.json({
      hasContract: true,
      isActive,
      contract: {
        contractNumber: profile.contract.contractNumber,
        agencyName: profile.contract.agencyName,
        startDate: profile.contract.startDate,
        endDate: profile.contract.endDate,
        vehicleClass: profile.contract.vehicleClass,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check contract status" });
  }
});

export default router;
