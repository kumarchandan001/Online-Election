// =============================================================================
// Auth Controller — Registration & Login (Security-Hardened)
// =============================================================================

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import {
  isValidEmail,
  normalizeEmail,
  sanitizeName,
  isStrongPassword,
} from "../middleware/validators";

const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    // --- Input validation ---------------------------------------------------
    const cleanName = sanitizeName(name);
    if (!cleanName) {
      res.status(400).json({
        error: "Name must be 2–100 characters and cannot contain HTML.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Please provide a valid email address." });
      return;
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({ error: passwordCheck.reason });
      return;
    }

    // Normalize email (trim + lowercase)
    const cleanEmail = normalizeEmail(email);

    // --- Check for existing user -------------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      res.status(409).json({ error: "A user with this email already exists." });
      return;
    }

    // --- Hash password & create user ----------------------------------------
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        // ⚠️ SECURITY: role is ALWAYS "VOTER" — never accept role from client
        role: "VOTER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User registered successfully.",
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // --- Input validation ---------------------------------------------------
    if (!email || !password) {
      res
        .status(400)
        .json({ error: "Fields 'email' and 'password' are required." });
      return;
    }

    if (!isValidEmail(email)) {
      // Generic error to prevent email enumeration
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Normalize email
    const cleanEmail = normalizeEmail(email);

    // --- Find user ----------------------------------------------------------
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (!user) {
      // ⚠️ SECURITY: Same error message whether user exists or not
      //    to prevent email enumeration attacks
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // --- Verify password ----------------------------------------------------
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // --- Sign JWT -----------------------------------------------------------
    const token = jwt.sign(
      { userId: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}
