import { Router } from "express";
import * as membersController from "../controllers/members.controller.js";
import { requireMember, requireOrganizer } from "../middleware/requireMember.js";
import { validate } from "../middleware/validate.js";
import { inviteMemberSchema } from "../validation/group.schema.js";

export const membersRouter = Router({ mergeParams: true });

membersRouter.get("/", requireMember, membersController.listMembers);
membersRouter.post(
  "/invite",
  requireOrganizer,
  validate({ body: inviteMemberSchema }),
  membersController.inviteMember,
);
