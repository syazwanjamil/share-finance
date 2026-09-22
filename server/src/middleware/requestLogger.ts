import { pinoHttp } from "pino-http";
import { config } from "../config/env.js";

export const requestLogger = pinoHttp({
  level: config.LOG_LEVEL,
  transport: config.isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
      },
  redact: ["req.headers.authorization"],
});
