import type { Request, Response } from "express";
import { param } from "../lib/params.js";
import { ApiError } from "../lib/ApiError.js";
import { findMemberByGroupAndUser } from "../repositories/member.repository.js";
import { findPaymentForMemberRound, findPaymentsForRound } from "../repositories/payment.repository.js";
import * as paymentService from "../services/payment.service.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user");
  return req.user;
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  const payments = await findPaymentsForRound(param(req, "groupId"), Number(param(req, "roundNumber")));
  res.status(200).json(payments);
}

export async function getMyPayment(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const member = await findMemberByGroupAndUser(param(req, "groupId"), id);
  if (!member) throw ApiError.forbidden("NOT_A_MEMBER", "You are not a member of this group");
  const payment = await findPaymentForMemberRound(member.id, Number(param(req, "roundNumber")));
  res.status(200).json(payment);
}

export async function initiatePayment(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const { method } = req.body as { method: "card" };
  const result = await paymentService.initiatePayment(
    param(req, "groupId"),
    Number(param(req, "roundNumber")),
    id,
    method,
  );
  res.status(201).json(result);
}

export async function confirmPayment(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const { gatewayRef } = req.body as { gatewayRef: string };
  const payment = await paymentService.confirmPayment(
    param(req, "groupId"),
    Number(param(req, "roundNumber")),
    id,
    gatewayRef,
  );
  res.status(200).json(payment);
}

export async function requestExtension(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const { reason } = req.body as { reason: string };
  const request = await paymentService.requestExtension(
    param(req, "groupId"),
    Number(param(req, "roundNumber")),
    id,
    reason,
  );
  res.status(201).json(request);
}

export async function getAutopay(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const enabled = await paymentService.getAutopay(param(req, "groupId"), id);
  res.status(200).json({ enabled });
}

export async function setAutopay(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const { enabled } = req.body as { enabled: boolean };
  const result = await paymentService.setAutopay(param(req, "groupId"), id, enabled);
  res.status(200).json({ enabled: result });
}
