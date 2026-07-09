import { createContext } from "react";

export type ToastType = "success" | "error";

export type ToastContextValue = {
  success: (value: unknown, title?: string) => void;
  error: (value: unknown, title?: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);