"use client";

import { ReactNode } from "react";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ThemeProvider } from "@/components/theme";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </ThemeProvider>
  );
}
