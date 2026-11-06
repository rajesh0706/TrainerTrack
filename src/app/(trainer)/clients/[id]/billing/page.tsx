import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingPlanForm } from "@/features/billing/components/billing-plan-form";
import { PaymentForm } from "@/features/billing/components/payment-form";
import { PaymentList } from "@/features/billing/components/payment-list";
import { getBillingPlan, listPayments } from "@/features/billing/queries";
import { getTrainerClient } from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Billing" };

export default async function ClientBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);
  const [plan, payments] = await Promise.all([
    getBillingPlan(client.id),
    listPayments(client.id),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            Monthly, quarterly, or yearly fee. Only you can see billing — it is
            not shown on the client portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingPlanForm key={plan?.updated_at ?? "new"} clientId={client.id} plan={plan} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Record payment</CardTitle>
          <CardDescription>
            {plan
              ? "Marks the current due cycle as paid and advances the next due date."
              : "Save a plan first, then log payments here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan ? (
            <PaymentForm key={plan.next_due_on} clientId={client.id} plan={plan} />
          ) : (
            <p className="text-sm text-muted-foreground">No billing plan yet.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Newest payments first.</CardDescription>
        </CardHeader>
        <CardContent>
          {plan ? (
            <PaymentList clientId={client.id} plan={plan} payments={payments} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Payment history appears after you save a plan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
