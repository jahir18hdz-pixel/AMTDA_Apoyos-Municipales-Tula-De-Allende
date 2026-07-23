import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiCalendar,
  FiCheck,
  FiDownload,
  FiFileText,
  FiFilter,
  FiMapPin,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import {
  FileSpreadsheet,
  HandHelping,
  Landmark,
  LoaderCircle,
  Wallet,
} from "lucide-react";

import { comunidadService } from "@/services/comunidad.service";
import {
  reporteService,
  type FiltroReporte,
} from "@/services/reporte.service";
import type { Comunidad } from "@/types/comunidad.types";
import { useToast } from "@/components/ui/toast/useToast";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

import styles from "./componentes/reportesPage.module.css";

type TipoReporte =
  | "resumen-general"
  | "comunidad"
  | "comunidades"
  | "fondos"
  | "apoyos";

type FormatoReporte = "pdf" | "excel";

type Permiso =
  | string
  | {
      permiso: string;
    };

type BackendPaginatedResult<T> = {
  Items?: T[];
  items?: T[];
};

type ReporteOption = {
  id: TipoReporte;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  formatos: FormatoReporte[];
};

const REPORTES: ReporteOption[] = [
  {
    id: "resumen-general",
    titulo: "Resumen general",
    descripcion:
      "Totales, distribución y comportamiento de los apoyos por comunidad.",
    icono: <Landmark size={22} />,
    formatos: ["pdf"],
  },
  {
    id: "comunidad",
    titulo: "Comunidad específica",
    descripcion:
      "Consulta el detalle de apoyos otorgados a una comunidad seleccionada.",
    icono: <FiMapPin size={22} />,
    formatos: ["pdf", "excel"],
  },
  {
    id: "comunidades",
    titulo: "Listado de comunidades",
    descripcion:
      "Exporta el catálogo y la información disponible de las comunidades.",
    icono: <FiUsers size={22} />,
    formatos: ["excel"],
  },
  {
    id: "fondos",
    titulo: "Fondos",
    descripcion:
      "Exporta el catálogo de fondos y sus datos principales.",
    icono: <Wallet size={22} />,
    formatos: ["excel"],
  },
  {
    id: "apoyos",
    titulo: "Apoyos",
    descripcion:
      "Exporta el historial general de apoyos registrados en el sistema.",
    icono: <HandHelping size={22} />,
    formatos: ["excel"],
  },
];

function obtenerPeriodoInicial() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");

  return {
    inicio: `${anio}-01`,
    fin: `${anio}-${mes}`,
  };
}

function getUserPermissions() {
  const rawUser = localStorage.getItem("presi2_auth");

  if (!rawUser) return [];

  try {
    const user = JSON.parse(rawUser) as {
      permisos?: Permiso[];
      permissions?: Permiso[];
    };

    const permisosRaw =
      user.permisos ??
      user.permissions ??
      [];

    return permisosRaw
      .map((permiso) =>
        typeof permiso === "string"
          ? permiso
          : permiso.permiso,
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getItems<T>(
  data: BackendPaginatedResult<T>,
) {
  return data.Items ?? data.items ?? [];
}

function convertirPeriodoAFiltro(
  periodoInicio: string,
  periodoFin: string,
): FiltroReporte {
  const [anioInicio, mesInicio] =
    periodoInicio.split("-").map(Number);

  const [anioFin, mesFin] =
    periodoFin.split("-").map(Number);

  return {
    anioInicio,
    mesInicio,
    anioFin,
    mesFin,
  };
}

function formatearPeriodo(periodo: string) {
  if (!periodo) return "Sin definir";

  const [anio, mes] = periodo
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, 1));
}

export default function ReportesPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const permisos = useMemo(
    () => getUserPermissions(),
    [],
  );

  const puedePdf = permisos.includes(
    "reportes.pdf",
  );

  const puedeExcel = permisos.includes(
    "reportes.excel",
  );

  const periodoInicial = useMemo(
    () => obtenerPeriodoInicial(),
    [],
  );

  const tipoInicial =
    (searchParams.get(
      "tipo",
    ) as TipoReporte | null) ??
    "resumen-general";

  const comunidadInicial =
    searchParams.get("comunidadId") ?? "";

  const reporteInicial =
    REPORTES.find(
      (reporte) => reporte.id === tipoInicial,
    ) ?? REPORTES[0];

  const [tipoReporte, setTipoReporte] =
    useState<TipoReporte>(reporteInicial.id);

  const [formato, setFormato] =
    useState<FormatoReporte>(
      reporteInicial.formatos[0],
    );

  const [
    periodoInicio,
    setPeriodoInicio,
  ] = useState(periodoInicial.inicio);

  const [periodoFin, setPeriodoFin] =
    useState(periodoInicial.fin);

  const [
    comunidadId,
    setComunidadId,
  ] = useState(comunidadInicial);

  const [
    comunidades,
    setComunidades,
  ] = useState<Comunidad[]>([]);

  const [
    cargandoComunidades,
    setCargandoComunidades,
  ] = useState(true);

  const [generando, setGenerando] =
    useState(false);

  const reporteSeleccionado = useMemo(
    () =>
      REPORTES.find(
        (reporte) =>
          reporte.id === tipoReporte,
      ) ?? REPORTES[0],
    [tipoReporte],
  );

  const formatosPermitidos =
    reporteSeleccionado.formatos;

  const comunidadSeleccionada =
    useMemo(
      () =>
        comunidades.find(
          (comunidad) =>
            comunidad.id === comunidadId,
        ),
      [comunidades, comunidadId],
    );

  useEffect(() => {
    let cancelado = false;

    async function obtenerComunidades() {
      try {
        const response =
          await comunidadService.obtenerTodas(
            1,
            500,
          );

        if (cancelado) return;

        const data =
          response.data as BackendPaginatedResult<Comunidad>;

        setComunidades(getItems(data));
      } catch (error) {
        if (cancelado) return;

        setComunidades([]);
        toast.error(
          getApiErrorMessage(error),
        );
      } finally {
        if (!cancelado) {
          setCargandoComunidades(false);
        }
      }
    }

    void obtenerComunidades();

    return () => {
      cancelado = true;
    };
  }, [toast]);

  function seleccionarReporte(
    tipo: TipoReporte,
  ) {
    setTipoReporte(tipo);

    const nuevoReporte = REPORTES.find(
      (reporte) => reporte.id === tipo,
    );

    if (
      nuevoReporte &&
      !nuevoReporte.formatos.includes(
        formato,
      )
    ) {
      setFormato(
        nuevoReporte.formatos[0],
      );
    }
  }

  function validarFormulario() {
    if (
      !periodoInicio ||
      !periodoFin
    ) {
      toast.error(
        "Selecciona el periodo inicial y final.",
      );
      return false;
    }

    if (periodoInicio > periodoFin) {
      toast.error(
        "El periodo inicial no puede ser posterior al periodo final.",
      );
      return false;
    }

    if (
      tipoReporte === "comunidad" &&
      !comunidadId
    ) {
      toast.error(
        "Selecciona una comunidad.",
      );
      return false;
    }

    if (
      formato === "pdf" &&
      !puedePdf
    ) {
      toast.error(
        "No tienes permiso para descargar reportes PDF.",
      );
      return false;
    }

    if (
      formato === "excel" &&
      !puedeExcel
    ) {
      toast.error(
        "No tienes permiso para exportar reportes Excel.",
      );
      return false;
    }

    return true;
  }

  async function generarReporte() {
    if (!validarFormulario()) return;

    const filtro =
      convertirPeriodoAFiltro(
        periodoInicio,
        periodoFin,
      );

    try {
      setGenerando(true);

      switch (tipoReporte) {
        case "resumen-general":
          await reporteService.descargarReporteAnual(
            filtro,
          );
          break;

        case "comunidad":
          if (formato === "pdf") {
            await reporteService.descargarReportePorComunidad(
              comunidadId,
              filtro,
            );
          } else {
            await reporteService.exportarApoyosPorComunidadExcel(
              comunidadId,
              filtro,
            );
          }
          break;

        case "comunidades":
          await reporteService.exportarComunidadesExcel(
            filtro,
          );
          break;

        case "fondos":
          await reporteService.exportarFondosExcel(
            filtro,
          );
          break;

        case "apoyos":
          await reporteService.exportarApoyosExcel(
            filtro,
          );
          break;
      }

      toast.success(
        formato === "pdf"
          ? "Reporte PDF descargado correctamente."
          : "Reporte Excel descargado correctamente.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setGenerando(false);
    }
  }

  function restablecerFiltros() {
    setPeriodoInicio(
      periodoInicial.inicio,
    );
    setPeriodoFin(periodoInicial.fin);
    setComunidadId("");
  }

  return (
    <main
      className={styles.page}
      aria-label="Generador de reportes"
    >
      

      <section className={styles.content}>
        <div className={styles.reportSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span
                className={
                  styles.sectionNumber
                }
              >
                1
              </span>

              <div>
                <h2>
                  Selecciona el reporte
                </h2>
                <p>
                  Elige la información que
                  deseas consultar.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.reportGrid}>
            {REPORTES.map((reporte) => {
              const seleccionado =
                reporte.id === tipoReporte;

              return (
                <button
                  key={reporte.id}
                  type="button"
                  className={`${styles.reportCard} ${
                    seleccionado
                      ? styles.reportCardActive
                      : ""
                  }`}
                  onClick={() =>
                    seleccionarReporte(
                      reporte.id,
                    )
                  }
                  aria-pressed={seleccionado}
                >
                  <span
                    className={
                      styles.reportCardIcon
                    }
                  >
                    {reporte.icono}
                  </span>

                  <span
                    className={
                      styles.reportCardContent
                    }
                  >
                    <strong>
                      {reporte.titulo}
                    </strong>
                    <small>
                      {reporte.descripcion}
                    </small>
                  </span>

                  <span
                    className={
                      styles.reportFormats
                    }
                  >
                    {reporte.formatos.map(
                      (item) => (
                        <em key={item}>
                          {item.toUpperCase()}
                        </em>
                      ),
                    )}
                  </span>

                  {seleccionado && (
                    <span
                      className={
                        styles.selectedCheck
                      }
                    >
                      <FiCheck />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.configurationGrid}>
          <section
            className={styles.formSection}
          >
            <div
              className={styles.sectionHeading}
            >
              <div>
                <span
                  className={
                    styles.sectionNumber
                  }
                >
                  2
                </span>

                <div>
                  <h2>
                    Configura los filtros
                  </h2>
                  <p>
                    Define el periodo que
                    aparecerá en el reporte.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={
                  styles.resetButton
                }
                onClick={restablecerFiltros}
                disabled={generando}
              >
                <FiRefreshCw />
                Restablecer
              </button>
            </div>

            <div className={styles.formBody}>
              <div
                className={styles.periodGrid}
              >
                <label
                  className={styles.field}
                >
                  <span>
                    <FiCalendar />
                    Periodo inicial
                  </span>

                  <input
                    type="month"
                    value={periodoInicio}
                    onChange={(event) =>
                      setPeriodoInicio(
                        event.target.value,
                      )
                    }
                    disabled={generando}
                  />
                </label>

                <label
                  className={styles.field}
                >
                  <span>
                    <FiCalendar />
                    Periodo final
                  </span>

                  <input
                    type="month"
                    value={periodoFin}
                    onChange={(event) =>
                      setPeriodoFin(
                        event.target.value,
                      )
                    }
                    disabled={generando}
                  />
                </label>
              </div>

              {tipoReporte ===
                "comunidad" && (
                <label
                  className={styles.field}
                >
                  <span>
                    <FiMapPin />
                    Comunidad
                  </span>

                  <select
                    value={comunidadId}
                    onChange={(event) =>
                      setComunidadId(
                        event.target.value,
                      )
                    }
                    disabled={
                      cargandoComunidades ||
                      generando
                    }
                  >
                    <option value="">
                      {cargandoComunidades
                        ? "Cargando comunidades..."
                        : "Selecciona una comunidad"}
                    </option>

                    {comunidades.map(
                      (comunidad) => (
                        <option
                          key={comunidad.id}
                          value={comunidad.id}
                        >
                          {
                            comunidad.claveInterna
                          }{" "}
                          - {comunidad.nombre}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}

              <div
                className={styles.formatBlock}
              >
                <span
                  className={
                    styles.formatLabel
                  }
                >
                  <FiDownload />
                  Formato de descarga
                </span>

                <div
                  className={
                    styles.formatOptions
                  }
                >
                  <button
                    type="button"
                    className={`${styles.formatButton} ${
                      formato === "pdf"
                        ? styles.formatButtonActive
                        : ""
                    }`}
                    onClick={() =>
                      setFormato("pdf")
                    }
                    disabled={
                      !formatosPermitidos.includes(
                        "pdf",
                      ) ||
                      !puedePdf ||
                      generando
                    }
                  >
                    <FiFileText />
                    <span>
                      <strong>PDF</strong>
                      <small>
                        Documento listo para
                        imprimir
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.formatButton} ${
                      formato === "excel"
                        ? styles.formatButtonActive
                        : ""
                    }`}
                    onClick={() =>
                      setFormato("excel")
                    }
                    disabled={
                      !formatosPermitidos.includes(
                        "excel",
                      ) ||
                      !puedeExcel ||
                      generando
                    }
                  >
                    <FileSpreadsheet
                      size={19}
                    />
                    <span>
                      <strong>Excel</strong>
                      <small>
                        Hoja de cálculo editable
                      </small>
                    </span>
                  </button>
                </div>

                {!puedePdf &&
                  !puedeExcel && (
                    <p
                      className={
                        styles.permissionWarning
                      }
                    >
                      No tienes permisos para
                      descargar reportes.
                    </p>
                  )}
              </div>
            </div>
          </section>

          <aside className={styles.summary}>
            <div
              className={
                styles.summaryHeading
              }
            >
              <span
                className={
                  styles.summaryIcon
                }
              >
                <FiFilter />
              </span>

              <div>
                <h2>
                  Resumen de selección
                </h2>
                <p>
                  Revisa la configuración antes
                  de descargar.
                </p>
              </div>
            </div>

            <div className={styles.summaryList}>
              <div
                className={styles.summaryRow}
              >
                <span>Reporte</span>
                <strong>
                  {
                    reporteSeleccionado.titulo
                  }
                </strong>
              </div>

              <div
                className={styles.summaryRow}
              >
                <span>Desde</span>
                <strong>
                  {formatearPeriodo(
                    periodoInicio,
                  )}
                </strong>
              </div>

              <div
                className={styles.summaryRow}
              >
                <span>Hasta</span>
                <strong>
                  {formatearPeriodo(
                    periodoFin,
                  )}
                </strong>
              </div>

              {tipoReporte ===
                "comunidad" && (
                <div
                  className={
                    styles.summaryRow
                  }
                >
                  <span>Comunidad</span>
                  <strong>
                    {comunidadSeleccionada?.nombre ??
                      "Sin seleccionar"}
                  </strong>
                </div>
              )}

              <div
                className={styles.summaryRow}
              >
                <span>Formato</span>
                <strong>
                  {formato.toUpperCase()}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className={
                styles.downloadButton
              }
              onClick={() =>
                void generarReporte()
              }
              disabled={
                generando ||
                (formato === "pdf" &&
                  !puedePdf) ||
                (formato === "excel" &&
                  !puedeExcel)
              }
            >
              {generando ? (
                <>
                  <LoaderCircle
                    className={
                      styles.spinner
                    }
                    size={18}
                  />
                  Generando reporte...
                </>
              ) : (
                <>
                  <FiDownload />
                  Descargar{" "}
                  {formato.toUpperCase()}
                </>
              )}
            </button>

            <p className={styles.summaryNote}>
              El archivo se descargará
              automáticamente cuando termine de
              generarse.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}