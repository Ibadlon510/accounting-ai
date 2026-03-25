import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept Invitation",
  description: "Accept your team invitation to join an Agar Smart Accounting workspace.",
  robots: { index: false, follow: false },
};

export default function AcceptInviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
