export const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  CUSTOMER: "/customer/dashboard",
};

export function getRoleHome(role?: string | null): string | null {
  if (!role) return null;
  return ROLE_HOME[role] ?? null;
}
