"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { grantOwnConsentAction } from "@/features/progress/actions";

export function GrantConsentButton() {
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid max-w-xl gap-3">
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
          aria-describedby="consent-privacy"
        />
        <span>
          I consent to TrainerTrack storing my measurements and progress photos
          so my trainer and I can track health progress.
        </span>
      </label>
      <p id="consent-privacy" className="text-sm text-muted-foreground">
        Read the{" "}
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          privacy note
        </Link>{" "}
        before agreeing. You can ask your trainer to delete this data later.
      </p>
      <Button
        type="button"
        disabled={!agreed || pending}
        onClick={() =>
          startTransition(async () => {
            const result = await grantOwnConsentAction();
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Consent saved");
          })
        }
      >
        {pending ? "Saving…" : "Save consent"}
      </Button>
    </div>
  );
}
