import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

type ErrorStateProps = {
  message: ReactNode;
};

export const ErrorState = ({ message }: ErrorStateProps) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 text-center">
    <TriangleAlert size={40} className="text-primary opacity-40" />
    <p className="text-md text-muted-foreground">{message}</p>
  </div>
);
