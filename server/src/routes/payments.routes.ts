import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";
import { requireMember } from "../middleware/requireMember.js";
import { validate } from "../middleware/validate.js";
import { confirmPaymentSchema, extensionRequestSchema, initiatePaymentSchema } from "../validation/payment.schema.js";

export const paymentsRouter = Router({ mergeParams: true });

paymentsRouter.use(requireMember);

paymentsRouter.get("/", paymentsController.listPayments);
paymentsRouter.get("/me", paymentsController.getMyPayment);
paymentsRouter.post("/", validate({ body: initiatePaymentSchema }), paymentsController.initiatePayment);
paymentsRouter.post(
  "/confirm",
  validate({ body: confirmPaymentSchema }),
  paymentsController.confirmPayment,
);
paymentsRouter.post(
  "/extension-request",
  validate({ body: extensionRequestSchema }),
  paymentsController.requestExtension,
);
