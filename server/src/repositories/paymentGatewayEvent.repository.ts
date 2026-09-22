import { prisma } from "../lib/prisma.js";
import type { PaymentGatewayEvent, PaymentGatewayEventStatus, Prisma } from "@prisma/client";

export function findGatewayEventById(eventId: string): Promise<PaymentGatewayEvent | null> {
  return prisma.paymentGatewayEvent.findUnique({ where: { eventId } });
}

export function createGatewayEvent(input: {
  provider: string;
  eventId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}): Promise<PaymentGatewayEvent> {
  return prisma.paymentGatewayEvent.create({ data: { ...input, status: "received" } });
}

export function updateGatewayEventStatus(
  id: string,
  status: PaymentGatewayEventStatus,
  errorMessage?: string,
): Promise<PaymentGatewayEvent> {
  return prisma.paymentGatewayEvent.update({
    where: { id },
    data: { status, errorMessage, processedAt: new Date() },
  });
}
