import { Router } from "express";
import * as meController from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { updateMeSchema } from "../validation/me.schema.js";

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get("/", meController.getMe);
meRouter.patch("/", validate({ body: updateMeSchema }), meController.patchMe);
meRouter.get("/groups", meController.getMyGroups);
meRouter.get("/dashboard", meController.getMyDashboard);
