import { config } from "../../config/env.js";
import { ApiError } from "../../lib/ApiError.js";
import { createNotificationLog } from "../../repositories/notificationLog.repository.js";
import { whatsAppService } from "./index.js";
import type { NotificationTemplate } from "@prisma/client";

function describeError(error: unknown): string {
  if (error instanceof ApiError && error.details) {
    return `${error.message}: ${String(error.details)}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Sends a WhatsApp message via the configured provider and always records the attempt
 * in NotificationLog, regardless of success/failure. Send failures are swallowed here
 * (logged, not thrown) so a notification hiccup never blocks the underlying business
 * action (e.g. a payment still succeeds even if the receipt WhatsApp message fails).
 */
export async function notify<T>(input: {
  phone: string;
  template: NotificationTemplate;
  groupId?: string;
  payload: T;
  send: () => Promise<{ providerMessageId?: string }>;
}): Promise<void> {
  try {
    const result = await input.send();
    await createNotificationLog({
      groupId: input.groupId,
      toPhone: input.phone,
      template: input.template,
      payload: input.payload as object,
      provider: config.NOTIFICATION_PROVIDER,
      providerMessageId: result.providerMessageId,
      status: "sent",
    });
  } catch (error) {
    await createNotificationLog({
      groupId: input.groupId,
      toPhone: input.phone,
      template: input.template,
      payload: input.payload as object,
      provider: config.NOTIFICATION_PROVIDER,
      status: "failed",
      errorMessage: describeError(error),
    });
  }
}

export { whatsAppService };
