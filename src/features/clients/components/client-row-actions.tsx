"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArchiveClientDialog } from "@/features/clients/components/archive-client-dialog";
import { ClientFormDialog } from "@/features/clients/components/client-form-dialog";
import type { Client } from "@/lib/supabase/database.types";

export function ClientRowActions({ client }: { client: Client }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archived = client.status === "archived";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${client.full_name}`} />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/clients/${client.id}`} />}>
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            variant={archived ? "default" : "destructive"}
            onClick={() => setArchiveOpen(true)}
          >
            {archived ? "Restore" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
    </>
  );
}
