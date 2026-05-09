import type { Ad } from "@/lib/types";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  leaderboard: "Leaderboard",
  rectangle: "Rectangle",
  sidebar: "Sidebar",
  modal: "Modal",
};

export default function AdRow({ ad }: { ad: Ad }) {
  const isExpired = ad.expires_at && new Date(ad.expires_at) < new Date();
  const isActive = ad.active && !isExpired;

  return (
    <tr className="hover:bg-[#f8f5f0] transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {ad.image_url ? (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-16 h-10 object-cover rounded border border-border"
            />
          ) : (
            <div className="w-16 h-10 bg-[#f0efed] rounded border border-border flex items-center justify-center text-xs text-muted">
              Sin img
            </div>
          )}
          <span className="font-medium">{ad.title || "Sin título"}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{typeLabels[ad.type] || ad.type}</td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold ${
            isActive
              ? "bg-[#10b981]/15 text-[#10b981]"
              : "bg-[#e63946]/15 text-[#e63946]"
          }`}
        >
          {isActive ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-4 py-3 text-muted">{ad.priority}</td>
      <td className="px-4 py-3 text-muted text-xs">
        {ad.starts_at
          ? new Date(ad.starts_at).toLocaleDateString("es-AR")
          : "—"}
        {" → "}
        {ad.expires_at
          ? new Date(ad.expires_at).toLocaleDateString("es-AR")
          : "Sin venc."}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/ads/${ad.id}/edit`}
          className="text-[#3b82f6] hover:underline text-xs font-semibold"
        >
          Editar
        </Link>
      </td>
    </tr>
  );
}