import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-card text-foreground",
        success: "border-success/25 bg-success-muted text-success",
        warning: "border-warning/25 bg-warning-muted text-warning",
        danger: "border-danger/25 bg-danger-muted text-danger",
        info: "border-info/25 bg-info-muted text-info",
        accent: "border-capitol-accent/40 bg-capitol-accent-muted text-primary",
        muted: "border-border bg-muted text-muted-foreground"
      }
    },
    defaultVariants: {
      variant: "secondary"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
