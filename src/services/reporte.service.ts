import { api } from "./api";

export interface FiltroReporte {
  anioInicio?: number;
  mesInicio?: number;
  anioFin?: number;
  mesFin?: number;
  comunidadIds?: string[];
  apoyoIds?: string[];
}

type TipoReporte = "pdf" | "excel";

function descargarArchivo(
  blob: Blob,
  nombreArchivo: string,
) {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
}

function obtenerNombreArchivo(
  contentDisposition: string | undefined,
  nombrePredeterminado: string,
) {
  if (!contentDisposition) {
    return nombrePredeterminado;
  }

  const filenameUtf8 = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (filenameUtf8?.[1]) {
    try {
      return decodeURIComponent(
        filenameUtf8[1].replace(/["']/g, "").trim(),
      );
    } catch {
      return filenameUtf8[1]
        .replace(/["']/g, "")
        .trim();
    }
  }

  const filenameNormal = contentDisposition.match(
    /filename="?([^";]+)"?/i,
  );

  if (filenameNormal?.[1]) {
    return filenameNormal[1].trim();
  }

  return nombrePredeterminado;
}

function limpiarFiltro(
  filtro: FiltroReporte,
): FiltroReporte {
  const filtroLimpio: FiltroReporte = {};

  if (filtro.anioInicio !== undefined) {
    filtroLimpio.anioInicio = filtro.anioInicio;
  }

  if (filtro.mesInicio !== undefined) {
    filtroLimpio.mesInicio = filtro.mesInicio;
  }

  if (filtro.anioFin !== undefined) {
    filtroLimpio.anioFin = filtro.anioFin;
  }

  if (filtro.mesFin !== undefined) {
    filtroLimpio.mesFin = filtro.mesFin;
  }

  if (filtro.comunidadIds?.length) {
    filtroLimpio.comunidadIds =
      filtro.comunidadIds;
  }

  if (filtro.apoyoIds?.length) {
    filtroLimpio.apoyoIds =
      filtro.apoyoIds;
  }

  return filtroLimpio;
}

function obtenerExtension(tipo: TipoReporte) {
  return tipo === "pdf" ? "pdf" : "xlsx";
}

async function descargarReportePost(
  endpoint: string,
  filtro: FiltroReporte,
  nombrePredeterminado: string,
) {
  const response = await api.post(
    endpoint,
    limpiarFiltro(filtro),
    {
      responseType: "blob",
    },
  );

  const nombreArchivo = obtenerNombreArchivo(
    response.headers["content-disposition"],
    nombrePredeterminado,
  );

  descargarArchivo(
    response.data as Blob,
    nombreArchivo,
  );
}

async function descargarReporteGet(
  endpoint: string,
  filtro: FiltroReporte,
  nombrePredeterminado: string,
) {
  const response = await api.get(endpoint, {
    params: limpiarFiltro(filtro),
    responseType: "blob",
    paramsSerializer: {
      indexes: null,
    },
  });

  const nombreArchivo = obtenerNombreArchivo(
    response.headers["content-disposition"],
    nombrePredeterminado,
  );

  descargarArchivo(
    response.data as Blob,
    nombreArchivo,
  );
}

export const reporteService = {
  // =========================================================
  // PDF
  // =========================================================

  async descargarReporteAnual(
    filtro: FiltroReporte = {},
  ) {
    await descargarReportePost(
      "/reportes/anual-comunidades",
      filtro,
      "reporte-comunidades.pdf",
    );
  },

  async descargarReportePorComunidad(
    comunidadId: string,
    filtro: FiltroReporte = {},
  ) {
    await descargarReportePost(
      `/reportes/por-comunidad/${comunidadId}`,
      filtro,
      "reporte-comunidad.pdf",
    );
  },

  // =========================================================
  // EXCEL
  // =========================================================

  async exportarComunidadesExcel(
    filtro: FiltroReporte = {},
  ) {
    await descargarReporteGet(
      "/reportes/comunidades/excel",
      filtro,
      "Comunidades.xlsx",
    );
  },

  async exportarApoyosPorComunidadExcel(
    comunidadId: string,
    filtro: FiltroReporte = {},
  ) {
    await descargarReporteGet(
      `/reportes/comunidades/${comunidadId}/apoyos/excel`,
      filtro,
      "Apoyos_Comunidad.xlsx",
    );
  },

  async exportarFondosExcel(
    filtro: FiltroReporte = {},
  ) {
    await descargarReporteGet(
      "/reportes/fondos/excel",
      filtro,
      "Fondos.xlsx",
    );
  },

  async exportarApoyosExcel(
    filtro: FiltroReporte = {},
  ) {
    await descargarReporteGet(
      "/reportes/apoyos/excel",
      filtro,
      "Apoyos.xlsx",
    );
  },

  // =========================================================
  // UTILIDADES
  // =========================================================

  obtenerExtension,
};