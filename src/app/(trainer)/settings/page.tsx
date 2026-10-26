import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BrandingForm } from "@/features/settings/components/branding-form";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireRole("trainer");
  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase
    .from("trainer_settings")
    .select("*")
    .eq("trainer_id", user.id)
    .maybeSingle();

  let logoUrl: string | null = null;
  if (settings?.logo_path) {
    const { data } = await supabase.storage
      .from("branding")
      .createSignedUrl(settings.logo_path, 3600);
    logoUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile, PDF branding, and a copy of your data."
      />
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Shown in the app header greeting.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={user.profile.full_name} phone={user.profile.phone} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Used on PDF reports shared with clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm
            trainerId={user.id}
            businessName={settings?.business_name ?? "TrainerTrack"}
            logoUrl={logoUrl}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Data export</CardTitle>
          <CardDescription>
            Download a JSON copy of your clients, sessions, measurements, and photo
            metadata (GDPR portability).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/api/export" className={buttonVariants()}>
            Download JSON export
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
