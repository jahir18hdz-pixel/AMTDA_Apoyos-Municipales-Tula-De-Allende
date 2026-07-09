import axios from "axios";

type ApiErrorResponse = {
  message?: string;
  mensaje?: string;
  error?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export function getToastMessage(value: unknown) {
  if (typeof value === "string") return value;

  if (axios.isAxiosError<ApiErrorResponse>(value)) {
    if (!value.response) {
      return "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
    }

    const data = value.response.data;

    if (typeof data === "string") return data;

    if (data?.mensaje) return data.mensaje;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    if (data?.title) return data.title;

    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      if (firstError) return firstError;
    }

    if (value.response.status === 401) {
      return "Credenciales incorrectas.";
    }

    if (value.response.status === 403) {
      return "No tienes permisos para realizar esta acción.";
    }

    if (value.response.status === 404) {
      return "No se encontró el recurso solicitado.";
    }

    if (value.response.status >= 500) {
      return "Ocurrió un error en el servidor.";
    }

    return "Ocurrió un error al procesar la solicitud.";
  }

  if (value instanceof Error) {
    return value.message;
  }

  return "Ocurrió un error inesperado.";
}