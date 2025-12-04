import * as React from "react";

import { cn } from "./utils";

interface InputProps extends React.ComponentProps<"input"> {
    error?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
}

function Input({ 
    className, 
    type, 
    error = false,
    icon,
    iconPosition = "left",
    ...props 
}: InputProps) {
    const inputClasses = cn(
        // Base styles
        "flex h-11 w-full min-w-0 rounded-xl border px-4 py-2.5 text-base transition-all duration-200 outline-none",
        // Background & text
        "bg-white/80 text-foreground placeholder:text-muted-foreground",
        // Border & focus
        "border-input hover:border-gray-300",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        // Dark mode
        "dark:bg-input/30 dark:hover:border-input/80",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
        // File input
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Selection
        "selection:bg-primary selection:text-primary-foreground",
        // Error state
        error && "border-destructive focus:border-destructive focus:ring-destructive/20 dark:border-destructive",
        // Responsive text
        "md:text-sm",
        // Icon padding
        icon && iconPosition === "left" && "pl-11",
        icon && iconPosition === "right" && "pr-11",
        className,
    );

    if (icon) {
        return (
            <div className="relative">
                <div 
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
                        iconPosition === "left" ? "left-3.5" : "right-3.5"
                    )}
                >
                    {icon}
                </div>
                <input
                    type={type}
                    data-slot="input"
                    className={inputClasses}
                    aria-invalid={error || undefined}
                    {...props}
                />
            </div>
        );
    }

    return (
        <input
            type={type}
            data-slot="input"
            className={inputClasses}
            aria-invalid={error || undefined}
            {...props}
        />
    );
}

export { Input };
