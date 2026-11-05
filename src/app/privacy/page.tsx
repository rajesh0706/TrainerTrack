import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <p>
        <Link href="/login" className="text-sm underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
      <h1 className="font-heading text-3xl font-semibold">Privacy note</h1>
      <p className="text-muted-foreground">
        TrainerTrack stores fitness and health information so a trainer and their
        clients can track attendance, measurements, and photos. This page explains
        what we keep and how you can control it (GDPR-oriented).
      </p>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">What we store</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Account email, name, and optional phone (authentication).</li>
          <li>Client records: contact details, goals, session notes.</li>
          <li>
            Health data: body measurements, progress photos, and blood-work
            results, only after consent is recorded.
          </li>
          <li>Session attendance and optional workout logs.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Legal basis and consent</h2>
        <p className="text-sm text-muted-foreground">
          Attendance and contact details are processed to run the training
          relationship. Measurements, photos, and blood-work results are stored
          only when the trainer ticks the health-data consent box, or when you
          confirm consent in the client portal. You can refuse this health data
          and still keep a client record.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Who can see data</h2>
        <p className="text-sm text-muted-foreground">
          Row Level Security in the database limits each trainer to their own
          clients. A client login can only read (and add) their own linked
          record. Photos sit in a private storage bucket; the app uses short-lived
          signed URLs, not public links.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Your rights</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>Access / portability:</strong> trainers can download a JSON
            export in Settings. Linked clients can download their own copy from
            the same export endpoint while signed in.
          </li>
          <li>
            <strong>Erasure:</strong> trainers can use “Delete all data” on a
            client overview (name confirmation). That removes the client row and
            cascaded sessions, measurements, photos, and storage objects.
          </li>
          <li>
            <strong>Rectification:</strong> trainers can edit client records;
            clients can add new measurements and photos but not rewrite history.
          </li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Processors and retention</h2>
        <p className="text-sm text-muted-foreground">
          Hosting is typically Vercel (the web app) and Supabase (Postgres, Auth,
          Storage) in the region you chose for the project. Data is kept until the
          trainer deletes the client or the account is removed. Auth cookies are
          used only to keep you signed in.
        </p>
      </section>
      <p className="text-sm text-muted-foreground">
        This note is for a single-trainer studio app. It is not legal advice.
        Add your business name, contact email, and region if you offer this to
        paying clients.
      </p>
    </main>
  );
}
