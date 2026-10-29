import { redirect } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";

type LegacyRegisterPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function LegacyRegisterPage({ searchParams }: LegacyRegisterPageProps) {
  const { role } = await searchParams;
  redirect(role === "tenant" ? ROUTES.registerTenant : ROUTES.registerCustomer);
}
