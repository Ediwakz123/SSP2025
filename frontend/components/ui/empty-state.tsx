import * as React from "react";
import { cn } from "./utils";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact" | "card";
}

/**
 * EmptyState - Global empty state component
 * Provides consistent empty/no-data states across the application
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  const defaultIcon = (
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
      <AlertCircle className="w-8 h-8 text-gray-400" />
    </div>
  );

  const content = (
    <>
      {icon || defaultIcon}
      <div className="text-center space-y-1 mt-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </>
  );

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 px-4",
          className
        )}
        {...props}
      >
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          {icon || <AlertCircle className="w-6 h-6 text-gray-400" />}
        </div>
        <p className="text-sm text-muted-foreground mt-3">{title}</p>
        {action && (
          <Button variant="outline" size="sm" onClick={action.onClick} className="mt-3">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
      {...props}
    >
      {content}
    </div>
  );
}

export { EmptyState };
