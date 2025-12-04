import * as React from "react";
import { cn } from "./utils";

interface SectionHeaderProps extends React.ComponentProps<"div"> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * SectionHeader - Global section header component
 * Provides consistent section titles across the application
 */
function SectionHeader({
  title,
  description,
  action,
  size = "md",
  className,
  ...props
}: SectionHeaderProps) {
  const sizeConfig = {
    sm: {
      title: "text-base font-semibold",
      description: "text-xs",
    },
    md: {
      title: "text-lg font-semibold",
      description: "text-sm",
    },
    lg: {
      title: "text-xl font-bold",
      description: "text-base",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn("flex items-center justify-between gap-4", className)}
      {...props}
    >
      <div className="min-w-0">
        <h2 className={cn("text-gray-900 truncate", config.title)}>{title}</h2>
        {description && (
          <p className={cn("text-muted-foreground mt-0.5 truncate", config.description)}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { SectionHeader };
