import { Suspense } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { AssistantPanel } from "@/components/ai/assistant-panel";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas-gradient relative min-h-screen">
      <TopNav />
      <Suspense fallback={null}>
        <EmailVerificationBanner />
      </Suspense>
      <main className="mx-auto max-w-[1440px] px-8 pb-32">
        {children}
      </main>
      <AssistantPanel />
    </div>
  );
}
