import type { Request, Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import { findUserById, updateUser } from "../repositories/user.repository.js";
import { getGroupsForUser } from "../services/group.service.js";
import { getDashboard } from "../services/me.service.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user");
  return req.user;
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const user = await findUserById(id);
  if (!user) throw ApiError.notFound("USER_NOT_FOUND", "User not found");
  res.status(200).json(user);
}

export async function patchMe(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const user = await updateUser(id, req.body);
  res.status(200).json(user);
}

export async function getMyGroups(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const groups = await getGroupsForUser(id);
  res.status(200).json(groups);
}

export async function getMyDashboard(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const dashboard = await getDashboard(id);
  res.status(200).json(dashboard);
}
