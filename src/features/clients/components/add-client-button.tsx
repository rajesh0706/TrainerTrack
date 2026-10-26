"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientFormDialog } from "@/features/clients/components/client-form-dialog";

export function AddClientButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Add client
      </Button>
      <ClientFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Add client"
        description="Create a client record. Invite them to the portal from their overview when you are ready."
      />
    </>
  );
}
