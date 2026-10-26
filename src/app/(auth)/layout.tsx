import type { ReactNode } from "react";
import Link from "next/link";
import { DumbbellIcon } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <DumbbellIcon className="size-5" aria-hidden />
        TrainerTrack
      </div>
      {children}
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  );
}
