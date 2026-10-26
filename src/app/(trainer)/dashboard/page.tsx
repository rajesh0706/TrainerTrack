import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { DashboardAttendance } from "@/features/attendance/components/dashboard-attendance";
import {
  getTrainerDashboard,
  listTrainerClientOptions,
} from "@/features/attendance/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireRole("trainer");
  const [data, clients] = await Promise.all([
    getTrainerDashboard(user.id),
    listTrainerClientOptions(user.id),
  ]);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.profile.full_name}`}
        description="Today’s board, weekly volume, and who needs a follow-up."
      />
      <DashboardAttendance data={data} clients={clients} />
    </div>
  );
}
