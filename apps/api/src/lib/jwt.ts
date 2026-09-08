import jwt from "jsonwebtoken";
import { CookieOptions } from "express";

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "freelancehub_super_secret_jwt_key_for_development_only_replace_in_prod";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

export const AUTH_COOKIE_NAME = "auth_token";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
