"use client";

import { ToggleRoleForm } from "./ToggleRoleForm";

interface UserCardProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
  };
  isCurrentUser: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  admin: { bg: "bg-[#3b82f6]/15", text: "text-[#3b82f6]", label: "Admin" },
  editor: { bg: "bg-[#f59e0b]/15", text: "text-[#d97706]", label: "Editor" },
  suspended: { bg: "bg-[#e63946]/15", text: "text-[#e63946]", label: "Suspendido" },
  user: { bg: "bg-[#6b6b6b]/15", text: "text-[#6b6b6b]", label: "Usuario" },
};

export default function UserCard({ user, isCurrentUser }: UserCardProps) {
  const initials = (user.full_name || user.email).charAt(0).toUpperCase();
  const roleInfo = ROLE_COLORS[user.role] || ROLE_COLORS.user;

  return (
    <div className="bg-paper rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold font-[family-name:var(--font-heading)]">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] truncate">
            {user.full_name || "—"}
          </h3>
          <p className="text-xs text-muted truncate">{user.email}</p>
        </div>
      </div>

      {/* Role badge */}
      <span className={`text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded ${roleInfo.bg} ${roleInfo.text}`}>
        {roleInfo.label}
      </span>

      <div className="text-[11px] text-muted mt-2">
        Registrado: {new Date(user.created_at).toLocaleDateString("es-AR")}
      </div>

      {/* Role actions */}
      {!isCurrentUser && (
        <div className="mt-3 pt-2 border-t border-border">
          <ToggleRoleForm userId={user.id} currentRole={user.role} />
        </div>
      )}
    </div>
  );
}