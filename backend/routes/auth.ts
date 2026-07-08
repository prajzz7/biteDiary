import { Router, type CookieOptions, type Response } from "express";
import prisma from "../src/db/prisma";

import {
  generateAccessToken,
  generateHashedPassword,
  generateRefreshToken,
  tokenExpiry,
  verifyPasswordHash,
  verifyUserToken,
  type AuthTokenPayload,
} from "../utils/authUtils";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

console.log("Auth cookie config debug:", {
  nodeEnv: process.env.NODE_ENV,
  isProduction,
  frontendUrl: process.env.FRONTEND_URL,
});

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function setAuthCookies(res: Response, payload: AuthTokenPayload) {
  res.cookie("accessToken", generateAccessToken(payload), {
    ...authCookieOptions,
    maxAge: tokenExpiry.accessTokenExpiryTimeInSeconds * 1000,
  });

  res.cookie("refreshToken", generateRefreshToken(payload), {
    ...authCookieOptions,
    maxAge: tokenExpiry.refreshTokenExpiryTimeInSeconds * 1000,
  });

  console.log("authCookieOptions", authCookieOptions);
}

function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", authCookieOptions);
  res.clearCookie("refreshToken", authCookieOptions);
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Please log in instead",
      });
    }

    const hashedPassword = await generateHashedPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
      },
    });

    setAuthCookies(res, {
      email: user.email,
      id: user.id,
      name: user.name,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Something went wrong on /register api function", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return res.status(400).json({
        message: "User does not exist. Please register.",
      });
    }

    const isPasswordMatch = await verifyPasswordHash(
      password,
      existingUser.passwordHash,
    );

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect password. Please try again",
      });
    }

    const authPayload = {
      email: existingUser.email,
      id: existingUser.id,
      name: existingUser.name,
    };

    setAuthCookies(res, authPayload);

    console.log("RES after setting cookie>>", res);

    return res.status(200).json({
      message: "Logged in successfully",
      user: authPayload,
    });
  } catch (error) {
    console.error("Something went wrong on /login api function", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "No refresh token",
    });
  }

  try {
    const userPayload = verifyUserToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: {
        id: userPayload.id,
      },
      select: {
        email: true,
        id: true,
        name: true,
      },
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        message: "Session user no longer exists",
      });
    }

    const authPayload = {
      email: user.email,
      id: user.id,
      name: user.name,
    };

    setAuthCookies(res, authPayload);

    return res.status(200).json({
      message: "Session refreshed",
      user: authPayload,
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({
      message: "Refresh token is invalid or expired",
    });
  }
});

router.post("/logout", async (_req, res) => {
  clearAuthCookies(res);

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

router.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Session not valid",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        message: "Session user no longer exists",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error in /me api", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

export default router;
