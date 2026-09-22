import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";
import { requireMember } from "../middleware/requireMember.js";
import { validate } from "../middleware/validate.js";
import { autopaySchema } from "../validation/payment.schema.js";

export const autopayRouter = Router({ mergeParams: true });

autopayRouter.use(requireMember);

autopayRouter.get("/", paymentsController.getAutopay);
autopayRouter.put("/", validate({ body: autopaySchema }), paymentsController.setAutopay);
