"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  CalendarCheckIcon,
  DumbbellIcon,
  FlaskConicalIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const trainerNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/clients", label: "Clients", icon: UsersIcon },
  { href: "/attendance", label: "Attendance", icon: CalendarCheckIcon },
  { href: "/reports", label: "Reports", icon: BarChart3Icon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const clientNav: NavItem[] = [
  { href: "/me", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/me/attendance", label: "Attendance", icon: CalendarCheckIcon },
  { href: "/me/progress", label: "Progress", icon: DumbbellIcon },
  { href: "/me/test-results", label: "Labs", icon: FlaskConicalIcon },
  { href: "/me/reports", label: "Reports", icon: BarChart3Icon },
];

function navForRole(role: UserRole) {
  return role === "trainer" ? trainerNav : clientNav;
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/me") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
              active && "bg-muted font-medium text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden"
      aria-label="Mobile"
    >
      <ul className={cn("grid", items.length >= 5 ? "grid-cols-5" : "grid-cols-4")}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-muted-foreground",
                  active && "text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
