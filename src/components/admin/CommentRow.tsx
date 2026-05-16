"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CommentRow({ comment }: { comment: { id: string; article_id: string; user_name: string; content: string; created_at: string; article_title: string } }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este comentario?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", comment.id);

    if (!error) {
      router.refresh();
    } else {
      alert("Error al eliminar: " + error.message);
    }
  };

  return (
    <tr className="hover:bg-[#f8f5f0] transition-colors">
      <td className="px-4 py-3 max-w-[200px]">
        <span className="text-xs font-semibold text-ink line-clamp-2">{comment.article_title}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted">{comment.user_name}</span>
      </td>
      <td className="px-4 py-3 max-w-[300px]">
        <p className="text-xs text-foreground line-clamp-2">{comment.content}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted whitespace-nowrap">{formatDate(comment.created_at)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleDelete}
          className="text-xs text-[#e63946] hover:underline font-semibold"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}