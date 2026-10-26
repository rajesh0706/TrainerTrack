"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { rangeForPreset } from "@/features/reports/range";
import {
  CLIENT_REPORTS,
  RANGE_PRESETS,
  REPORT_FORMATS,
  TRAINER_ONLY_REPORTS,
  type ReportType,
} from "@/features/reports/schemas";

const REPORT_OPTIONS: Array<{
  id: ReportType;
  label: string;
  description: string;
}> = [
  {
    id: "attendance",
    label: "Client attendance",
    description: "Counts, month breakdown, and the session list.",
  },
  {
    id: "progress",
    label: "Client progress",
    description: "Start vs current measurements, charts, optional photos.",
  },
  {
    id: "summary",
    label: "Combined client summary",
    description: "Attendance and progress with your business branding.",
  },
  {
    id: "clients-attendance",
    label: "All-clients attendance",
    description: "One row per client. Trainer only.",
  },
  {
    id: "business",
    label: "Monthly business",
    description: "Volume, active clients, average attendance, new vs archived.",
  },
];

const PRESET_LABELS: Record<(typeof RANGE_PRESETS)[number], string> = {
  this_week: "This week",
  this_month: "This month",
  last_3_months: "Last 3 months",
  custom: "Custom",
};

type ClientOption = { id: string; full_name: string; status: string };

export function ReportBuilder({
  clients,
  lockedClientId,
  trainerView = true,
}: {
  clients: ClientOption[];
  lockedClientId?: string;
  trainerView?: boolean;
}) {
  const initialRange = rangeForPreset("this_month");
  const visibleReports = REPORT_OPTIONS.filter((option) => {
    if (lockedClientId) return CLIENT_REPORTS.includes(option.id as (typeof CLIENT_REPORTS)[number]);
    if (!trainerView) return CLIENT_REPORTS.includes(option.id as (typeof CLIENT_REPORTS)[number]);
    return true;
  });

  const [type, setType] = useState<ReportType>(visibleReports[0]?.id ?? "attendance");
  const [preset, setPreset] = useState<(typeof RANGE_PRESETS)[number]>("this_month");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [clientId, setClientId] = useState(lockedClientId ?? clients[0]?.id ?? "");
  const [includePhotos, setIncludePhotos] = useState(true);
  const [pending, startTransition] = useTransition();

  const needsClient = CLIENT_REPORTS.includes(type as (typeof CLIENT_REPORTS)[number]);
  const showPhotos = type === "progress" || type === "summary";

  const query = useMemo(() => {
    const params = new URLSearchParams({
      from,
      to,
      format: "pdf",
    });
    if (needsClient && clientId) params.set("clientId", clientId);
    if (showPhotos) params.set("includePhotos", includePhotos ? "1" : "0");
    return params;
  }, [from, to, needsClient, clientId, showPhotos, includePhotos]);

  function applyPreset(next: (typeof RANGE_PRESETS)[number]) {
    setPreset(next);
    if (next === "custom") return;
    const range = rangeForPreset(next);
    setFrom(range.from);
    setTo(range.to);
  }

  function download(format: (typeof REPORT_FORMATS)[number]) {
    if (needsClient && !clientId) {
      toast.error("Choose a client");
      return;
    }
    const params = new URLSearchParams(query);
    params.set("format", format);
    startTransition(async () => {
      const response = await fetch(`/api/reports/${type}?${params.toString()}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        toast.error(payload?.error ?? "Could not generate the report");
        return;
      }
      const blob = await response.blob();
      const header = response.headers.get("Content-Disposition") ?? "";
      const match = header.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `report.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report builder</CardTitle>
        <CardDescription>
          Pick a report, a date range, and a format. Files are generated on the
          server after access checks.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Report</legend>
          <div className="grid gap-2">
            {visibleReports.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border p-3"
              >
                <input
                  type="radio"
                  name="report-type"
                  className="mt-1"
                  checked={type === option.id}
                  onChange={() => setType(option.id)}
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {needsClient && !lockedClientId ? (
          <div className="grid gap-1.5">
            <Label htmlFor="report-client">Client</Label>
            <select
              id="report-client"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
            >
              {clients.length === 0 ? (
                <option value="">No clients yet</option>
              ) : null}
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Date range</legend>
          <div className="flex flex-wrap gap-2">
            {RANGE_PRESETS.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={preset === value ? "default" : "outline"}
                onClick={() => applyPreset(value)}
              >
                {PRESET_LABELS[value]}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="report-from">From</Label>
              <Input
                id="report-from"
                type="date"
                value={from}
                onChange={(event) => {
                  setPreset("custom");
                  setFrom(event.target.value);
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="report-to">To</Label>
              <Input
                id="report-to"
                type="date"
                value={to}
                onChange={(event) => {
                  setPreset("custom");
                  setTo(event.target.value);
                }}
              />
            </div>
          </div>
        </fieldset>

        {showPhotos ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={includePhotos}
              onCheckedChange={(checked) => setIncludePhotos(checked === true)}
            />
            Include before/after photos in PDF
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {REPORT_FORMATS.map((format) => (
            <Button
              key={format}
              type="button"
              disabled={pending}
              data-testid={`download-${format}`}
              onClick={() => download(format)}
            >
              {pending ? "Generating…" : `Download ${format.toUpperCase()}`}
            </Button>
          ))}
        </div>
        {TRAINER_ONLY_REPORTS.includes(type as (typeof TRAINER_ONLY_REPORTS)[number]) ? (
          <p className="text-xs text-muted-foreground">
            Studio-wide reports never include another trainer’s clients.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
