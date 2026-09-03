import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  url, // Geriye dönük uyumluluk için bırakıldı, ancak kullanılmayacak
  className,
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-surface-2 text-on-surface font-label-mono text-xs tracking-wider select-none overflow-hidden shrink-0",
        className
      )}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
