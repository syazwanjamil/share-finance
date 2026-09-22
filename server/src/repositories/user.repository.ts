import { prisma } from "../lib/prisma.js";
import type { User } from "@prisma/client";

export function findUserByPhone(phone: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { phone } });
}

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(phone: string): Promise<User> {
  return prisma.user.create({
    data: { phone, phoneVerified: true },
  });
}

export function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "initials" | "bankAccountLabel">>,
): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}

export function findUserByStripeConnectAccountId(accountId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { stripeConnectAccountId: accountId } });
}

export function setUserStripeConnectAccountId(id: string, accountId: string): Promise<User> {
  return prisma.user.update({ where: { id }, data: { stripeConnectAccountId: accountId } });
}

export function updateUserConnectStatus(
  id: string,
  data: Pick<
    User,
    "stripeConnectDetailsSubmitted" | "stripeConnectPayoutsEnabled" | "stripeConnectOnboarded"
  >,
): Promise<User> {
  return prisma.user.update({ where: { id }, data: { ...data, stripeConnectUpdatedAt: new Date() } });
}
