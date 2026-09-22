import type { Request, Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import * as connectService from "../services/connect.service.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user");
  return req.user;
}

export async function createOnboardingLink(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const result = await connectService.createOnboardingLink(id);
  res.status(200).json(result);
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const result = await connectService.getOnboardingStatus(id);
  res.status(200).json(result);
}
