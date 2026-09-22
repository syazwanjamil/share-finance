import type { Request, Response } from "express";
import { param } from "../lib/params.js";
import { ApiError } from "../lib/ApiError.js";
import * as groupService from "../services/group.service.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user");
  return req.user;
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const bundle = await groupService.createGroup({ ...req.body, organizerUserId: id });
  res.status(201).json(bundle);
}

export async function getGroup(req: Request, res: Response): Promise<void> {
  const bundle = await groupService.getGroupBundle(param(req, "groupId"));
  res.status(200).json(bundle);
}

export async function getGroupBySlug(req: Request, res: Response): Promise<void> {
  const bundle = await groupService.getGroupBundleBySlug(param(req, "slug"));
  res.status(200).json(bundle);
}

export async function joinGroup(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const { inviteCode } = req.body as { inviteCode: string };
  const bundle = await groupService.joinGroupByInviteCode(inviteCode, id);
  res.status(200).json(bundle);
}

export async function getPoolSummary(req: Request, res: Response): Promise<void> {
  const bundle = await groupService.getGroupBundle(param(req, "groupId"));
  const summary = groupService.computePoolSummary(bundle);
  res.status(200).json(summary);
}
