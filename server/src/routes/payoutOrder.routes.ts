import { Router } from "express";
import * as payoutOrderController from "../controllers/payoutOrder.controller.js";
import { requireMember, requireOrganizer } from "../middleware/requireMember.js";
import { validate } from "../middleware/validate.js";
import {
  priorityRequestParamsSchema,
  reorderPayoutSchema,
  respondPriorityRequestSchema,
} from "../validation/payoutOrder.schema.js";

export const payoutOrderRouter = Router({ mergeParams: true });

payoutOrderRouter.get("/", requireMember, payoutOrderController.listPayoutOrder);
payoutOrderRouter.post(
  "/reorder",
  requireOrganizer,
  validate({ body: reorderPayoutSchema }),
  payoutOrderController.reorder,
);
payoutOrderRouter.get("/history", requireMember, payoutOrderController.history);
payoutOrderRouter.post(
  "/priority-requests/:id/respond",
  requireOrganizer,
  validate({ params: priorityRequestParamsSchema, body: respondPriorityRequestSchema }),
  payoutOrderController.respondToPriorityRequest,
);
