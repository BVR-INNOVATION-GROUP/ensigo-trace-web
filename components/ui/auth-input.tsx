import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, type, icon, endAdornment, ...props }, ref) => {
    return (
      <div className="h-12 w-full rounded-md bg-[var(--background)] border border-transparent focus-within:border-primary transition-colors">
        <div className="h-full w-full flex items-center gap-3 px-4">
          {icon && <span className="text-[var(--placeholder)] flex-shrink-0">{icon}</span>}
          <input
            type={type}
            className={cn(
              "h-full w-full bg-transparent border-0 p-0 text-body",
              "placeholder:text-[var(--very-dark-color)]/40",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
          />
          {endAdornment && (
            <span className="text-[var(--placeholder)] flex-shrink-0">{endAdornment}</span>
          )}
        </div>
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";

export { AuthInput };

