import type { ReactNode } from "react";
import Link from "next/link";
import { DumbbellIcon } from "lucide-react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { DesktopNav, MobileNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import type { CurrentUser } from "@/lib/auth/session";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
            <DumbbellIcon className="size-5" aria-hidden />
            TrainerTrack
          </Link>
          <DesktopNav role={user.profile.role} />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>
      <MobileNav role={user.profile.role} />
      <footer className="mx-auto hidden w-full max-w-6xl px-4 pb-6 text-sm text-muted-foreground md:block">
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
