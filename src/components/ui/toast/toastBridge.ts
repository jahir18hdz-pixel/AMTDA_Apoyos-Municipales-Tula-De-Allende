// toastBridge.ts
type ToastFn = (value: unknown, title?: string) => void;

let successHandler: ToastFn = () => {};
let errorHandler: ToastFn = () => {};

export function registerToastHandlers(success: ToastFn, error: ToastFn) {
  successHandler = success;
  errorHandler = error;
}

export function notifySuccess(value: unknown, title?: string) {
  successHandler(value, title);
}

export function notifyError(value: unknown, title?: string) {
  errorHandler(value, title);
}