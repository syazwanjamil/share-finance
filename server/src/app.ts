import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { webhooksRouter } from "./routes/webhooks.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ApiError } from "./lib/ApiError.js";

export function createApp() {
  const app = express();

  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGINS,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    }),
  );

  // Mounted before express.json() — Stripe signature verification needs the raw request body.
  app.use("/webhooks", express.raw({ type: "application/json" }), webhooksRouter);

  app.use(express.json({ limit: "1mb" }));

  app.use(apiRouter);

  app.use((req, _res, next) => {
    next(ApiError.notFound("NOT_FOUND", `No route for ${req.method} ${req.path}`));
  });

  app.use(errorHandler);

  return app;
}
