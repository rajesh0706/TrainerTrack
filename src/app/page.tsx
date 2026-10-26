import { redirect } from "next/navigation";

import { getCurrentUser, homePathForRole } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homePathForRole(user.profile.role));
}
