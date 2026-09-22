import type { Request } from "express";

/**
 * Express types every route param as `string | string[]` (to account for wildcard
 * routes), but none of our routes use wildcards, so every param here is always a
 * single string. This narrows it for call sites without sprinkling casts everywhere.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}
