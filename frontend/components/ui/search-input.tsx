import * as React from "react";
import { cn } from "./utils";
import { LucideIcon, Search, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  icon?: LucideIcon;
}

/**
 * SearchInput - Global search input component
 * Provides consistent search functionality across the application
 */
function SearchInput({
  value,
  onChange,
  onClear,
  icon: CustomIcon,
  placeholder = "Search...",
  className,
  ...props
}: SearchInputProps) {
  const Icon = CustomIcon || Search;

  const handleClear = () => {
    onChange("");
    onClear?.();
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Icon className="w-4 h-4" />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pl-11", value && "pr-10")}
        {...props}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export { SearchInput };
