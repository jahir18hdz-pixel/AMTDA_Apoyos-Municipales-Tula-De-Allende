import { api } from "@/services/api";
import type {
  ActualizarRolRequest,
  CambiarEstatusRolRequest,
  CrearRolRequest,
  PaginatedResponse,
  Rol,
  RolPermiso,
  UpsertPermisoRolRequest,
} from "@/types/rol.types";

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
  if (!isObject(data)) {
    return { items: [] };
  }

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

export const rolService = {
  async obtenerActivos(pageNumber = 1, pageSize = 10) {
    const { data } = await api.get("/roles/activos", {
      params: { pageNumber, pageSize },
    });

    return { data: normalizarPaginado<Rol>(data) };
  },

  async obtenerInactivos(pageNumber = 1, pageSize = 10) {
    const { data } = await api.get("/roles/inactivos", {
      params: { pageNumber, pageSize },
    });

    return { data: normalizarPaginado<Rol>(data) };
  },

  obtenerPorId(id: string) {
    return api.get<Rol>(`/roles/${id}`);
  },

  crear(data: CrearRolRequest) {
    return api.post("/roles", data);
  },

  actualizar(id: string, data: ActualizarRolRequest) {
    return api.put(`/roles/${id}`, data);
  },

  cambiarEstatus(id: string, data: CambiarEstatusRolRequest) {
    return api.patch(`/roles/${id}/estatus`, data);
  },

  obtenerPermisos(rolId: string) {
    return api.get<RolPermiso[]>(`/roles/${rolId}/permisos`);
  },

  actualizarPermiso(rolId: string, data: UpsertPermisoRolRequest) {
    return api.patch(`/roles/${rolId}/permisos`, data);
  },
};
