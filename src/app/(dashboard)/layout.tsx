import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { AssistantPanel } from "@/components/ai/assistant-panel";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { LoginUpsell } from "@/components/overlays/login-upsell";
import { FormattingInitializer } from "@/components/providers/formatting-provider";
import { getCurrentOrganizationId } from "@/lib/org/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow /workspaces without a valid org (it's the org-selection page)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isWorkspacesPage = pathname.startsWith("/workspaces");

  if (!isWorkspacesPage) {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) {
      redirect("/workspaces");
    }
  }

  return (
    <div className="bg-canvas-gradient relative min-h-screen">
      <FormattingInitializer />
      <TopNav />
      <Suspense fallback={null}>
        <EmailVerificationBanner />
      </Suspense>
      <main className="mx-auto max-w-[1440px] px-8 pb-32">
        {children}
      </main>
      <AssistantPanel />
      <LoginUpsell />
    </div>
  );
}
