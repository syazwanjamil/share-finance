import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { meRouter } from "./me.routes.js";
import { groupsRouter } from "./groups.routes.js";
import { connectRouter } from "./connect.routes.js";
import { prisma } from "../lib/prisma.js";

export const apiRouter = Router();

apiRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", db: "unreachable" });
  }
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/me", meRouter);
apiRouter.use("/groups", groupsRouter);
apiRouter.use("/connect", connectRouter);
