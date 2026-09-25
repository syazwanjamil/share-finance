import type { Request, Response } from "express";
import { param } from "../lib/params.js";
import { ApiError } from "../lib/ApiError.js";
import { findRoundByNumber } from "../repositories/round.repository.js";
import * as roundService from "../services/round.service.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized("UNAUTHENTICATED", "Missing authenticated user");
  return req.user;
}

export async function listRounds(req: Request, res: Response): Promise<void> {
  const rounds = await roundService.findRoundsForGroup(param(req, "groupId"));
  res.status(200).json(rounds);
}

export async function getRound(req: Request, res: Response): Promise<void> {
  const round = await findRoundByNumber(param(req, "groupId"), Number(param(req, "roundNumber")));
  if (!round) throw ApiError.notFound("ROUND_NOT_FOUND", "Round not found");
  res.status(200).json(round);
}

export async function getCollection(req: Request, res: Response): Promise<void> {
  const collection = await roundService.computeRoundCollection(
    param(req, "groupId"),
    Number(param(req, "roundNumber")),
  );
  res.status(200).json(collection);
}

export async function releaseRound(req: Request, res: Response): Promise<void> {
  const { force, simulate } = req.body as { force: boolean; simulate?: boolean };
  const round = await roundService.releasePayout(param(req, "groupId"), Number(param(req, "roundNumber")), {
    force,
    simulate,
  });
  res.status(200).json(round);
}

export async function setAutoRelease(req: Request, res: Response): Promise<void> {
  const { autoRelease } = req.body as { autoRelease: boolean };
  const round = await roundService.setAutoRelease(
    param(req, "groupId"),
    Number(param(req, "roundNumber")),
    autoRelease,
  );
  res.status(200).json(round);
}

export async function holdRound(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const { reason } = req.body as { reason: string };
  const hold = await roundService.placeHold(param(req, "groupId"), Number(param(req, "roundNumber")), reason, id);
  res.status(201).json(hold);
}

export async function releaseHold(req: Request, res: Response): Promise<void> {
  const round = await roundService.releaseHoldForRound(param(req, "groupId"), Number(param(req, "roundNumber")));
  res.status(200).json(round);
}

export async function remindUnpaid(req: Request, res: Response): Promise<void> {
  const result = await roundService.remindUnpaid(param(req, "groupId"));
  res.status(200).json(result);
}
