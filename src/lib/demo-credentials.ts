export type DemoRole = "admin" | "staff" | "customer";

export const DEMO_PASSWORD = "Password@123";
export const DEMO_PIN = "123456";

export type DemoCredential = {
  role: DemoRole;
  label: string;
  email: string;
  password: string;
  pin?: string;
};

export const DEMO_CREDENTIALS: Record<DemoRole, DemoCredential> = {
  admin: {
    role: "admin",
    label: "Admin",
    email: "admin@nexabank.com",
    password: DEMO_PASSWORD,
  },
  staff: {
    role: "staff",
    label: "Staff",
    email: "staff1@nexabank.com",
    password: DEMO_PASSWORD,
  },
  customer: {
    role: "customer",
    label: "Customer",
    email: "customer1@nexabank.com",
    password: DEMO_PASSWORD,
    pin: DEMO_PIN,
  },
};

export const DEMO_CREDENTIAL_LIST = Object.values(DEMO_CREDENTIALS);

export function getDemoCredential(role: string | null | undefined): DemoCredential | null {
  if (role === "admin" || role === "staff" || role === "customer") {
    return DEMO_CREDENTIALS[role];
  }
  return null;
}
