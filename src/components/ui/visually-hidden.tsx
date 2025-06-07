
import * as React from "react"
import { cn } from "@/lib/utils"

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
}

const VisuallyHidden = React.forwardRef<HTMLElement, VisuallyHiddenProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "span"
    
    if (asChild) {
      return <React.Fragment {...props} />
    }
    
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn(
          "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
          className
        )}
        {...props}
      />
    )
  }
)
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
