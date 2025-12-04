import * as React from "react";

import { cn } from "./utils";

interface CardProps extends React.ComponentProps<"div"> {
    variant?: "default" | "elevated" | "glass" | "interactive";
}

function Card({ className, variant = "default", ...props }: CardProps) {
    const variants = {
        default: "bg-card text-card-foreground border shadow-sm",
        elevated: "bg-card text-card-foreground border border-gray-100 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10 hover:-translate-y-1 transition-all duration-300",
        glass: "bg-white/85 backdrop-blur-xl border border-white/20 shadow-lg",
        interactive: "bg-card text-card-foreground border border-gray-100 shadow-md hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
    };

    return (
        <div
            data-slot="card"
            className={cn(
                "flex flex-col gap-6 rounded-2xl",
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
                className,
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <h4
            data-slot="card-title"
            className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <p
            data-slot="card-description"
            className={cn("text-sm text-muted-foreground leading-relaxed", className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn(
                "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
                className,
            )}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn("px-6 last:pb-6", className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("flex items-center gap-3 px-6 pb-6 [.border-t]:pt-6", className)}
            {...props}
        />
    );
}

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardAction,
    CardDescription,
    CardContent,
};
