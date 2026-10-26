"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import type { Measurement } from "@/lib/supabase/database.types";

type ChartPoint = {
  date: string;
  label: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
};

function toPoints(measurements: Measurement[]): ChartPoint[] {
  return measurements.map((row) => ({
    date: row.measured_on,
    label: formatDate(row.measured_on, "d MMM"),
    weight_kg: row.weight_kg,
    body_fat_pct: row.body_fat_pct,
    chest_cm: row.chest_cm,
    waist_cm: row.waist_cm,
    hips_cm: row.hips_cm,
    arm_cm: row.arm_cm,
    thigh_cm: row.thigh_cm,
  }));
}

export function ProgressCharts({ measurements }: { measurements: Measurement[] }) {
  const data = toPoints(measurements);
  if (data.length < 2) {
    return (
      <EmptyState
        title="Charts need two or more entries"
        description="Add another measurement to see weight, body fat, and girth over time."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <ChartCard
        title="Weight"
        description="Kilograms over time"
        data={data}
        lines={[{ key: "weight_kg", name: "Weight (kg)", color: "var(--chart-1)" }]}
      />
      <ChartCard
        title="Body fat"
        description="Percentage over time"
        data={data}
        lines={[{ key: "body_fat_pct", name: "Body fat %", color: "var(--chart-2)" }]}
      />
      <ChartCard
        title="Body measurements"
        description="Centimetres over time"
        data={data}
        lines={[
          { key: "chest_cm", name: "Chest", color: "var(--chart-1)" },
          { key: "waist_cm", name: "Waist", color: "var(--chart-2)" },
          { key: "hips_cm", name: "Hips", color: "var(--chart-3)" },
          { key: "arm_cm", name: "Arm", color: "var(--chart-4)" },
          { key: "thigh_cm", name: "Thigh", color: "var(--chart-5)" },
        ]}
      />
    </div>
  );
}

function ChartCard({
  title,
  description,
  data,
  lines,
}: {
  title: string;
  description: string;
  data: ChartPoint[];
  lines: Array<{ key: keyof ChartPoint; name: string; color: string }>;
}) {
  const hasValues = lines.some((line) =>
    data.some((point) => typeof point[line.key] === "number"),
  );
  if (!hasValues) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <Tooltip />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
