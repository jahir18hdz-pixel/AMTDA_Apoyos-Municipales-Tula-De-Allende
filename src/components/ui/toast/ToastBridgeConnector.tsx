// ToastBridgeConnector.tsx
import { useEffect } from "react";
import { useToast } from "./useToast";
import { registerToastHandlers } from "./toastBridge";

export function ToastBridgeConnector() {
  const toast = useToast();

  useEffect(() => {
    registerToastHandlers(toast.success, toast.error);
  }, [toast]);

  return null;
}