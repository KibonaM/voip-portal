import { cn } from "@/lib/utils"

type Variant = "success" | "warning" | "danger" | "info" | "neutral"

const variantStyles: Record<Variant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
}

interface StatusBadgeProps {
  label: string
  variant: Variant
  dot?: boolean
}

export function StatusBadge({ label, variant, dot = true }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", variantStyles[variant])}>
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-success": variant === "success",
            "bg-warning": variant === "warning",
            "bg-destructive": variant === "danger",
            "bg-primary": variant === "info",
            "bg-muted-foreground": variant === "neutral",
          })}
        />
      )}
      {label}
    </span>
  )
}
