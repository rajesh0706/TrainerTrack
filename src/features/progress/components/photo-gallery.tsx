"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deletePhotoAction } from "@/features/progress/actions";
import { PHOTO_LABELS } from "@/features/progress/schemas";
import type { PhotoWithUrl } from "@/features/progress/types";
import { formatDate } from "@/lib/format";

const LABEL_TEXT: Record<(typeof PHOTO_LABELS)[number], string> = {
  front: "Front",
  side: "Side",
  back: "Back",
  other: "Other",
};

export function PhotoGallery({
  clientId,
  photos,
  readOnly,
}: {
  clientId: string;
  photos: PhotoWithUrl[];
  readOnly?: boolean;
}) {
  const [beforeId, setBeforeId] = useState(photos[0]?.id ?? "");
  const [afterId, setAfterId] = useState(photos[photos.length - 1]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const before = useMemo(
    () => photos.find((photo) => photo.id === beforeId) ?? null,
    [photos, beforeId],
  );
  const after = useMemo(
    () => photos.find((photo) => photo.id === afterId) ?? null,
    [photos, afterId],
  );

  function remove(photoId: string) {
    startTransition(async () => {
      const result = await deletePhotoAction(photoId, clientId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Photo deleted");
    });
  }

  if (photos.length === 0) {
    return (
      <EmptyState
        title="No photos yet"
        description="Upload a front, side, or back photo to compare progress."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Before / after</CardTitle>
          <CardDescription>Pick two photos to compare side by side.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoSelect
              id="before-photo"
              label="Before"
              value={beforeId}
              photos={photos}
              onChange={setBeforeId}
            />
            <PhotoSelect
              id="after-photo"
              label="After"
              value={afterId}
              photos={photos}
              onChange={setAfterId}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CompareFrame photo={before} caption="Before" />
            <CompareFrame photo={after} caption="After" />
          </div>
        </CardContent>
      </Card>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <li key={photo.id} className="overflow-hidden rounded-xl border">
            {photo.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.url}
                alt={`${LABEL_TEXT[photo.label]} photo from ${formatDate(photo.taken_on)}`}
                className="aspect-[3/4] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center text-sm text-muted-foreground">
                Could not load image
              </div>
            )}
            <div className="flex items-center justify-between gap-2 p-3 text-sm">
              <div>
                <p className="font-medium">{LABEL_TEXT[photo.label]}</p>
                <p className="text-muted-foreground">{formatDate(photo.taken_on)}</p>
              </div>
              {readOnly ? null : (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => remove(photo.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhotoSelect({
  id,
  label,
  value,
  photos,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  photos: PhotoWithUrl[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
      >
        {photos.map((photo) => (
          <option key={photo.id} value={photo.id}>
            {formatDate(photo.taken_on)} · {LABEL_TEXT[photo.label]}
          </option>
        ))}
      </select>
    </div>
  );
}

function CompareFrame({
  photo,
  caption,
}: {
  photo: PhotoWithUrl | null;
  caption: string;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border">
      {photo?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} alt={caption} className="aspect-[3/4] w-full object-cover" />
      ) : (
        <div className="flex aspect-[3/4] items-center justify-center text-sm text-muted-foreground">
          No photo selected
        </div>
      )}
      <figcaption className="p-2 text-center text-sm text-muted-foreground">
        {caption}
        {photo ? ` · ${formatDate(photo.taken_on)}` : ""}
      </figcaption>
    </figure>
  );
}
