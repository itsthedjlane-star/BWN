import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "border-zinc-700 bg-zinc-800 text-zinc-300": variant === "default",
          "border-green-500/30 bg-green-500/20 text-green-400": variant === "success",
          "border-red-500/30 bg-red-500/20 text-red-400": variant === "danger",
          "border-yellow-500/30 bg-yellow-500/20 text-yellow-400": variant === "warning",
          "border-blue-500/30 bg-blue-500/20 text-blue-400": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}
