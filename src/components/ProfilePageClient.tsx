"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useLikesStore } from "@/lib/store/likes";
import { useFavoritesStore } from "@/lib/store/favorites";
import { createClient } from "@/lib/supabase/client";
import { sectionConfig } from "@/lib/types";
import Link from "next/link";

interface ProfileArticle {
  id: string;
  title: string;
  section: string;
  imageUrl?: string;
  imageAlt?: string;
  date: string;
  excerpt?: string;
}

interface UserComment {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSection: string;
  content: string;
  createdAt: string;
}

interface ProfilePageClientProps {
  likedArticles: ProfileArticle[];
  favoritedArticles: ProfileArticle[];
  userComments: UserComment[];
}

export default function ProfilePageClient({ likedArticles, favoritedArticles, userComments }: ProfilePageClientProps) {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const localLikedArticles = useLikesStore((s) => s.localArticles);
  const localFavoritedArticles = useFavoritesStore((s) => s.localArticles);

  const [tab, setTab] = useState<"perfil" | "favoritos" | "likes" | "comentarios">("perfil");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.full_name || "");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [commentList, setCommentList] = useState(userComments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || !profile) return null;

  const displayName = profile.full_name || user.email || "";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert("Error al subir imagen: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    await refreshProfile();
    setUploading(false);
  };

  const handleSaveName = async () => {
    const supabase = createClient();
    await supabase.from("profiles").update({ full_name: nameValue }).eq("id", user.id);
    await refreshProfile();
    setEditingName(false);
  };

  // Merge DB articles with localStorage articles
  const allLikedArticles = [
    ...likedArticles,
    ...localLikedArticles.filter((la) => !likedArticles.some((a) => a.id === la.id)),
  ];
  const allFavoritedArticles = [
    ...favoritedArticles,
    ...localFavoritedArticles.filter((la) => !favoritedArticles.some((a) => a.id === la.id)),
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-ink text-white flex items-center justify-center text-2xl font-bold border-2 border-border">
                {initial}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-ink text-white rounded-full flex items-center justify-center text-xs hover:bg-ink/80 transition-colors"
              aria-label="Cambiar foto"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536M6 13l3 3 7-7" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="border border-border rounded px-3 py-1.5 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1.5 bg-ink text-white text-sm rounded hover:bg-ink/80 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameValue(profile.full_name || ""); }}
                  className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">
                  {displayName}
                </h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label="Editar nombre"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536M6 13l3 3 7-7" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-sm text-muted mt-0.5">{user.email}</p>
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-bold ${
              profile.role === "admin" ? "bg-[#3b82f6]/15 text-[#3b82f6]" : "bg-[#6b6b6b]/15 text-[#6b6b6b]"
            }`}>
              {profile.role === "admin" ? "Admin" : "Usuario"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setTab("perfil")}
          className={`pb-2 text-sm font-semibold transition-colors ${tab === "perfil" ? "border-b-2 border-ink text-foreground" : "text-muted hover:text-foreground"}`}
        >
          Perfil
        </button>
        <button
          onClick={() => setTab("favoritos")}
          className={`pb-2 text-sm font-semibold transition-colors ${tab === "favoritos" ? "border-b-2 border-ink text-foreground" : "text-muted hover:text-foreground"}`}
        >
          Favoritos ({allFavoritedArticles.length})
        </button>
        <button
          onClick={() => setTab("likes")}
          className={`pb-2 text-sm font-semibold transition-colors ${tab === "likes" ? "border-b-2 border-ink text-foreground" : "text-muted hover:text-foreground"}`}
        >
          Me gusta ({allLikedArticles.length})
        </button>
        <button
          onClick={() => setTab("comentarios")}
          className={`pb-2 text-sm font-semibold transition-colors ${tab === "comentarios" ? "border-b-2 border-ink text-foreground" : "text-muted hover:text-foreground"}`}
        >
          Comentarios ({commentList.length})
        </button>
      </div>

      {/* Tab content */}
      {tab === "perfil" && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-4">Información</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">Nombre</dt>
              <dd className="font-medium">{profile.full_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Registro</dt>
              <dd className="font-medium">{new Date(profile.created_at || "").toLocaleDateString("es-AR")}</dd>
            </div>
            <div>
              <dt className="text-muted">Rol</dt>
              <dd className="font-medium capitalize">{profile.role}</dd>
            </div>
          </dl>
        </div>
      )}

      {tab === "favoritos" && (
        <ArticleList articles={allFavoritedArticles} emptyMessage="No tenés artículos guardados como favoritos." />
      )}

      {tab === "likes" && (
        <ArticleList articles={allLikedArticles} emptyMessage="No te diste me gusta a ningún artículo todavía." />
      )}

      {tab === "comentarios" && (
        <div className="space-y-3">
          {commentList.length === 0 ? (
            <div className="bg-white rounded-lg border border-border p-12 text-center">
              <p className="text-muted">No hiciste ningún comentario todavía.</p>
            </div>
          ) : commentList.map((c) => {
            const cfg = sectionConfig[c.articleSection as keyof typeof sectionConfig];
            return (
              <div key={c.id} className="bg-white rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {cfg && (
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                      )}
                      <Link
                        href={`/${c.articleSection}/${c.articleId}`}
                        className="text-sm font-semibold hover:underline line-clamp-1"
                      >
                        {c.articleTitle}
                      </Link>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">{c.content}</p>
                    <span className="text-[10px] text-muted mt-1 block">
                      {new Date(c.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar este comentario?")) return;
                      setDeletingId(c.id);
                      const supabase = createClient();
                      await supabase.from("comments").delete().eq("id", c.id);
                      setCommentList((prev) => prev.filter((x) => x.id !== c.id));
                      setDeletingId(null);
                    }}
                    disabled={deletingId === c.id}
                    className="text-xs text-muted hover:text-[#e63946] transition-colors shrink-0"
                  >
                    {deletingId === c.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function ArticleList({ articles, emptyMessage }: { articles: ProfileArticle[]; emptyMessage: string }) {
  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-12 text-center">
        <p className="text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        const cfg = sectionConfig[article.section as keyof typeof sectionConfig];
        return (
          <Link key={article.id} href={`/${article.section}/${article.id}`} className="group">
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              {article.imageUrl ? (
                <div className="h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.imageUrl}
                    alt={article.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ) : cfg ? (
                <div
                  className="h-40 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)` }}
                >
                  <span className="text-4xl font-[family-name:var(--font-heading)] opacity-15" style={{ color: cfg.color }}>
                    LV
                  </span>
                </div>
              ) : (
                <div className="h-40 bg-[#f0efed] flex items-center justify-center">
                  <span className="text-4xl font-[family-name:var(--font-heading)] opacity-15 text-ink">LV</span>
                </div>
              )}
              <div className="p-3">
                {cfg && (
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                )}
                <h3 className="mt-1 text-sm font-bold leading-snug font-[family-name:var(--font-heading)] group-hover:underline line-clamp-2">
                  {article.title}
                </h3>
                {article.date && (
                  <span className="mt-1 text-[10px] text-muted block">{article.date}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}