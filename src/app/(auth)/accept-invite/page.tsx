"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
          <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No invite token provided.");
      return;
    }

    fetch("/api/team/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setOrgName(data.organizationName);
          setMessage(`You've joined ${data.organizationName} as ${data.role}.`);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to accept invite.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-text-secondary" />
            <p className="mt-4 text-[16px] font-medium text-text-primary">Accepting invite...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-4 text-[22px] font-bold text-text-primary">Welcome!</h1>
            <p className="mt-2 text-[14px] text-text-secondary">{message}</p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="mt-6 h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-error" />
            <h1 className="mt-4 text-[22px] font-bold text-text-primary">Invite Error</h1>
            <p className="mt-2 text-[14px] text-text-secondary">{message}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl border-border-subtle text-[14px] font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/landing">
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-xl text-[14px] font-medium text-text-secondary"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
