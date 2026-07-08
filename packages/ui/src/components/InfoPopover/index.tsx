import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/utils";

export interface InfoPopoverProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoPopover({ label, children, className }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <Info size={13} />
      </button>

      {open && (
        <div
          role="tooltip"
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-lg border border-border bg-popover p-3 text-left text-xs font-normal normal-case leading-relaxed text-popover-foreground shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}
