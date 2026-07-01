import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const saltRounds = 10;

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenExpiryTimeInSeconds = Number(
  process.env.TOKEN_EXPIRY_TIME_IN_SECONDS ?? 3600,
);

if (!jwtSecretKey) {
  throw new Error("JWT_SECRET_KEY is required");
}

if (!Number.isFinite(tokenExpiryTimeInSeconds) || tokenExpiryTimeInSeconds <= 0) {
  throw new Error("TOKEN_EXPIRY_TIME_IN_SECONDS must be a positive number");
}

export const generateHashedPassword = async (password: string) => {
  return bcrypt.hash(password, saltRounds);
};

export const verifyPasswordHash = async (
  password: string,
  hashedPassword: string,
) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateUserToken = (userPayload: object) => {
  const token = jwt.sign(userPayload, jwtSecretKey, {
    expiresIn: tokenExpiryTimeInSeconds,
  });

  return token;
};

export const verifyUserToken = (token: string) => {
  const validPayload = jwt.verify(token, jwtSecretKey);

  console.log("req.user ", validPayload);
  return validPayload;
};
