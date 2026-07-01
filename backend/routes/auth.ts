import { Router } from "express";
import prisma from "../src/db/prisma";

import {
  generateHashedPassword,
  generateUserToken,
  verifyPasswordHash,
  verifyUserToken,
} from "../utils/authUtils";
import authMiddleware from "../middleware/authMiddleware";

const tokenExpiryTimeInMilliSeconds =
  Number(process.env.TOKEN_EXPIRY_TIME_IN_SECONDS ?? 3600) * 1000;

const router = Router();

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }
    console.log("body:::", req.body);

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

    const jwtPayload = {
      name,
      email,
    };

    const jwtToken = generateUserToken(jwtPayload);

    console.log("token", jwtToken);

    res.cookie("accessToken", jwtToken, {
      httpOnly: true,
      maxAge: tokenExpiryTimeInMilliSeconds,
    });
    res.cookie("refreshToken", jwtToken, {
      httpOnly: true,
      maxAge: tokenExpiryTimeInMilliSeconds * 2,
    });

    const hashedPassword = await generateHashedPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
      },
      select: {
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: "User Registered Successfully",
      data: user,
      //Remove password hash from user object when returning
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
        message: "Email and Password are required",
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
      existingUser?.passwordHash,
    );

    if (isPasswordMatch) {
      const jwtPayload = {
        email,
      };

      const jwtAccessToken = generateUserToken(jwtPayload);
      const jwtRefreshToken = generateUserToken(jwtPayload);

      console.log("token", jwtAccessToken, ">>>>>>>>>>>>>>>", jwtRefreshToken);

      res.cookie("accessToken", jwtAccessToken, {
        httpOnly: true,
        maxAge: tokenExpiryTimeInMilliSeconds,
        sameSite: "lax",
      });
      res.cookie("refreshToken", jwtRefreshToken, {
        httpOnly: true,
        maxAge: tokenExpiryTimeInMilliSeconds * 2,
        sameSite: "lax",
      });

      return res.status(200).json({
        message: "Logged in successfully",
      });
    } else {
      return res.status(400).json({
        message: "Incorrect password. Please try again",
      });
    }
  } catch (error: any) {
    console.error("Something went wrong on /register api function", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
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
    const newAccessToken = generateUserToken({
      email: userPayload.email,
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      maxAge: tokenExpiryTimeInMilliSeconds,
      sameSite: "lax",
    });
  } catch (error) {
    return res.status(401).json({
      message: "Refresh token is invalid or expired",
    });
  }
});

router.post("/logout", async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: req.user.email,
      },
      select: {
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log("user", user);

    if (user) {
      return res.status(200).json({
        user,
      });
    }
  } catch (error) {
    console.error("Error in /me api", error);
    return res.status(400).json({
      message: "Session not valid",
    });
  }
});

export default router;
