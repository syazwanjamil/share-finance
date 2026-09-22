import type { NextFunction, Request, Response } from "express";
import { param } from "../lib/params.js";
import { ApiError } from "../lib/ApiError.js";
import { findMemberByGroupAndUser } from "../repositories/member.repository.js";
import type { Member } from "@prisma/client";

async function loadActiveMember(req: Request): Promise<Member> {
  const groupId = param(req, "groupId");
  if (!req.user || !groupId) {
    throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user or group id");
  }

  const member = await findMemberByGroupAndUser(groupId, req.user.id);
  if (!member || member.status !== "active") {
    throw ApiError.forbidden("NOT_A_MEMBER", "You are not a member of this group");
  }
  return member;
}

/** Requires requireAuth to have run first. Attaches req.member if the caller belongs to :groupId. */
export async function requireMember(req: Request, _res: Response, next: NextFunction): Promise<void> {
  req.member = await loadActiveMember(req);
  next();
}

export async function requireOrganizer(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const member = await loadActiveMember(req);
  if (member.role !== "organizer") {
    throw ApiError.forbidden("NOT_ORGANIZER", "Only the group organizer can do this");
  }
  req.member = member;
  next();
}
