import type { Request, Response } from "express";
import { param } from "../lib/params.js";
import { findMembersForGroup } from "../repositories/member.repository.js";
import * as groupService from "../services/group.service.js";

export async function listMembers(req: Request, res: Response): Promise<void> {
  const members = await findMembersForGroup(param(req, "groupId"));
  res.status(200).json(members);
}

export async function inviteMember(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as { phone: string };
  const member = await groupService.inviteMember(param(req, "groupId"), phone);
  res.status(201).json(member);
}
