"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      closeButton
      toastOptions={{
        style: {
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
        },
        classNames: {
          success: "toast-success",
          error: "toast-error",
          info: "toast-info",
        },
      }}
      style={
        {
          "--success-bg": "var(--bg-card)",
          "--success-border": "rgba(52,211,153,0.3)",
          "--success-text": "#34d399",
          "--error-bg": "var(--bg-card)",
          "--error-border": "rgba(239,68,68,0.3)",
          "--error-text": "#f87171",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
