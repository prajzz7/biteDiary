import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const saltRounds = 10;

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const accessTokenExpiryTimeInSeconds = Number(
  process.env.ACCESS_TOKEN_EXPIRY_TIME_IN_SECONDS ??
    process.env.TOKEN_EXPIRY_TIME_IN_SECONDS ??
    3600,
);
const refreshTokenExpiryTimeInSeconds = Number(
  process.env.REFRESH_TOKEN_EXPIRY_TIME_IN_SECONDS ?? 60 * 60 * 24 * 7,
);

export type AuthTokenPayload = {
  email: string;
  id: string;
  name?: string | null;
};

if (!jwtSecretKey) {
  throw new Error("JWT_SECRET_KEY is required");
}

function assertValidExpiry(value: number, envName: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${envName} must be a positive number`);
  }
}

assertValidExpiry(
  accessTokenExpiryTimeInSeconds,
  "ACCESS_TOKEN_EXPIRY_TIME_IN_SECONDS",
);
assertValidExpiry(
  refreshTokenExpiryTimeInSeconds,
  "REFRESH_TOKEN_EXPIRY_TIME_IN_SECONDS",
);

function isAuthTokenPayload(payload: unknown): payload is AuthTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "email" in payload &&
    "id" in payload &&
    typeof (payload as AuthTokenPayload).email === "string" &&
    typeof (payload as AuthTokenPayload).id === "string"
  );
}

export const tokenExpiry = {
  accessTokenExpiryTimeInSeconds,
  refreshTokenExpiryTimeInSeconds,
};

export const generateHashedPassword = async (password: string) => {
  return bcrypt.hash(password, saltRounds);
};

export const verifyPasswordHash = async (
  password: string,
  hashedPassword: string,
) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateUserToken = (
  userPayload: AuthTokenPayload,
  expiresInSeconds = accessTokenExpiryTimeInSeconds,
) => {
  return jwt.sign(userPayload, jwtSecretKey, {
    expiresIn: expiresInSeconds,
  });
};

export const generateAccessToken = (userPayload: AuthTokenPayload) => {
  return generateUserToken(userPayload, accessTokenExpiryTimeInSeconds);
};

export const generateRefreshToken = (userPayload: AuthTokenPayload) => {
  return generateUserToken(userPayload, refreshTokenExpiryTimeInSeconds);
};

export const verifyUserToken = (token: string) => {
  const validPayload = jwt.verify(token, jwtSecretKey);

  if (!isAuthTokenPayload(validPayload)) {
    throw new Error("Invalid token payload");
  }

  return validPayload;
};
