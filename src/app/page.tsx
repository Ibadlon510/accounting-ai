import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // If Supabase sends auth params to root (email confirm / recovery link),
  // forward them to the auth callback so the code/token gets exchanged.
  const code = params.code;
  const token_hash = params.token_hash;
  const type = params.type;

  if (code || token_hash) {
    const qs = new URLSearchParams();
    if (code) qs.set("code", String(code));
    if (token_hash) qs.set("token_hash", String(token_hash));
    if (type) qs.set("type", String(type));
    redirect(`/auth/callback?${qs.toString()}`);
  }

  redirect("/landing");
}
