import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, businessName, businessType, address, city } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Email, password, first name, and last name are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "MERCHANT" ? "MERCHANT" : "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: userRole,
        ...(userRole === "CUSTOMER"
          ? { customerProfile: { create: {} } }
          : {
              merchantProfile: {
                create: {
                  businessName: businessName || `${firstName}'s Business`,
                  businessType: businessType || "RESTAURANT",
                  address: address || "Cyprus",
                  city: city || "Paphos",
                },
              },
            }),
      },
      include: {
        customerProfile: true,
        merchantProfile: true,
      },
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileId: user.customerProfile?.id || user.merchantProfile?.id,
        merchantStatus: user.merchantProfile?.status,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: { include: { contract: true } },
        merchantProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileId: user.customerProfile?.id || user.merchantProfile?.id,
        contract: user.customerProfile?.contract,
        merchantProfile: user.merchantProfile
          ? {
              id: user.merchantProfile.id,
              businessName: user.merchantProfile.businessName,
              businessType: user.merchantProfile.businessType,
              discountRate: user.merchantProfile.discountRate,
              status: user.merchantProfile.status,
            }
          : undefined,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me - Get current user profile
router.get("/me", authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        customerProfile: { include: { contract: true } },
        merchantProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileId: user.customerProfile?.id || user.merchantProfile?.id,
        contract: user.customerProfile?.contract,
        merchantProfile: user.merchantProfile,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
