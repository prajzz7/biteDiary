import type { AuthTokenPayload } from "../../utils/authUtils";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};
