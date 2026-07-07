import { api } from "./api";
import type {
  Comunidad,
  CrearComunidadRequest,
  PaginatedResponse,
} from "@/types/comunidad.types";

export const comunidadService = {
  obtenerTodas(pageNumber = 1, pageSize = 10) {
    return api.get<PaginatedResponse<Comunidad>>("/comunidades", {
      params: {
        pageNumber,
        pageSize,
      },
    });
  },

  obtenerInactivas(pageNumber = 1, pageSize = 10) {
    return api.get<PaginatedResponse<Comunidad>>("/comunidades/inactivas", {
      params: {
        pageNumber,
        pageSize,
      },
    });
  },

  crear(data: CrearComunidadRequest) {
    const formData = new FormData();

    formData.append("claveInterna", data.claveInterna);
    formData.append("nombre", data.nombre);
    formData.append("codigoPostal", data.codigoPostal);

    if (data.delegado) {
      formData.append("delegado", data.delegado);
    }

    if (data.telefonoDelegado) {
      formData.append("telefonoDelegado", data.telefonoDelegado);
    }

    if (data.delegadoIne) {
      formData.append("delegadoIne", data.delegadoIne);
    }

    return api.post("/comunidades", formData);
  },

  cambiarEstatus(id: string, activo: boolean) {
    return api.patch(`/comunidades/${id}/estatus`, {
      activo,
    });
  },

  actualizar(
    id: string,
    data: {
      claveInterna?: string;
      nombre?: string;
      codigoPostal?: string;
      delegado?: string;
      telefonoDelegado?: string;
    },
  ) {
    return api.patch(`/comunidades/${id}`, data);
  },

  actualizarIne(id: string, imagen: File) {
    const formData = new FormData();

    formData.append("imagen", imagen);

    return api.patch(`/comunidades/${id}/ine`, formData);
  },
};