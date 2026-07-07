import { api } from "@/services/api";
import type {
  ActualizarPermisoRequest,
  CambiarEstatusPermisoRequest,
  CrearPermisoRequest,
  PaginatedResponse,
  Permiso,
} from "../types/permisos.types";

type ApiObject = Record<string, unknown>;

function isObject(value: unknown): value is ApiObject {
  return typeof value === "object" && value !== null;
}

function getArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (isObject(value) && Array.isArray(value.$values)) {
    return value.$values as T[];
  }

  return [];
}

function normalizarPaginado<T>(data: unknown): PaginatedResponse<T> {
  if (!isObject(data)) return { items: [] };

  const rawItems =
    data.items ??
    data.Items ??
    data.data ??
    data.Data ??
    data.resultados ??
    data.Resultados ??
    data.$values ??
    [];

  return {
    items: getArray<T>(rawItems),
    totalItems: data.totalItems as number | undefined,
    pageNumber: data.pageNumber as number | undefined,
    pageSize: data.pageSize as number | undefined,
    totalPages: data.totalPages as number | undefined,
  };
}

export const permisoService = {
  async obtenerActivos(pageNumber = 1, pageSize = 50) {
    const { data } = await api.get("/permisos/activos", {
      params: { pageNumber, pageSize },
    });

    return { data: normalizarPaginado<Permiso>(data) };
  },

  async obtenerInactivos(pageNumber = 1, pageSize = 50) {
    const { data } = await api.get("/permisos/inactivos", {
      params: { pageNumber, pageSize },
    });

    return { data: normalizarPaginado<Permiso>(data) };
  },

  obtenerPorId(id: string) {
    return api.get<Permiso>(`/permisos/${id}`);
  },

  obtenerPorModulo(modulo: string) {
    return api.get<Permiso[]>(`/permisos/modulo/${modulo}`);
  },

  crear(data: CrearPermisoRequest) {
    return api.post("/permisos", data);
  },

  actualizar(id: string, data: ActualizarPermisoRequest) {
    return api.patch(`/permisos/${id}`, data);
  },

  cambiarEstatus(id: string, data: CambiarEstatusPermisoRequest) {
    return api.patch(`/permisos/${id}/estatus`, data);
  },
};