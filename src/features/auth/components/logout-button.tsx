"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full justify-start"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
    >
      <LogOutIcon />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
