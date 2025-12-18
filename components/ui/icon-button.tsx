import * as React from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeStyles = {
      sm: { width: "32px", height: "32px" },
      md: { width: "36px", height: "36px" },
      lg: { width: "40px", height: "40px" },
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-all",
          "hover:bg-pale cursor-pointer",
          "disabled:pointer-events-none disabled:opacity-50",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
        style={sizeStyles[size]}
        {...props}
      />
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };

