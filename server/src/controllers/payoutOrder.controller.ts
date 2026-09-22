import type { Request, Response } from "express";
import { param } from "../lib/params.js";
import { ApiError } from "../lib/ApiError.js";
import { findRoundsForGroup } from "../repositories/round.repository.js";
import * as payoutOrderService from "../services/payoutOrder.service.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user");
  return req.user;
}

export async function listPayoutOrder(req: Request, res: Response): Promise<void> {
  const rounds = await findRoundsForGroup(param(req, "groupId"));
  res.status(200).json(rounds);
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const { changes, reason, notifyChannel, requireConfirm } = req.body as {
    changes: { roundNumber: number; newRecipientMemberId: string }[];
    reason: string;
    notifyChannel: "whatsapp" | "in_app" | "sms";
    requireConfirm: boolean;
  };

  const result = await payoutOrderService.applyPayoutOrderChanges(param(req, "groupId"), {
    changes,
    reason,
    notifyChannel,
    requireConfirm,
    changedByUserId: id,
  });
  res.status(200).json(result);
}

export async function history(req: Request, res: Response): Promise<void> {
  const rows = await payoutOrderService.getPayoutOrderHistory(param(req, "groupId"));
  res.status(200).json(rows);
}

export async function respondToPriorityRequest(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: "approved" | "declined" };
  const request = await payoutOrderService.respondToPriorityRequest(
    param(req, "groupId"),
    param(req, "id"),
    status,
  );
  res.status(200).json(request);
}
