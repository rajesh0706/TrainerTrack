"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/attendance", label: "Attendance" },
  { href: "/progress", label: "Progress" },
  { href: "/photos", label: "Photos" },
  { href: "/test-results", label: "Test Results" },
  { href: "/billing", label: "Billing" },
  { href: "/reports", label: "Reports" },
] as const;

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;

  return (
    <nav
      aria-label="Client sections"
      className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-[3px]"
    >
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const active =
          tab.href === ""
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground",
              active && "bg-background font-medium text-foreground shadow-sm",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
