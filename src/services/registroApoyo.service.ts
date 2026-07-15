import { api } from "@/services/api";

import type {
  CatalogoOption,
  CrearRegistroApoyoForm,
  PaginatedResponse,
  RegistroApoyoDetalle,
  RegistroApoyoListado,
  RegistroApoyoPorId,
} from "@/types/registroApoyo.types";

const endpoint = "/RegistroApoyo";

function appendIfValue(
  formData: FormData,
  key: string,
  value: string,
) {
  const normalizedValue = value.trim();

  if (normalizedValue) {
    formData.append(key, normalizedValue);
  }
}

function crearFormData(data: CrearRegistroApoyoForm) {
  const formData = new FormData();

  formData.append("Folio", data.folio.trim());
  formData.append("ApoyoId", data.apoyoId);
  formData.append("ComunidadId", data.comunidadId);
  formData.append(
    "EstadoSolicitudId",
    data.estadoSolicitudId,
  );

  formData.append(
    "FechaApoyo",
    new Date(
      `${data.fechaApoyo}T00:00:00`,
    ).toISOString(),
  );

  formData.append("MontoOtorgado", data.montoOtorgado);

  appendIfValue(
    formData,
    "Observaciones",
    data.observaciones,
  );

  data.documentos.forEach((documento) => {
    if (!documento.archivo) return;

    formData.append("Archivos", documento.archivo);
    formData.append("Montos", documento.monto || "0");

    formData.append(
      "Descripciones",
      documento.descripcion.trim(),
    );

    formData.append(
      "TiposDocumento",
      documento.tipoDocumento,
    );
  });

  return formData;
}

export const registroApoyoService = {
  obtenerTodos(pageNumber = 1, pageSize = 10) {
    return api.get<
      PaginatedResponse<RegistroApoyoListado>
    >(endpoint, {
      params: {
        pageNumber,
        pageSize,
      },
    });
  },

  obtenerPorId(id: string) {
    return api.get<RegistroApoyoPorId>(
      `${endpoint}/${id}`,
    );
  },

  obtenerDetalle(id: string) {
    return api.get<RegistroApoyoDetalle>(
      `${endpoint}/${id}/detalle`,
    );
  },

  crear(data: CrearRegistroApoyoForm) {
    return api.post<string>(
      endpoint,
      crearFormData(data),
    );
  },

  actualizar(
    id: string,
    data: CrearRegistroApoyoForm,
  ) {
    return api.put(
      `${endpoint}/${id}`,
      crearFormData(data),
    );
  },

  cambiarEstado(
    id: string,
    estadoSolicitudId: string,
  ) {
    return api.patch(`${endpoint}/${id}/estado`, {
      estadoSolicitudId,
    });
  },

  agregarDocumentos(
    id: string,
    documentos: CrearRegistroApoyoForm["documentos"],
  ) {
    const formData = new FormData();

    documentos.forEach((documento) => {
      if (!documento.archivo) return;

      formData.append("Archivos", documento.archivo);
      formData.append("Montos", documento.monto || "0");

      formData.append(
        "Descripciones",
        documento.descripcion.trim(),
      );

      formData.append(
        "TiposDocumento",
        documento.tipoDocumento,
      );
    });

    return api.post(
      `${endpoint}/${id}/documentos`,
      formData,
    );
  },

  eliminar(id: string) {
    return api.delete(`${endpoint}/${id}`);
  },
};

export const registroApoyoCatalogosService = {
  obtenerComunidades() {
    return api.get<
      PaginatedResponse<CatalogoOption>
    >("/comunidades", {
      params: {
        pageNumber: 1,
        pageSize: 100,
      },
    });
  },

  obtenerApoyos() {
    return api.get<
      PaginatedResponse<CatalogoOption>
    >("/apoyos/activos", {
      params: {
        pageNumber: 1,
        pageSize: 100,
      },
    });
  },

  obtenerEstadosSolicitud() {
    return api.get<CatalogoOption[]>(
      `${endpoint}/estados-solicitud`,
    );
  },
};