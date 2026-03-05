import { Router } from "express";
import { validateRentalContract } from "../services/mockRentalApi.js";

const router = Router();

/**
 * POST /api/rental/validate
 * Validates a car rental contract number.
 * For MVP: Accepts any contract starting with "TEST"
 */
router.post("/validate", async (req, res) => {
  try {
    const { contractNumber, agencyName } = req.body;

    if (!contractNumber || !agencyName) {
      return res.status(400).json({ 
        error: "Contract number and agency name are required" 
      });
    }

    const validationResult = await validateRentalContract(contractNumber, agencyName);

    if (!validationResult.isValid) {
      return res.status(400).json({ 
        error: validationResult.error || "Invalid contract number" 
      });
    }

    res.json({
      message: "Contract validated successfully",
      data: validationResult.data
    });
  } catch (error) {
    console.error("Rental validation error:", error);
    res.status(500).json({ error: "Internal server error during validation" });
  }
});

export default router;
