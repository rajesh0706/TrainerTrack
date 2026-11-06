import type { Metadata } from "next";

import { getBillingPlan } from "@/features/billing/queries";
import { ClientOverview } from "@/features/clients/components/client-overview";
import {
  getClientOverviewStats,
  getTrainerClient,
} from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);
  return { title: client.full_name };
}

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);
  const [stats, plan] = await Promise.all([
    getClientOverviewStats(client.id),
    getBillingPlan(client.id),
  ]);

  return (
    <ClientOverview
      client={client}
      attendance={stats.attendance}
      weight={stats.weight}
      plan={plan}
    />
  );
}
