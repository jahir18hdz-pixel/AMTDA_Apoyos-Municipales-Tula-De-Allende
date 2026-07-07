import { api } from "./api";

import type {
  ActualizarUsuarioDto,
  AsignarRolUsuarioDto,
  PaginatedResponse,
  RegistrarUsuarioDto,
  Usuario,
} from "../types/usuarios.types";

export async function obtenerUsuariosActivos(
  pageNumber = 1,
  pageSize = 10
): Promise<PaginatedResponse<Usuario>> {
  const response = await api.get<PaginatedResponse<Usuario>>(
    "/usuarios/activos",
    {
      params: { pageNumber, pageSize },
    }
  );

  return response.data;
}

export async function obtenerUsuariosInactivos(
  pageNumber = 1,
  pageSize = 10
): Promise<PaginatedResponse<Usuario>> {
  const response = await api.get<PaginatedResponse<Usuario>>(
    "/usuarios/inactivos",
    {
      params: { pageNumber, pageSize },
    }
  );

  return response.data;
}

export async function registrarUsuario(
  dto: RegistrarUsuarioDto
): Promise<{ mensaje: string }> {
  const response = await api.post<{ mensaje: string }>("/auth/registro", dto);
  return response.data;
}

export async function actualizarUsuario(
  id: string,
  dto: ActualizarUsuarioDto
): Promise<{ mensaje: string }> {
  const response = await api.patch<{ mensaje: string }>(
    `/usuarios/${id}`,
    dto
  );

  return response.data;
}

export async function cambiarEstatusUsuario(
  id: string,
  activo: boolean
): Promise<{ mensaje: string }> {
  const response = await api.patch<{ mensaje: string }>(
    `/usuarios/${id}/estatus`,
    { activo }
  );

  return response.data;
}

export async function asignarRolUsuario(
  id: string,
  dto: AsignarRolUsuarioDto
): Promise<{ mensaje: string }> {
  const response = await api.patch<{ mensaje: string }>(
    `/usuarios/${id}/asignar-rol`,
    dto
  );

  return response.data;
}