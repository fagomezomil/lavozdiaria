import { sectionConfig } from "@/lib/types";

interface SkeletonCardProps {
  variant?: "hero" | "standard" | "compact";
  section?: string;
}

export default function SkeletonCard({
  variant = "standard",
  section,
}: SkeletonCardProps) {
  const color =
    section && section in sectionConfig
      ? sectionConfig[section as keyof typeof sectionConfig].color
      : "#6b6b6b";

  if (variant === "hero") {
    return (
      <div className="animate-pulse">
        <div className="border-t-4 pt-3" style={{ borderTopColor: color }}>
          <div className="h-3 w-16 rounded bg-muted/30" />
        </div>
        <div className="mt-2 h-8 w-full rounded bg-muted/20" />
        <div className="mt-2 h-8 w-3/4 rounded bg-muted/20" />
        <div className="mt-3 h-4 w-full rounded bg-muted/15" />
        <div className="mt-2 h-4 w-5/6 rounded bg-muted/15" />
        <div className="mt-3 h-3 w-32 rounded bg-muted/15" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="py-3 border-b border-rule animate-pulse">
        <div className="h-2 w-12 rounded bg-muted/30" />
        <div className="mt-1 h-3 w-full rounded bg-muted/20" />
        <div className="mt-1 h-2 w-20 rounded bg-muted/15" />
      </div>
    );
  }

  return (
    <div className="bg-paper border border-border animate-pulse">
      <div
        className="h-44 flex items-center justify-center"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="w-12 h-8 rounded bg-muted/15" />
      </div>
      <div className="p-4 space-y-2">
        <div className="h-2 w-12 rounded bg-muted/30" />
        <div className="h-4 w-full rounded bg-muted/20" />
        <div className="h-4 w-4/5 rounded bg-muted/20" />
        <div className="h-3 w-full rounded bg-muted/15" />
        <div className="h-3 w-5/6 rounded bg-muted/15" />
        <div className="h-2 w-24 rounded bg-muted/15" />
      </div>
    </div>
  );
}