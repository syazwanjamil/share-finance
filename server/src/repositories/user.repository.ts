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
