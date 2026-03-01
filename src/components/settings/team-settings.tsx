"use client";

import { useState, useEffect } from "react";
import { useCurrentOrgId } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Mail,
  Crown,
  Shield,
  Eye,
  Calculator,
  Loader2,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  accountant: Calculator,
  viewer: Eye,
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  accountant: "Accountant",
  viewer: "Viewer",
};

export function TeamSettings() {
  const orgId = useCurrentOrgId();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [myRole, setMyRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("accountant");
  const [sending, setSending] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      fetch(`/api/team/members?orgId=${orgId}`, { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/team/invite?orgId=${orgId}`, { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([membersData, invitesData]) => {
        if (membersData) {
          setMembers(membersData.members || []);
          setMyRole(membersData.myRole || "");
        }
        if (invitesData) {
          setInvites(invitesData.invites || []);
        }
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const canManage = ["owner", "admin"].includes(myRole);
  const pendingInvites = invites.filter((i) => !i.acceptedAt && new Date(i.expiresAt) > new Date());

  async function handleInvite() {
    if (!orgId || !inviteEmail.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Invite sent", `Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        setInvites((prev) => [...prev, data.invite]);

        if (data.inviteUrl) {
          await navigator.clipboard.writeText(data.inviteUrl);
          setCopiedUrl(data.inviteUrl);
          setTimeout(() => setCopiedUrl(null), 3000);
        }
      } else {
        showError("Invite failed", data.error || "Please try again.");
      }
    } catch {
      showError("Invite failed", "Network error.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-card flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
        <span className="ml-2 text-[14px] text-text-secondary">Loading team...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members List */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-text-primary">Team Members</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              {members.length} member{members.length !== 1 ? "s" : ""} in this organization
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-text-primary/10 px-3 py-1 text-[12px] font-medium text-text-primary">
            <Users className="h-3.5 w-3.5" />
            {members.length}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role] || Eye;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-border-subtle px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-text-primary/10 text-[14px] font-semibold text-text-primary">
                  {member.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-text-primary truncate">
                    {member.userName || "Unknown"}
                  </div>
                  <div className="text-[12px] text-text-meta truncate">{member.userEmail}</div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[12px] font-medium text-text-secondary">
                  <RoleIcon className="h-3 w-3" />
                  {roleLabels[member.role] || member.role}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite New Member */}
      {canManage && (
        <div className="dashboard-card">
          <h2 className="text-[18px] font-semibold text-text-primary">Invite Member</h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            Send an invitation link to add someone to your team
          </p>

          <div className="mt-5 flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Email Address
              </label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Role
              </label>
              <StyledSelect
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-11 text-[14px]"
              >
                <option value="admin">Admin</option>
                <option value="accountant">Accountant</option>
                <option value="viewer">Viewer</option>
              </StyledSelect>
            </div>
            <Button
              onClick={handleInvite}
              disabled={sending || !inviteEmail.trim()}
              className="h-11 gap-2 rounded-xl bg-text-primary px-5 text-[13px] font-semibold text-white hover:bg-text-primary/90"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Invite
            </Button>
          </div>

          {copiedUrl && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-[12px] text-success">
              <Copy className="h-3.5 w-3.5" />
              Invite link copied to clipboard!
            </div>
          )}
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="dashboard-card">
          <h2 className="text-[18px] font-semibold text-text-primary">Pending Invites</h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            {pendingInvites.length} pending invitation{pendingInvites.length !== 1 ? "s" : ""}
          </p>

          <div className="mt-5 space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 rounded-xl border border-border-subtle border-dashed px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-yellow/10">
                  <Mail className="h-4 w-4 text-accent-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-text-primary truncate">
                    {invite.email}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-text-meta">
                    <Clock className="h-3 w-3" />
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="rounded-full bg-accent-yellow/10 px-2.5 py-1 text-[12px] font-medium text-accent-yellow">
                  {roleLabels[invite.role] || invite.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!canManage && (
        <div className="dashboard-card border border-border-subtle">
          <p className="text-[13px] text-text-secondary">
            Only organization owners and admins can manage team members.
          </p>
        </div>
      )}
    </div>
  );
}
