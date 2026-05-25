"use client";

import { useState } from "react";
import SectionHeader from "./SectionHeader";
import CommentCard from "./CommentCard";

interface ComentariosDashboardProps {
  comments: {
    id: string;
    article_id: string;
    article_title: string;
    user_name: string;
    user_avatar_url: string | null;
    content: string;
    created_at: string;
  }[];
}

export default function ComentariosDashboard({ comments }: ComentariosDashboardProps) {
  const [search, setSearch] = useState("");

  const filtered = comments.filter((comment) => {
    if (search === "") return true;
    const q = search.toLowerCase();
    return (
      comment.content.toLowerCase().includes(q) ||
      comment.user_name.toLowerCase().includes(q) ||
      comment.article_title.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionHeader
        title="Comentarios"
        count={comments.length}
        searchPlaceholder="Buscar por contenido, usuario o nota..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontraron comentarios.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </>
  );
}