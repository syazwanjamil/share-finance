import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { config } from "../config/env.js";

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function respond(res: Response, statusCode: number, code: string, message: string, details?: unknown): void {
  const body: ErrorResponseBody = { error: { code, message, details } };
  res.status(statusCode).json(body);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    respond(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    respond(res, 400, "VALIDATION_ERROR", "Request validation failed", err.flatten());
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      respond(res, 409, "CONFLICT", "A record with this value already exists", err.meta);
      return;
    }
    if (err.code === "P2025") {
      respond(res, 404, "NOT_FOUND", "Record not found", err.meta);
      return;
    }
    respond(res, 400, "DATABASE_ERROR", "Database request could not be processed", err.meta);
    return;
  }

  req.log?.error({ err }, "Unhandled error");
  if (!config.isProduction) {
    console.error(err);
  }
  respond(res, 500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}
