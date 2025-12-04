import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./utils";

interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "overlay" | "inline" | "page";
  text?: string;
}

/**
 * LoadingSpinner - Global loading indicator component
 * Provides consistent loading states across the application
 */
function LoadingSpinner({
  size = "md",
  variant = "default",
  text,
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const spinner = (
    <Loader2
      className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )}
    />
  );

  if (variant === "page") {
    return (
      <div
        className={cn(
          "min-h-screen flex flex-col items-center justify-center gap-4",
          className
        )}
        {...props}
      >
        {spinner}
        {text && (
          <p className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center gap-3">
          {spinner}
          {text && (
            <p className={cn("text-muted-foreground", textSizeClasses[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={cn("inline-flex items-center gap-2", className)}
        {...props}
      >
        {spinner}
        {text && (
          <span className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </span>
    );
  }

  // Default variant - centered box
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8",
        className
      )}
      {...props}
    >
      {spinner}
      {text && (
        <p className={cn("text-muted-foreground", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

export { LoadingSpinner };
