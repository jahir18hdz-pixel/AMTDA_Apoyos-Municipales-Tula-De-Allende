import { api } from "@/services/api";
import type {
  ActualizarFondoDto,
  CambiarEstatusFondoDto,
  CrearFondoDto,
  Fondo,
  PaginatedResponse,
} from "../types/fondos.types";

const endpoint = "/apoyos";

export async function obtenerFondosActivos(pageNumber = 1, pageSize = 10) {
  const { data } = await api.get<PaginatedResponse<Fondo>>(
    `${endpoint}/activos`,
    { params: { pageNumber, pageSize } }
  );

  return data;
}

export async function obtenerFondosInactivos(pageNumber = 1, pageSize = 10) {
  const { data } = await api.get<PaginatedResponse<Fondo>>(
    `${endpoint}/inactivos`,
    { params: { pageNumber, pageSize } }
  );

  return data;
}

export async function crearFondo(dto: CrearFondoDto) {
  const { data } = await api.post(endpoint, dto);
  return data;
}

export async function actualizarFondo(id: string, dto: ActualizarFondoDto) {
  const { data } = await api.patch(`${endpoint}/${id}`, dto);
  return data;
}

export async function cambiarEstatusFondo(
  id: string,
  dto: CambiarEstatusFondoDto
) {
  const { data } = await api.patch(`${endpoint}/${id}/estatus`, dto);
  return data;
}

export async function eliminarFondo(id: string) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data;
}