import { TopNav } from "@/components/layout/top-nav";
import { AssistantPanel } from "@/components/ai/assistant-panel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas-gradient relative min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-8 pb-32">
        {children}
      </main>
      <AssistantPanel />
    </div>
  );
}
