"use client";

import { useState } from "react";
import type { CustomArticle, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import AdminArticleCard from "./AdminArticleCard";
import SectionHeader from "./SectionHeader";

interface NotasDashboardProps {
  articles: CustomArticle[];
}

export default function NotasDashboard({ articles }: NotasDashboardProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { label: "Todas", value: "all" },
    ...Object.entries(sectionConfig).map(([key, cfg]) => ({
      label: cfg.label,
      value: key,
      color: cfg.color,
    })),
  ];

  const filtered = articles.filter((article) => {
    const matchesFilter = activeFilter === "all" || article.section === activeFilter;
    const matchesSearch =
      search === "" ||
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      (article.author || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <SectionHeader
        title="Notas Periodísticas"
        action={{ label: "+ Nueva Nota", href: "/admin/articles/new" }}
        count={articles.length}
        searchPlaceholder="Buscar por título o autor..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontraron notas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <AdminArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}