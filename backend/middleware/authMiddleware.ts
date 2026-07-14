import type { NextFunction, Request, Response } from "express";
import { verifyUserToken } from "../utils/authUtils";

type AuthenticatedRequest = Request & {
  user?: ReturnType<typeof verifyUserToken>;
};

function getAccessToken(req: Request) {
  const cookieToken = req.cookies?.accessToken;

  if (typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken.trim();
  }
  return undefined;
}

export default function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const accessToken = getAccessToken(req);

  if (!accessToken) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  try {
    const userPayload = verifyUserToken(accessToken);
    req.user = userPayload;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token is invalid or expired",
    });
  }
}
