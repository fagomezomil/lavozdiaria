"use client";

import { useState } from "react";
import SectionHeader from "./SectionHeader";
import UserCard from "./UserCard";

interface UsuariosDashboardProps {
  users: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
  }[];
  currentUserId: string;
}

export default function UsuariosDashboard({ users, currentUserId }: UsuariosDashboardProps) {
  const [search, setSearch] = useState("");

  const filtered = users.filter((user) => {
    if (search === "") return true;
    const q = search.toLowerCase();
    return (
      (user.full_name || "").toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionHeader
        title="Usuarios Registrados"
        count={users.length}
        searchPlaceholder="Buscar por nombre o email..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontraron usuarios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <UserCard key={user.id} user={user} isCurrentUser={user.id === currentUserId} />
          ))}
        </div>
      )}
    </>
  );
}