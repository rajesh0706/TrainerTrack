"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArchiveClientDialog } from "@/features/clients/components/archive-client-dialog";
import { ClientFormDialog } from "@/features/clients/components/client-form-dialog";
import { DeleteClientButton } from "@/features/clients/components/delete-client-dialog";
import { InviteClientButton } from "@/features/clients/components/invite-client-button";
import { StatusBadge } from "@/features/clients/components/status-badge";
import { GENDER_LABELS } from "@/features/clients/labels";
import type { AttendanceSummary } from "@/features/attendance/calculations";
import type { MeasurementChange } from "@/features/progress/calculations";
import {
  formatCm,
  formatDate,
  formatKg,
  formatPercent,
  signedNumber,
} from "@/lib/format";
import type { Client } from "@/lib/supabase/database.types";
import type { GENDERS } from "@/features/clients/schemas";

export function ClientOverview({
  client,
  attendance,
  weight,
}: {
  client: Client;
  attendance: AttendanceSummary;
  weight: MeasurementChange | null;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const genderLabel =
    client.gender && client.gender in GENDER_LABELS
      ? GENDER_LABELS[client.gender as (typeof GENDERS)[number]]
      : client.gender;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <InviteClientButton clientId={client.id} invited={Boolean(client.profile_id)} />
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button
          variant={client.status === "archived" ? "outline" : "destructive"}
          onClick={() => setArchiveOpen(true)}
        >
          {client.status === "archived" ? "Restore" : "Archive"}
        </Button>
        <DeleteClientButton client={client} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Attendance"
          value={formatPercent(attendance.rate)}
          hint={`${attendance.present} of ${attendance.scheduled} sessions`}
        />
        <StatCard
          label="Total sessions"
          value={String(attendance.total)}
          hint={`${attendance.cancelled} cancelled`}
        />
        <StatCard
          label="Weight change"
          value={weight ? `${signedNumber(weight.change)} kg` : "—"}
          hint={
            weight
              ? `${formatKg(weight.start)} → ${formatKg(weight.current)}`
              : "No measurements yet"
          }
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Personal details and training goal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Detail label="Status" value={<StatusBadge status={client.status} />} />
          <Detail label="Email" value={client.email} />
          <Detail label="Phone" value={client.phone ?? "—"} />
          <Detail label="Start date" value={formatDate(client.start_date)} />
          <Detail label="Date of birth" value={formatDate(client.date_of_birth)} />
          <Detail label="Gender" value={genderLabel ?? "—"} />
          <Detail label="Height" value={formatCm(client.height_cm)} />
          <Detail
            label="Health-data consent"
            value={client.consent_health_data ? "Yes" : "Not recorded"}
          />
          <div className="sm:col-span-2">
            <Detail label="Goal" value={client.goal ?? "—"} />
          </div>
          <div className="sm:col-span-2">
            <Detail label="Notes" value={client.notes ?? "—"} />
          </div>
        </CardContent>
      </Card>
      <ClientFormDialog
        client={client}
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit client"
        description="Update profile details, status, and health-data consent."
      />
      <ArchiveClientDialog
        client={client}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="text-sm">{value}</div>
    </div>
  );
}
