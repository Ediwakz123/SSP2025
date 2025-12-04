import * as React from "react";
import { cn } from "./utils";
import { AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle } from "lucide-react";

interface StatusBadgeProps extends React.ComponentProps<"div"> {
  status: "success" | "error" | "warning" | "info" | "neutral";
  text?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * StatusBadge - Global status indicator component
 * Provides consistent status display across the application
 */
function StatusBadge({
  status,
  text,
  showIcon = true,
  size = "md",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const statusConfig = {
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      icon: XCircle,
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-200",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      icon: Info,
    },
    neutral: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
      icon: AlertCircle,
    },
  };

  const sizeClasses = {
    sm: {
      wrapper: "px-2 py-0.5 text-xs gap-1",
      icon: "w-3 h-3",
    },
    md: {
      wrapper: "px-2.5 py-1 text-sm gap-1.5",
      icon: "w-4 h-4",
    },
    lg: {
      wrapper: "px-3 py-1.5 text-base gap-2",
      icon: "w-5 h-5",
    },
  };

  const config = statusConfig[status];
  const sizeConfig = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        config.bg,
        config.text,
        config.border,
        sizeConfig.wrapper,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      {text || children}
    </div>
  );
}

export { StatusBadge };
