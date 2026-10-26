import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shiftIsoDate } from "@/features/attendance/dates";

export function AttendanceRangeNav({
  view,
  date,
}: {
  view: "day" | "week";
  date: string;
}) {
  const step = view === "week" ? 7 : 1;

  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <div className="grid gap-1.5 sm:w-36">
        <Label htmlFor="attendance-view">View</Label>
        <select
          id="attendance-view"
          name="view"
          defaultValue={view}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="attendance-date">Date</Label>
        <Input id="attendance-date" name="date" type="date" defaultValue={date} />
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          render={
            <Link href={`/attendance?view=${view}&date=${shiftIsoDate(date, -step)}`} />
          }
        >
          Previous
        </Button>
        <Button variant="outline" size="sm" render={<Link href={`/attendance?view=${view}`} />}>
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={
            <Link href={`/attendance?view=${view}&date=${shiftIsoDate(date, step)}`} />
          }
        >
          Next
        </Button>
      </div>
    </form>
  );
}
