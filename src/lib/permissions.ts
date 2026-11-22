import type { Role } from "@prisma/client";

export type PermissionAction = string;

const ROLE_PERMISSIONS: Record<Role, readonly PermissionAction[]> = {
  ADMIN: ["*"],
  STAFF: [],
  CUSTOMER: [],
};

export function can(role: Role, action: PermissionAction): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes("*") || permissions.includes(action);
}
