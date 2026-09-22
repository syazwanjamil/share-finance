import { Router } from "express";
import * as roundsController from "../controllers/rounds.controller.js";
import { requireMember, requireOrganizer } from "../middleware/requireMember.js";
import { validate } from "../middleware/validate.js";
import { autoReleaseSchema, holdRoundSchema, releaseRoundSchema, roundParamsSchema } from "../validation/round.schema.js";
import { paymentsRouter } from "./payments.routes.js";

export const roundsRouter = Router({ mergeParams: true });

roundsRouter.use("/:roundNumber/payments", paymentsRouter);

roundsRouter.get("/", requireMember, roundsController.listRounds);
roundsRouter.get(
  "/:roundNumber",
  requireMember,
  validate({ params: roundParamsSchema }),
  roundsController.getRound,
);
roundsRouter.get(
  "/:roundNumber/collection",
  requireMember,
  validate({ params: roundParamsSchema }),
  roundsController.getCollection,
);
roundsRouter.post(
  "/:roundNumber/release",
  requireOrganizer,
  validate({ params: roundParamsSchema, body: releaseRoundSchema }),
  roundsController.releaseRound,
);
roundsRouter.patch(
  "/:roundNumber/auto-release",
  requireOrganizer,
  validate({ params: roundParamsSchema, body: autoReleaseSchema }),
  roundsController.setAutoRelease,
);
roundsRouter.post(
  "/:roundNumber/hold",
  requireOrganizer,
  validate({ params: roundParamsSchema, body: holdRoundSchema }),
  roundsController.holdRound,
);
roundsRouter.post(
  "/:roundNumber/hold/release",
  requireOrganizer,
  validate({ params: roundParamsSchema }),
  roundsController.releaseHold,
);
