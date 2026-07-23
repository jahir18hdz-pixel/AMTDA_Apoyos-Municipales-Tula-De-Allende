import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiCalendar,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "../../components/ui/confirm-modal/ConfirmModal";
import { comunidadService } from "@/services/comunidad.service";
import {
  reporteService,
  type FiltroReporte,
} from "@/services/reporte.service";
import type {
  Comunidad,
  CrearComunidadRequest,
} from "@/types/comunidad.types";
import { useToast } from "@/components/ui/toast/useToast";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import styles from "./componentes/comunidadesPage.module.css";

const REGISTROS_POR_PAGINA = 10;

const initialForm: CrearComunidadRequest = {
  claveInterna: "",
  nombre: "",
  codigoPostal: "",
  delegado: "",
  telefonoDelegado: "",
  delegadoIne: null,
};

type ConfirmVariant =
  | "danger"
  | "warning"
  | "success"
  | "default";

type FormatoReporte = "pdf" | "excel";

type ReporteSeleccionado = {
  open: boolean;
  formato: FormatoReporte;
  comunidad: Comunidad | null;
};

function obtenerPeriodoInicial() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");

  return {
    periodoInicio: `${anio}-01`,
    periodoFin: `${anio}-${mes}`,
  };
}

function convertirPeriodoAFiltro(
  periodoInicio: string,
  periodoFin: string,
): FiltroReporte {
  const [anioInicio, mesInicio] = periodoInicio
    .split("-")
    .map(Number);

  const [anioFin, mesFin] = periodoFin
    .split("-")
    .map(Number);

  return {
    anioInicio,
    mesInicio,
    anioFin,
    mesFin,
  };
}

const initialConfirmacion = {
  open: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  variant: "default" as ConfirmVariant,
  loading: false,
  action: null as (() => Promise<void>) | null,
};

type BackendPaginatedResult<T> = {
  Items?: T[];
  items?: T[];
  PageNumber?: number;
  pageNumber?: number;
  PageSize?: number;
  pageSize?: number;
  TotalRecords?: number;
  totalRecords?: number;
  TotalPages?: number;
  totalPages?: number;
  HasPreviousPage?: boolean;
  hasPreviousPage?: boolean;
  HasNextPage?: boolean;
  hasNextPage?: boolean;
};

type PaginationMeta = {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

const initialPagination: PaginationMeta = {
  pageNumber: 1,
  pageSize: REGISTROS_POR_PAGINA,
  totalRecords: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

type Permiso =
  | string
  | {
      permiso: string;
    };

function getItems<T>(
  data: BackendPaginatedResult<T>,
) {
  return data.Items ?? data.items ?? [];
}

function getPaginationMeta<T>(
  data: BackendPaginatedResult<T>,
): PaginationMeta {
  return {
    pageNumber:
      data.PageNumber ??
      data.pageNumber ??
      1,
    pageSize:
      data.PageSize ??
      data.pageSize ??
      REGISTROS_POR_PAGINA,
    totalRecords:
      data.TotalRecords ??
      data.totalRecords ??
      0,
    totalPages:
      data.TotalPages ??
      data.totalPages ??
      1,
    hasPreviousPage:
      data.HasPreviousPage ??
      data.hasPreviousPage ??
      false,
    hasNextPage:
      data.HasNextPage ??
      data.hasNextPage ??
      false,
  };
}

function getUserPermissions() {
  const rawUser =
    localStorage.getItem("presi2_auth");

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

function capitalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(
      /\b\p{L}/gu,
      (letter) => letter.toUpperCase(),
    );
}

function onlyNumbers(
  value: string,
  maxLength: number,
) {
  return value
    .replace(/\D/g, "")
    .slice(0, maxLength);
}

export default function ComunidadesPage() {
  const toast = useToast();

  const permissions = useMemo(
    () => getUserPermissions(),
    [],
  );

  const hasPermission = useCallback(
    (permission: string) =>
      permissions.includes(permission),
    [permissions],
  );

  const canCreate = hasPermission(
    "comunidades.create",
  );

  const canEdit = hasPermission(
    "comunidades.edit",
  );

  const canChangeStatus = hasPermission(
    "comunidades.status",
  );

  const canViewIne = hasPermission(
    "comunidades.ine.view",
  );

  const canDownloadIne = hasPermission(
    "comunidades.ine.download",
  );

  const canExport = hasPermission(
    "comunidades.export",
  );

  const [comunidades, setComunidades] =
    useState<Comunidad[]>([]);

  const [form, setForm] =
    useState<CrearComunidadRequest>(
      initialForm,
    );

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [query, setQuery] =
    useState("");

  const [
    mostrarActivas,
    setMostrarActivas,
  ] = useState(true);

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const [pagination, setPagination] =
    useState<PaginationMeta>(
      initialPagination,
    );

  const [totalActivas, setTotalActivas] =
    useState(0);

  const [
    totalInactivas,
    setTotalInactivas,
  ] = useState(0);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    ineModalOpen,
    setIneModalOpen,
  ] = useState(false);

  const [
    selectedFileName,
    setSelectedFileName,
  ] = useState("");

  const [selectedIne, setSelectedIne] =
    useState<string | null>(null);

  const [
    selectedCommunityName,
    setSelectedCommunityName,
  ] = useState("");

  const [
    selectedDelegado,
    setSelectedDelegado,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    generandoPdfGeneral,
    setGenerandoPdfGeneral,
  ] = useState(false);

  const [
    generandoExcelGeneral,
    setGenerandoExcelGeneral,
  ] = useState(false);

  const [
    generandoPdfComunidadId,
    setGenerandoPdfComunidadId,
  ] = useState<string | null>(null);

  const [
    generandoExcelComunidadId,
    setGenerandoExcelComunidadId,
  ] = useState<string | null>(null);

  const [
    confirmacion,
    setConfirmacion,
  ] = useState(initialConfirmacion);

  const periodoInicial = useMemo(
    () => obtenerPeriodoInicial(),
    [],
  );

  const [
    periodoInicio,
    setPeriodoInicio,
  ] = useState(
    periodoInicial.periodoInicio,
  );

  const [
    periodoFin,
    setPeriodoFin,
  ] = useState(
    periodoInicial.periodoFin,
  );

  const [
    reporteSeleccionado,
    setReporteSeleccionado,
  ] = useState<ReporteSeleccionado>({
    open: false,
    formato: "pdf",
    comunidad: null,
  });

  const cargarComunidades = useCallback(
    async (page: number) => {
      try {
        setLoading(true);

        const request = mostrarActivas
          ? comunidadService.obtenerTodas(
              page,
              REGISTROS_POR_PAGINA,
            )
          : comunidadService.obtenerInactivas(
              page,
              REGISTROS_POR_PAGINA,
            );

        const [
          mainResponse,
          activasResponse,
          inactivasResponse,
        ] = await Promise.all([
          request,
          comunidadService.obtenerTodas(
            1,
            1,
          ),
          comunidadService.obtenerInactivas(
            1,
            1,
          ),
        ]);

        const mainData =
          mainResponse.data as BackendPaginatedResult<Comunidad>;

        const activasData =
          activasResponse.data as BackendPaginatedResult<Comunidad>;

        const inactivasData =
          inactivasResponse.data as BackendPaginatedResult<Comunidad>;

        setComunidades(
          getItems(mainData),
        );

        setPagination(
          getPaginationMeta(mainData),
        );

        setTotalActivas(
          getPaginationMeta(activasData)
            .totalRecords,
        );

        setTotalInactivas(
          getPaginationMeta(inactivasData)
            .totalRecords,
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(error),
        );

        setComunidades([]);
        setPagination(
          initialPagination,
        );
        setTotalActivas(0);
        setTotalInactivas(0);
      } finally {
        setLoading(false);
      }
    },
    [mostrarActivas, toast],
  );

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void cargarComunidades(
          paginaActual,
        );
      }, 0);

    return () =>
      window.clearTimeout(timeoutId);
  }, [
    cargarComunidades,
    paginaActual,
  ]);

  const comunidadesFiltradas =
    useMemo(() => {
      const value = query
        .toLowerCase()
        .trim();

      if (!value) {
        return comunidades;
      }

      return comunidades.filter(
        (comunidad) =>
          comunidad.nombre
            .toLowerCase()
            .includes(value) ||
          comunidad.claveInterna
            .toLowerCase()
            .includes(value) ||
          comunidad.delegado
            ?.toLowerCase()
            .includes(value),
      );
    }, [comunidades, query]);

  const totalComunidades =
    totalActivas + totalInactivas;

  const paginaSegura =
    pagination.pageNumber;

  const totalPaginas =
    pagination.totalPages;

  const showActions =
    canViewIne ||
    canEdit ||
    canChangeStatus ||
    canExport;

  const generandoReporteGeneral =
    generandoPdfGeneral ||
    generandoExcelGeneral;

  const generandoReporteComunidad =
    generandoPdfComunidadId !== null ||
    generandoExcelComunidadId !== null;

  function cerrarConfirmacion() {
    if (confirmacion.loading) return;

    setConfirmacion(
      initialConfirmacion,
    );
  }

  async function confirmarAccion() {
    if (!confirmacion.action) return;

    try {
      setConfirmacion((prev) => ({
        ...prev,
        loading: true,
      }));

      await confirmacion.action();

      setConfirmacion(
        initialConfirmacion,
      );
    } catch {
      setConfirmacion((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }

  function toggleFiltroActivas() {
    setMostrarActivas(
      (prev) => !prev,
    );
    setPaginaActual(1);
    setQuery("");
  }

  function openModal(
    comunidad?: Comunidad,
  ) {
    if (comunidad && !canEdit) {
      return;
    }

    if (!comunidad && !canCreate) {
      return;
    }

    if (comunidad) {
      setEditingId(comunidad.id);

      setForm({
        claveInterna:
          comunidad.claveInterna,
        nombre: comunidad.nombre,
        codigoPostal:
          comunidad.codigoPostal,
        delegado:
          comunidad.delegado ?? "",
        telefonoDelegado:
          comunidad.telefonoDelegado ??
          "",
        delegadoIne: null,
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }

    setSelectedFileName("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setSelectedFileName("");
  }

  function closeIneModal() {
    setIneModalOpen(false);
    setSelectedIne(null);
    setSelectedCommunityName("");
    setSelectedDelegado("");
  }

  function handleTextChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const {
      name,
      value,
      files,
    } = event.target;

    if (name === "delegadoIne") {
      const file =
        files?.[0] ?? null;

      setForm((prev) => ({
        ...prev,
        delegadoIne: file,
      }));

      setSelectedFileName(
        file?.name ?? "",
      );

      return;
    }

    let formattedValue = value;

    if (
      name === "nombre" ||
      name === "delegado"
    ) {
      formattedValue =
        capitalizeWords(value);
    }

    if (name === "codigoPostal") {
      formattedValue = onlyNumbers(
        value,
        5,
      );
    }

    if (
      name ===
      "telefonoDelegado"
    ) {
      formattedValue = onlyNumbers(
        value,
        10,
      );
    }

    if (name === "claveInterna") {
      formattedValue =
        value.toUpperCase();
    }

    setForm((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (editingId && !canEdit) {
      return;
    }

    if (!editingId && !canCreate) {
      return;
    }

    if (
      form.codigoPostal.length !== 5
    ) {
      toast.error(
        "El código postal debe tener 5 dígitos.",
      );

      return;
    }

    if (
      form.telefonoDelegado &&
      form.telefonoDelegado.length !==
        10
    ) {
      toast.error(
        "El teléfono del delegado debe tener 10 dígitos.",
      );

      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await comunidadService.actualizar(
          editingId,
          {
            claveInterna:
              form.claveInterna,
            nombre: form.nombre,
            codigoPostal:
              form.codigoPostal,
            delegado:
              form.delegado,
            telefonoDelegado:
              form.telefonoDelegado,
          },
        );

        if (form.delegadoIne) {
          await comunidadService.actualizarIne(
            editingId,
            form.delegadoIne,
          );
        }

        toast.success(
          "Comunidad actualizada correctamente.",
        );
      } else {
        await comunidadService.crear(
          form,
        );

        toast.success(
          "Comunidad creada correctamente.",
        );
      }

      closeModal();

      await cargarComunidades(
        paginaActual,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstatus(
    comunidad: Comunidad,
  ) {
    if (!canChangeStatus) return;

    try {
      await comunidadService.cambiarEstatus(
        comunidad.id,
        !comunidad.activo,
      );

      const debeRegresarPagina =
        comunidades.length === 1 &&
        paginaActual > 1;

      if (debeRegresarPagina) {
        setPaginaActual(
          (prev) => prev - 1,
        );
      } else {
        await cargarComunidades(
          paginaActual,
        );
      }

      toast.success(
        comunidad.activo
          ? "Comunidad desactivada correctamente."
          : "Comunidad activada correctamente.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );

      throw error;
    }
  }

  function pedirCambioEstatus(
    comunidad: Comunidad,
  ) {
    setConfirmacion({
      open: true,
      title: comunidad.activo
        ? "Desactivar comunidad"
        : "Activar comunidad",
      message: `¿Seguro que deseas ${
        comunidad.activo
          ? "desactivar"
          : "activar"
      } la comunidad "${comunidad.nombre}"?`,
      confirmText: comunidad.activo
        ? "Desactivar"
        : "Activar",
      variant: comunidad.activo
        ? "danger"
        : "success",
      loading: false,
      action: () =>
        cambiarEstatus(comunidad),
    });
  }

  function verIne(
    comunidad: Comunidad,
  ) {
    if (!canViewIne) return;

    setSelectedCommunityName(
      comunidad.nombre,
    );

    setSelectedDelegado(
      comunidad.delegado ?? "",
    );

    setSelectedIne(
      comunidad.delegadoIneUrl,
    );

    setIneModalOpen(true);
  }

  function abrirModalReporte(
    formato: FormatoReporte,
    comunidad: Comunidad | null = null,
  ) {
    if (!canExport) return;

    setReporteSeleccionado({
      open: true,
      formato,
      comunidad,
    });
  }

  function cerrarModalReporte() {
    if (
      generandoReporteGeneral ||
      generandoReporteComunidad
    ) {
      return;
    }

    setReporteSeleccionado({
      open: false,
      formato: "pdf",
      comunidad: null,
    });
  }

  async function generarReporteConPeriodo(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !periodoInicio ||
      !periodoFin
    ) {
      toast.error(
        "Selecciona el periodo inicial y final.",
      );
      return;
    }

    if (periodoInicio > periodoFin) {
      toast.error(
        "El periodo inicial no puede ser posterior al periodo final.",
      );
      return;
    }

    const filtro = convertirPeriodoAFiltro(
      periodoInicio,
      periodoFin,
    );

    const {
      formato,
      comunidad,
    } = reporteSeleccionado;

    cerrarModalReporte();

    if (comunidad) {
      if (formato === "pdf") {
        await descargarPdfComunidad(
          comunidad,
          filtro,
        );
      } else {
        await descargarExcelComunidad(
          comunidad,
          filtro,
        );
      }

      return;
    }

    if (formato === "pdf") {
      await descargarPdfGeneral(filtro);
    } else {
      await descargarExcelGeneral(filtro);
    }
  }

  async function descargarPdfGeneral(
    filtro: FiltroReporte = {},
  ) {
    if (
      !canExport ||
      generandoReporteGeneral
    ) {
      return;
    }

    try {
      setGenerandoPdfGeneral(true);

      await reporteService.descargarReporteAnual(
        filtro,
      );

      toast.success(
        "Reporte general PDF descargado correctamente.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setGenerandoPdfGeneral(false);
    }
  }

  async function descargarExcelGeneral(
    filtro: FiltroReporte = {},
  ) {
    if (
      !canExport ||
      generandoReporteGeneral
    ) {
      return;
    }

    try {
      setGenerandoExcelGeneral(true);

      await reporteService.exportarComunidadesExcel(
        filtro,
      );

      toast.success(
        "Reporte general Excel descargado correctamente.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setGenerandoExcelGeneral(false);
    }
  }

  async function descargarPdfComunidad(
    comunidad: Comunidad,
    filtro: FiltroReporte = {},
  ) {
    if (
      !canExport ||
      generandoReporteComunidad
    ) {
      return;
    }

    try {
      setGenerandoPdfComunidadId(
        comunidad.id,
      );

      await reporteService.descargarReportePorComunidad(
        comunidad.id,
        filtro,
      );

      toast.success(
        `Reporte PDF de ${comunidad.nombre} descargado correctamente.`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setGenerandoPdfComunidadId(
        null,
      );
    }
  }

  async function descargarExcelComunidad(
    comunidad: Comunidad,
    filtro: FiltroReporte = {},
  ) {
    if (
      !canExport ||
      generandoReporteComunidad
    ) {
      return;
    }

    try {
      setGenerandoExcelComunidadId(
        comunidad.id,
      );

      await reporteService.exportarApoyosPorComunidadExcel(
        comunidad.id,
        filtro,
      );

      toast.success(
        `Reporte Excel de ${comunidad.nombre} descargado correctamente.`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setGenerandoExcelComunidadId(
        null,
      );
    }
  }

  return (
    <section className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div
            className={styles.searchBox}
          >
            <FiSearch />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Buscar comunidad, clave o delegado..."
            />
          </div>

          <div
            className={
              styles.toolbarActions
            }
          >
            {canExport && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={
                    styles.secondaryButton
                  }
                  disabled={
                    generandoReporteGeneral
                  }
                  onClick={() =>
                    abrirModalReporte("pdf")
                  }
                >
                  <FiFileText />

                  {generandoPdfGeneral
                    ? "Generando PDF..."
                    : "Reporte PDF"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={
                    styles.secondaryButton
                  }
                  disabled={
                    generandoReporteGeneral
                  }
                  onClick={() =>
                    abrirModalReporte("excel")
                  }
                >
                  <FiDownload />

                  {generandoExcelGeneral
                    ? "Generando Excel..."
                    : "Exportar Excel"}
                </Button>
              </>
            )}

            {canCreate && (
              <Button
                type="button"
                onClick={() =>
                  openModal()
                }
                className={
                  styles.primaryButton
                }
              >
                <FiPlus />
                Nueva comunidad
              </Button>
            )}
          </div>
        </div>

        <div className={styles.stats}>
          <div
            className={
              styles.statCard
            }
          >
            <div
              className={
                styles.statIcon
              }
            >
              <FiMapPin />
            </div>

            <div>
              <span>
                Total comunidades
              </span>

              <strong>
                {totalComunidades}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.statCard} ${styles.statusFilterCard}`}
            onClick={
              toggleFiltroActivas
            }
          >
            <div
              className={
                mostrarActivas
                  ? styles.statIconGreen
                  : styles.statIconGold
              }
            >
              <FiMapPin />
            </div>

            <div>
              <span>
                {mostrarActivas
                  ? "Comunidades activas"
                  : "Comunidades inactivas"}
              </span>

              <strong>
                {mostrarActivas
                  ? totalActivas
                  : totalInactivas}
              </strong>
            </div>
          </button>
        </div>

        <p
          className={
            styles.scrollHint
          }
        >
          Desliza la tabla hacia la
          derecha para ver más
          información.
        </p>

        <div
          className={styles.tableWrap}
        >
          <table
            className={styles.table}
          >
            <thead>
              <tr>
                <th>Comunidad</th>
                <th>Clave</th>
                <th>C.P.</th>
                <th>Delegado</th>
                <th>Teléfono</th>
                <th>Estatus</th>

                {showActions && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      showActions
                        ? 7
                        : 6
                    }
                    className={
                      styles.empty
                    }
                  >
                    Cargando comunidades...
                  </td>
                </tr>
              ) : comunidadesFiltradas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      showActions
                        ? 7
                        : 6
                    }
                    className={
                      styles.empty
                    }
                  >
                    No se encontraron
                    comunidades.
                  </td>
                </tr>
              ) : (
                comunidadesFiltradas.map(
                  (comunidad) => (
                    <tr
                      key={
                        comunidad.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            comunidad.nombre
                          }
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            styles.chip
                          }
                        >
                          {
                            comunidad.claveInterna
                          }
                        </span>
                      </td>

                      <td>
                        {
                          comunidad.codigoPostal
                        }
                      </td>

                      <td>
                        {comunidad.delegado || (
                          <span
                            className={
                              styles.muted
                            }
                          >
                            Sin asignar
                          </span>
                        )}
                      </td>

                      <td>
                        {comunidad.telefonoDelegado ||
                          "—"}
                      </td>

                      <td>
                        {comunidad.activo ? (
                          <span
                            className={
                              styles.active
                            }
                          >
                            Activa
                          </span>
                        ) : (
                          <span
                            className={
                              styles.inactive
                            }
                          >
                            Inactiva
                          </span>
                        )}
                      </td>

                      {showActions && (
                        <td>
                          <div
                            className={
                              styles.actions
                            }
                          >
                            {canViewIne && (
                              <button
                                type="button"
                                className={
                                  styles.actionView
                                }
                                title="Ver INE"
                                onClick={() =>
                                  verIne(
                                    comunidad,
                                  )
                                }
                              >
                                <FiEye />
                              </button>
                            )}

                            {canExport && (
                              <>
                                <button
                                  type="button"
                                  className={
                                    styles.actionReport
                                  }
                                  title={`Descargar PDF de ${comunidad.nombre}`}
                                  disabled={
                                    generandoReporteComunidad
                                  }
                                  onClick={() =>
                                    abrirModalReporte(
                                      "pdf",
                                      comunidad,
                                    )
                                  }
                                >
                                  {generandoPdfComunidadId ===
                                  comunidad.id ? (
                                    <span
                                      className={
                                        styles.actionLoader
                                      }
                                    />
                                  ) : (
                                    <FiFileText />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  className={
                                    styles.actionExcel
                                  }
                                  title={`Descargar Excel de ${comunidad.nombre}`}
                                  disabled={
                                    generandoReporteComunidad
                                  }
                                  onClick={() =>
                                    abrirModalReporte(
                                      "excel",
                                      comunidad,
                                    )
                                  }
                                >
                                  {generandoExcelComunidadId ===
                                  comunidad.id ? (
                                    <span
                                      className={
                                        styles.actionLoader
                                      }
                                    />
                                  ) : (
                                    <FiDownload />
                                  )}
                                </button>
                              </>
                            )}

                            {canEdit && (
                              <button
                                type="button"
                                className={
                                  styles.actionEdit
                                }
                                title="Editar"
                                onClick={() =>
                                  openModal(
                                    comunidad,
                                  )
                                }
                              >
                                <FiEdit2 />
                              </button>
                            )}

                            {canChangeStatus && (
                              <label
                                className={
                                  styles.statusSwitch
                                }
                                title={
                                  comunidad.activo
                                    ? "Desactivar"
                                    : "Activar"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    comunidad.activo
                                  }
                                  onChange={() =>
                                    pedirCambioEstatus(
                                      comunidad,
                                    )
                                  }
                                />

                                <span />
                              </label>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <footer
          className={
            styles.pagination
          }
        >
          <span>
            Página{" "}
            {pagination.totalRecords ===
            0
              ? 0
              : paginaSegura}{" "}
            de{" "}
            {pagination.totalRecords ===
            0
              ? 0
              : totalPaginas}{" "}
            · {pagination.totalRecords}{" "}
            registros
          </span>

          <div>
            <button
              type="button"
              disabled={
                loading ||
                !pagination.hasPreviousPage
              }
              onClick={() =>
                setPaginaActual(
                  (prev) =>
                    Math.max(
                      prev - 1,
                      1,
                    ),
                )
              }
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={
                loading ||
                !pagination.hasNextPage
              }
              onClick={() =>
                setPaginaActual(
                  (prev) =>
                    prev + 1,
                )
              }
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>

      {modalOpen && (
        <div
          className={styles.modalBg}
        >
          <form
            className={styles.modal}
            onSubmit={handleSubmit}
          >
            <div
              className={
                styles.modalHero
              }
            >
              <div
                className={
                  styles.modalIcon
                }
              >
                <FiMapPin />
              </div>

              <div>
                <h2>
                  {editingId
                    ? "Editar comunidad"
                    : "Nueva comunidad"}
                </h2>

                <p>
                  {editingId
                    ? "Actualiza los datos generales de la comunidad."
                    : "Registra una nueva comunidad beneficiada."}
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={closeModal}
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div
              className={
                styles.modalBody
              }
            >
              <div
                className={
                  styles.formRow
                }
              >
                <label>
                  Nombre de la
                  comunidad{" "}
                  <span>*</span>

                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={
                      handleTextChange
                    }
                    placeholder="Ej. Héroes Carranza"
                    required
                  />
                </label>

                <label>
                  Clave <span>*</span>

                  <input
                    name="claveInterna"
                    value={
                      form.claveInterna
                    }
                    onChange={
                      handleTextChange
                    }
                    placeholder="Ej. HCA-001"
                    required
                  />
                </label>
              </div>

              <label>
                Código postal{" "}
                <span>*</span>

                <input
                  name="codigoPostal"
                  value={
                    form.codigoPostal
                  }
                  onChange={
                    handleTextChange
                  }
                  placeholder="Ej. 42810"
                  maxLength={5}
                  inputMode="numeric"
                  required
                />
              </label>

              <div
                className={
                  styles.delegateBox
                }
              >
                <h3>
                  Delegado responsable
                </h3>

                <div
                  className={
                    styles.formRow
                  }
                >
                  <label>
                    Nombre del delegado

                    <input
                      name="delegado"
                      value={
                        form.delegado
                      }
                      onChange={
                        handleTextChange
                      }
                      placeholder="Nombre completo"
                    />
                  </label>

                  <label>
                    Teléfono

                    <input
                      name="telefonoDelegado"
                      value={
                        form.telefonoDelegado
                      }
                      onChange={
                        handleTextChange
                      }
                      placeholder="Ej. 7731234567"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </label>
                </div>

                <label>
                  {editingId
                    ? "Actualizar INE del delegado"
                    : "INE del delegado"}

                  <input
                    name="delegadoIne"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleTextChange
                    }
                  />
                </label>

                {selectedFileName && (
                  <div
                    className={
                      styles.filePreview
                    }
                  >
                    INE seleccionada:{" "}
                    {selectedFileName}
                  </div>
                )}
              </div>
            </div>

            <div
              className={
                styles.modalFoot
              }
            >
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className={
                  styles.cancelButton
                }
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className={
                  styles.saveButton
                }
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear comunidad"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {ineModalOpen && (
        <div
          className={styles.modalBg}
        >
          <div
            className={styles.ineModal}
          >
            <div
              className={
                styles.ineHead
              }
            >
              <div
                className={
                  styles.ineHeadInfo
                }
              >
                <div
                  className={
                    styles.ineHeadIcon
                  }
                >
                  <FiUserCheck />
                </div>

                <div>
                  <h2>
                    Identificación del
                    delegado
                  </h2>

                  <p>
                    {
                      selectedCommunityName
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeIneModal}
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div
              className={
                styles.ineBody
              }
            >
              {selectedDelegado && (
                <div
                  className={
                    styles.ineDelegateRow
                  }
                >
                  <div>
                    <strong>
                      {
                        selectedDelegado
                      }
                    </strong>

                    <span>
                      Delegado
                      responsable
                    </span>
                  </div>
                </div>
              )}

              {selectedIne ? (
                <a
                  href={selectedIne}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    styles.ineFrame
                  }
                >
                  <img
                    src={selectedIne}
                    alt={`INE del delegado de ${selectedCommunityName}`}
                    className={
                      styles.ineImage
                    }
                  />

                  <span
                    className={
                      styles.ineZoom
                    }
                  >
                    <FiEye />
                    Ver en tamaño
                    completo
                  </span>
                </a>
              ) : (
                <div
                  className={
                    styles.noIne
                  }
                >
                  <FiUserCheck />

                  <p>
                    Esta comunidad no
                    tiene INE
                    registrada.
                  </p>
                </div>
              )}
            </div>

            <div
              className={
                styles.modalFoot
              }
            >
              {selectedIne &&
                canDownloadIne && (
                  <a
                    href={
                      selectedIne
                    }
                    download
                    target="_blank"
                    rel="noreferrer"
                    className={
                      styles.ineDownload
                    }
                  >
                    <FiDownload />
                    Descargar
                  </a>
                )}

              <Button
                type="button"
                onClick={closeIneModal}
                className={
                  styles.primaryButton
                }
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {reporteSeleccionado.open && (
        <div className={styles.modalBg}>
          <form
            className={styles.modal}
            onSubmit={
              generarReporteConPeriodo
            }
          >
            <div
              className={
                styles.modalHero
              }
            >
              <div
                className={
                  styles.modalIcon
                }
              >
                <FiCalendar />
              </div>

              <div>
                <h2>
                  Seleccionar periodo
                </h2>

                <p>
                  {reporteSeleccionado.comunidad
                    ? `Reporte de ${reporteSeleccionado.comunidad.nombre}`
                    : "Reporte general de comunidades"}
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={
                  cerrarModalReporte
                }
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div
              className={
                styles.modalBody
              }
            >
              <div
                className={
                  styles.formRow
                }
              >
                <label>
                  Desde <span>*</span>

                  <input
                    type="month"
                    value={
                      periodoInicio
                    }
                    max={periodoFin}
                    onChange={(event) =>
                      setPeriodoInicio(
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label>
                  Hasta <span>*</span>

                  <input
                    type="month"
                    value={periodoFin}
                    min={periodoInicio}
                    onChange={(event) =>
                      setPeriodoFin(
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>
              </div>

              <p
                className={
                  styles.muted
                }
              >
                El reporte incluirá
                desde el primer día del
                mes inicial hasta el
                último día del mes
                final.
              </p>
            </div>

            <div
              className={
                styles.modalFoot
              }
            >
              <Button
                type="button"
                variant="outline"
                onClick={
                  cerrarModalReporte
                }
                className={
                  styles.cancelButton
                }
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={
                  generandoReporteGeneral ||
                  generandoReporteComunidad
                }
                className={
                  styles.saveButton
                }
              >
                {reporteSeleccionado.formato ===
                "pdf"
                  ? "Generar PDF"
                  : "Generar Excel"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={confirmacion.open}
        title={confirmacion.title}
        message={confirmacion.message}
        confirmText={
          confirmacion.confirmText
        }
        variant={
          confirmacion.variant
        }
        loading={
          confirmacion.loading
        }
        onCancel={
          cerrarConfirmacion
        }
        onConfirm={() =>
          void confirmarAccion()
        }
      />
    </section>
  );
}