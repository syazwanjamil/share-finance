import { Router } from "express";
import * as webhooksController from "../controllers/webhooks.controller.js";

export const webhooksRouter = Router();

webhooksRouter.post("/stripe", webhooksController.handleStripeWebhook);
