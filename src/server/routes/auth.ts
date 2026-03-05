import { Router } from "express";

const router = Router();

// Mock Database for MVP
const users: any[] = [];

router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create mock user
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      firstName,
      lastName,
      role: role || "CUSTOMER",
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    
    // In a real app, verify password hash here
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Mock JWT Token
    const token = `mock-jwt-token-${user.id}`;

    res.json({
      message: "Login successful",
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
