"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPhotoRecordAction } from "@/features/progress/actions";
import { compressImage } from "@/features/progress/compress-image";
import { PHOTO_LABELS } from "@/features/progress/schemas";
import { isoDate } from "@/features/attendance/dates";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const LABEL_TEXT: Record<(typeof PHOTO_LABELS)[number], string> = {
  front: "Front",
  side: "Side",
  back: "Back",
  other: "Other",
};

export function PhotoUploadForm({
  clientId,
  disabled,
}: {
  clientId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [takenOn, setTakenOn] = useState(isoDate(new Date()));
  const [label, setLabel] = useState<(typeof PHOTO_LABELS)[number]>("front");
  const [fileKey, setFileKey] = useState(0);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("photo") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      toast.error("Choose a photo to upload");
      return;
    }

    startTransition(async () => {
      try {
        const compressed = await compressImage(file);
        const path = `${clientId}/${crypto.randomUUID()}.jpg`;
        const supabase = createBrowserSupabaseClient();
        const { error: uploadError } = await supabase.storage
          .from("progress-photos")
          .upload(path, compressed, {
            contentType: "image/jpeg",
            upsert: false,
          });
        if (uploadError) {
          toast.error(uploadError.message);
          return;
        }
        const result = await createPhotoRecordAction({
          client_id: clientId,
          taken_on: takenOn,
          storage_path: path,
          label,
        });
        if (result.error) {
          await supabase.storage.from("progress-photos").remove([path]);
          toast.error(result.error);
          return;
        }
        toast.success("Photo uploaded");
        setFileKey((value) => value + 1);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="photo-date">Taken on</Label>
          <Input
            id="photo-date"
            type="date"
            value={takenOn}
            onChange={(event) => setTakenOn(event.target.value)}
            disabled={disabled || pending}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="photo-label">Angle</Label>
          <select
            id="photo-label"
            value={label}
            onChange={(event) =>
              setLabel(event.target.value as (typeof PHOTO_LABELS)[number])
            }
            disabled={disabled || pending}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            {PHOTO_LABELS.map((value) => (
              <option key={value} value={value}>
                {LABEL_TEXT[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="photo-file">Photo (JPG or PNG, max 5 MB after compression)</Label>
        <Input
          key={fileKey}
          id="photo-file"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || pending}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || pending}>
          {pending ? "Uploading…" : "Upload photo"}
        </Button>
      </div>
    </form>
  );
}
