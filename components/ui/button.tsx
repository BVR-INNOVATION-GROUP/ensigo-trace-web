import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary py-4 text-white dark:text-[var(--background)] hover:bg-primary/90",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/20",
        outline:
          "border-[0.1] bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        pale: "bg-pale text-[var(--very-dark-color)] hover:bg-pale-dark",
        paper: "bg-paper text-[var(--very-dark-color)] hover:bg-pale",
      },
      size: {
        default: "h-13 px-5 py-2.5 has-[>svg]:px-4", // 1.35x Shopify: 59px height
        sm: "h-12 rounded-md gap-1.5 px-3.5 has-[>svg]:px-3", // 1.35x Shopify: 54px height
        lg: "h-16 rounded-md px-7 has-[>svg]:px-6", // 1.35x Shopify: 65px height
        icon: "size-13", // 1.35x Shopify: 26px × 26px
        "icon-sm": "size-12", // 1.35x Shopify: 24px × 24px
        "icon-lg": "size-16", // 1.35x Shopify: 32px × 32px
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? "button" : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{typeof children === 'string' ? children : 'Loading...'}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
