import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Toast from "./Toast";
import { ToastContext, type ToastType } from "./ToastContext";
import { getToastMessage } from "./getToastMessage";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  open: boolean;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const closeToast = useCallback(() => {
    setToast((current) => {
      if (!current) return null;

      return {
        ...current,
        open: false,
      };
    });

    window.setTimeout(() => {
      setToast(null);
    }, 260);
  }, []);

  const showToast = useCallback(
    (type: ToastType, value: unknown, title?: string) => {
      setToast({
        id: crypto.randomUUID(),
        type,
        message: getToastMessage(value),
        title,
        open: true,
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      success: (message: unknown, title?: string) =>
        showToast("success", message, title),
      error: (error: unknown, title?: string) =>
        showToast("error", error, title),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast && (
        <Toast
          key={toast.id}
          open={toast.open}
          type={toast.type}
          message={toast.message}
          title={toast.title}
          onClose={closeToast}
        />
      )}
    </ToastContext.Provider>
  );
}