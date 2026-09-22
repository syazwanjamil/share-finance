import { prisma } from "../lib/prisma.js";
import type { NotificationStatus, NotificationTemplate, Prisma } from "@prisma/client";

export function createNotificationLog(input: {
  groupId?: string;
  toPhone: string;
  template: NotificationTemplate;
  payload: Prisma.InputJsonValue;
  provider: string;
  providerMessageId?: string;
  status: NotificationStatus;
  errorMessage?: string;
}) {
  return prisma.notificationLog.create({
    data: { ...input, sentAt: input.status === "sent" ? new Date() : null },
  });
}
