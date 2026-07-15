import { api } from "./api";

export interface FiltroReporte {
  anioInicio?: number;
  mesInicio?: number;
  anioFin?: number;
  mesFin?: number;
  comunidadIds?: string[];
  apoyoIds?: string[];
}

function descargarArchivo(
  blob: Blob,
  nombreArchivo: string,
) {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  window.URL.revokeObjectURL(url);
}

function obtenerNombreArchivo(
  contentDisposition: string | undefined,
  nombrePredeterminado: string,
) {
  if (!contentDisposition) {
    return nombrePredeterminado;
  }

  const coincidencia = contentDisposition.match(
    /filename\*?=(?:UTF-8''|")?([^";]+)/i,
  );

  if (!coincidencia?.[1]) {
    return nombrePredeterminado;
  }

  return decodeURIComponent(
    coincidencia[1].replace(/"/g, "").trim(),
  );
}

export const reporteService = {
  async descargarReporteAnual(
    filtro: FiltroReporte = {},
  ) {
    const response = await api.post(
      "/reportes/anual-comunidades",
      filtro,
      {
        responseType: "blob",
      },
    );

    const nombreArchivo = obtenerNombreArchivo(
      response.headers["content-disposition"],
      "reporte-comunidades.pdf",
    );

    descargarArchivo(response.data, nombreArchivo);
  },

  async descargarReportePorComunidad(
    comunidadId: string,
    filtro: FiltroReporte = {},
  ) {
    const response = await api.post(
      `/reportes/por-comunidad/${comunidadId}`,
      filtro,
      {
        responseType: "blob",
      },
    );

    const nombreArchivo = obtenerNombreArchivo(
      response.headers["content-disposition"],
      "reporte-comunidad.pdf",
    );

    descargarArchivo(response.data, nombreArchivo);
  },
};