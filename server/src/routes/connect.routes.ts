import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import * as connectController from "../controllers/connect.controller.js";

export const connectRouter = Router();

connectRouter.use(requireAuth);

connectRouter.post("/onboarding-link", connectController.createOnboardingLink);
connectRouter.get("/status", connectController.getStatus);
connectRouter.post("/simulate-onboarding", connectController.simulateOnboarding);
