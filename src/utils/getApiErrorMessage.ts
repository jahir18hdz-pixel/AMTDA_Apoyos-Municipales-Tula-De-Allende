import axios from "axios";

type ApiErrorResponse = {
  message?: string;
  mensaje?: string;
  error?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    if (data?.mensaje) return data.mensaje;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.title) return data.title;

    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      if (firstError) return firstError;
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}