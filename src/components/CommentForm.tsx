"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useCommentsStore } from "@/lib/store/comments";
import Link from "next/link";

interface CommentFormProps {
  articleId: string;
}

export default function CommentForm({ articleId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Honeypot: hidden field that bots fill but humans don't
  const honeypotRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const addComment = useCommentsStore((s) => s.addComment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot check: if filled, it's a bot
    if (honeypotRef.current?.value) return;
    if (!content.trim()) return;

    setSubmitting(true);
    setError("");

    const ok = await addComment(articleId, content.trim());

    if (!ok) {
      setError("Error al enviar el comentario");
      setSubmitting(false);
      return;
    }

    setContent("");
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="bg-[#f0efed] rounded-lg p-4 text-center">
        <p className="text-sm text-muted">
          <Link href="/login" className="text-[#3b82f6] font-semibold hover:underline">Ingresá</Link> para dejar un comentario
        </p>
      </div>
    );
  }

  if (profile?.role === "suspended") {
    return (
      <div className="bg-[#e63946]/5 border border-[#e63946]/20 rounded-lg p-4 text-center">
        <p className="text-sm text-[#e63946]">Tu cuenta está suspendida. No podés comentar.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot: invisible to humans, bots auto-fill hidden fields */}
      <input
        type="text"
        ref={honeypotRef}
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute opacity-0 h-0 w-0 pointer-events-none"
        style={{ position: "absolute", left: "-9999px" }}
      />
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink/60">
              {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Escribí tu comentario..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ink/30 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted">{content.length}/1000</span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-4 py-1.5 bg-ink text-white text-sm font-semibold rounded hover:bg-ink/80 transition-colors disabled:opacity-50 disabled:cursor-default"
            >
              {submitting ? "Enviando..." : "Comentar"}
            </button>
          </div>
          {error && <p className="text-xs text-[#e63946] mt-1">{error}</p>}
        </div>
      </div>
    </form>
  );
}