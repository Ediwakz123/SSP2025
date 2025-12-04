import * as React from "react";
import { cn } from "./utils";
import { CheckCircle2, Info, XCircle, AlertTriangle, X } from "lucide-react";

interface AlertMessageProps extends React.ComponentProps<"div"> {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * AlertMessage - Global alert/notification component
 * Provides consistent alert display across the application
 */
function AlertMessage({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
  ...props
}: AlertMessageProps) {
  const typeConfig = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      titleColor: "text-emerald-800",
      textColor: "text-emerald-700",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      titleColor: "text-red-800",
      textColor: "text-red-700",
      icon: XCircle,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      titleColor: "text-amber-800",
      textColor: "text-amber-700",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      titleColor: "text-blue-800",
      textColor: "text-blue-700",
      icon: Info,
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        config.bg,
        config.border,
        className
      )}
      role="alert"
      {...props}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          config.iconBg
        )}
      >
        <Icon className={cn("w-4 h-4", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("font-semibold mb-0.5", config.titleColor)}>
            {title}
          </p>
        )}
        <p className={cn("text-sm", config.textColor)}>{message}</p>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "shrink-0 p-1 rounded-lg transition-colors hover:bg-black/5",
            config.iconColor
          )}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export { AlertMessage };
