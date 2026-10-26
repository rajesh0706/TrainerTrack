"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/features/progress/compress-image";
import { updateBrandingAction } from "@/features/settings/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function BrandingForm({
  trainerId,
  businessName,
  logoUrl,
}: {
  trainerId: string;
  businessName: string;
  logoUrl: string | null;
}) {
  const [name, setName] = useState(businessName);
  const [pending, startTransition] = useTransition();

  function save(logoPath?: string) {
    startTransition(async () => {
      const result = await updateBrandingAction({
        business_name: name,
        logo_path: logoPath,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Branding saved");
    });
  }

  async function onLogo(file: File | undefined) {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const path = `${trainerId}/logo.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage.from("branding").upload(path, compressed, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      save(path);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo upload failed");
    }
  }

  return (
    <div className="grid max-w-md gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="business-name">Business name</Label>
        <Input
          id="business-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="logo">Logo (JPG or PNG)</Label>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Business logo" className="h-16 w-16 rounded object-contain" />
        ) : null}
        <Input
          id="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void onLogo(event.target.files?.[0])}
        />
      </div>
      <Button type="button" disabled={pending} onClick={() => save()}>
        {pending ? "Saving…" : "Save branding"}
      </Button>
    </div>
  );
}
