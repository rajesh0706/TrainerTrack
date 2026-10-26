import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="grid w-full max-w-md gap-4">
      {!configured ? (
        <Alert>
          <AlertTitle>Connect Supabase before signing in</AlertTitle>
          <AlertDescription>
            Open <code className="font-mono">.env.local</code> and paste your
            project URL and anon key from Supabase → Project Settings → API.
            Then stop and restart <code className="font-mono">npm run dev</code>
            .
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Trainers and clients use the same sign-in. Your role controls what you
            can see.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
