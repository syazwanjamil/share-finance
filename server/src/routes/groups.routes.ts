import { Router } from "express";
import * as groupsController from "../controllers/groups.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireMember, requireOrganizer } from "../middleware/requireMember.js";
import { validate } from "../middleware/validate.js";
import {
  createGroupSchema,
  groupIdParamSchema,
  groupSlugParamSchema,
  joinGroupSchema,
} from "../validation/group.schema.js";
import { membersRouter } from "./members.routes.js";
import { roundsRouter } from "./rounds.routes.js";
import { payoutOrderRouter } from "./payoutOrder.routes.js";
import { autopayRouter } from "./autopay.routes.js";
import { remindUnpaid } from "../controllers/rounds.controller.js";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.post("/", validate({ body: createGroupSchema }), groupsController.createGroup);
groupsRouter.post("/join", validate({ body: joinGroupSchema }), groupsController.joinGroup);
groupsRouter.get(
  "/by-slug/:slug",
  validate({ params: groupSlugParamSchema }),
  groupsController.getGroupBySlug,
);

groupsRouter.get(
  "/:groupId",
  validate({ params: groupIdParamSchema }),
  requireMember,
  groupsController.getGroup,
);
groupsRouter.get(
  "/:groupId/pool-summary",
  validate({ params: groupIdParamSchema }),
  requireMember,
  groupsController.getPoolSummary,
);
groupsRouter.post("/:groupId/remind-unpaid", requireOrganizer, remindUnpaid);

groupsRouter.use("/:groupId/members", membersRouter);
groupsRouter.use("/:groupId/rounds", roundsRouter);
groupsRouter.use("/:groupId/payout-order", payoutOrderRouter);
groupsRouter.use("/:groupId/autopay", autopayRouter);
