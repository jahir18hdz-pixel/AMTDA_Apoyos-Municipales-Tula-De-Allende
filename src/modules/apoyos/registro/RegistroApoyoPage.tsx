import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiEdit2,
  FiEye,
  FiFilter,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { Button } from "../../../components/ui/button";
import { ConfirmModal } from "../../../components/ui/confirm-modal/ConfirmModal";
import { useToast } from "../../../components/ui/toast/useToast";

import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

import RegistroApoyoDetalleModal from "./components/RegistroApoyoDetalleModal";

import {
  registroApoyoCatalogosService,
  registroApoyoService,
} from "../../../services/registroApoyo.service";

import type {
  CatalogoOption,
  CrearRegistroApoyoForm,
  DocumentoApoyoForm,
  RegistroApoyoDetalle,
  RegistroApoyoListado,
} from "../../../types/registroApoyo.types";

import styles from "./RegistroApoyoPage.module.css";

type ConfirmVariant =
  | "danger"
  | "warning"
  | "success"
  | "default";

const PAGE_SIZE = 10;

const initialConfirmacion = {
  open: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  variant: "default" as ConfirmVariant,
  loading: false,
  action: null as (() => Promise<void>) | null,
};

function crearDocumentoInicial(): DocumentoApoyoForm {
  return {
    archivo: null,
    monto: "",
    descripcion: "",
    tipoDocumento: "factura",
    esExistente: false,
  };
}

function crearFormularioInicial(): CrearRegistroApoyoForm {
  return {
    folio: "",
    apoyoId: "",
    comunidadId: "",
    estadoSolicitudId: "",
    fechaApoyo: new Date().toISOString().slice(0, 10),
    montoOtorgado: "",
    observaciones: "",
    documentos: [crearDocumentoInicial()],
  };
}

function normalizarTexto(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function obtenerFechaFormulario(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function mostrarFecha(value?: string | null) {
  if (!value) return "—";

  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleDateString("es-MX");
}

function normalizarTipoDocumento(
  tipo?: string | null,
): DocumentoApoyoForm["tipoDocumento"] {
  const tipoNormalizado = tipo?.trim().toLowerCase();

  if (
    tipoNormalizado === "imagen" ||
    tipoNormalizado === "factura" ||
    tipoNormalizado === "otro"
  ) {
    return tipoNormalizado;
  }

  return "otro";
}

export default function RegistroApoyoPage() {
  const toast = useToast();

  const [registros, setRegistros] = useState<
    RegistroApoyoListado[]
  >([]);

  const [comunidades, setComunidades] = useState<
    CatalogoOption[]
  >([]);

  const [apoyos, setApoyos] = useState<
    CatalogoOption[]
  >([]);

  const [estados, setEstados] = useState<
    CatalogoOption[]
  >([]);

  const [form, setForm] =
    useState<CrearRegistroApoyoForm>(
      crearFormularioInicial,
    );

  const [query, setQuery] = useState("");
  const [comunidadFiltro, setComunidadFiltro] =
    useState("");
  const [estadoFiltro, setEstadoFiltro] =
    useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] =
    useState(false);

  const [
    detalleSeleccionado,
    setDetalleSeleccionado,
  ] = useState<RegistroApoyoDetalle | null>(null);

  const [
    registroListadoSeleccionado,
    setRegistroListadoSeleccionado,
  ] = useState<RegistroApoyoListado | null>(null);

  const [
    registroEditandoId,
    setRegistroEditandoId,
  ] = useState<string | null>(null);

  const [pageNumber, setPageNumber] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [
    loadingCatalogos,
    setLoadingCatalogos,
  ] = useState(false);

  const [loadingEdit, setLoadingEdit] =
    useState(false);

  const [
    loadingDetalle,
    setLoadingDetalle,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [confirmacion, setConfirmacion] =
    useState(initialConfirmacion);

  const cargarRegistros = useCallback(async () => {
    try {
      setLoading(true);

      const { data } =
        await registroApoyoService.obtenerTodos(
          pageNumber,
          PAGE_SIZE,
        );

      setRegistros(data.items ?? []);

      setTotalPages(
        Math.max(data.totalPages || 1, 1),
      );
    } catch (error) {
      setRegistros([]);
      setTotalPages(1);

      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [pageNumber, toast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarRegistros();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cargarRegistros]);

  useEffect(() => {
    let activo = true;

    const timeoutId = window.setTimeout(() => {
      async function cargarCatalogos() {
        try {
          setLoadingCatalogos(true);

          const [
            comunidadesResponse,
            apoyosResponse,
            estadosResponse,
          ] = await Promise.all([
            registroApoyoCatalogosService.obtenerComunidades(),
            registroApoyoCatalogosService.obtenerApoyos(),
            registroApoyoCatalogosService.obtenerEstadosSolicitud(),
          ]);

          if (!activo) return;

          setComunidades(
            comunidadesResponse.data.items ?? [],
          );

          setApoyos(
            apoyosResponse.data.items ?? [],
          );

          setEstados(
            estadosResponse.data ?? [],
          );
        } catch (error) {
          if (!activo) return;

          setComunidades([]);
          setApoyos([]);
          setEstados([]);

          toast.error(
            getApiErrorMessage(error),
          );
        } finally {
          if (activo) {
            setLoadingCatalogos(false);
          }
        }
      }

      void cargarCatalogos();
    }, 0);

    return () => {
      activo = false;
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const registrosFiltrados = useMemo(() => {
    const textoBusqueda =
      normalizarTexto(query);

    const comunidadSeleccionada =
      normalizarTexto(comunidadFiltro);

    const estadoSeleccionado =
      normalizarTexto(estadoFiltro);

    return registros.filter((registro) => {
      const coincideBusqueda =
        !textoBusqueda ||
        [
          registro.folio,
          registro.comunidad,
          registro.fondo,
          registro.tipoApoyo,
          registro.estado,
          registro.delegado,
        ]
          .map((value) => value ?? "")
          .join(" ")
          .toLowerCase()
          .includes(textoBusqueda);

      const coincideComunidad =
        !comunidadSeleccionada ||
        normalizarTexto(
          registro.comunidad,
        ) === comunidadSeleccionada;

      const coincideEstado =
        !estadoSeleccionado ||
        normalizarTexto(
          registro.estado,
        ) === estadoSeleccionado;

      return (
        coincideBusqueda &&
        coincideComunidad &&
        coincideEstado
      );
    });
  }, [
    comunidadFiltro,
    estadoFiltro,
    query,
    registros,
  ]);

  const hayFiltrosActivos =
    query.trim() !== "" ||
    comunidadFiltro !== "" ||
    estadoFiltro !== "";

  function abrirModalNuevo() {
    setRegistroEditandoId(null);
    setForm(crearFormularioInicial());
    setModalOpen(true);
  }

  function cerrarModal() {
    if (saving || loadingEdit) return;

    setModalOpen(false);
    setRegistroEditandoId(null);
    setForm(crearFormularioInicial());
  }

  async function abrirDetalle(
    registro: RegistroApoyoListado,
  ) {
    try {
      setLoadingDetalle(true);

      setRegistroListadoSeleccionado(
        registro,
      );

      const [
        detalleResponse,
        registroResponse,
      ] = await Promise.all([
        registroApoyoService.obtenerDetalle(
          registro.id,
        ),
        registroApoyoService.obtenerPorId(
          registro.id,
        ),
      ]);

      const detalleData =
        detalleResponse.data;

      const registroData =
        registroResponse.data;

      setDetalleSeleccionado({
        ...detalleData,

        id:
          detalleData.id ||
          registroData.id ||
          registro.id,

        folio:
          detalleData.folio ||
          registroData.folio ||
          registro.folio,

        apoyoId:
          detalleData.apoyoId ||
          registroData.apoyoId,

        apoyo:
          detalleData.apoyo ||
          registroData.apoyo,

        fondo:
          detalleData.fondo ||
          detalleData.apoyo ||
          registroData.apoyo ||
          registro.fondo,

        tipoApoyo:
          detalleData.tipoApoyo ||
          detalleData.apoyo ||
          registroData.apoyo ||
          registro.tipoApoyo,

        comunidadId:
          detalleData.comunidadId ||
          registroData.comunidadId,

        comunidad:
          detalleData.comunidad ||
          registroData.comunidad ||
          registro.comunidad,

        estadoSolicitudId:
          detalleData.estadoSolicitudId ||
          registroData.estadoSolicitudId,

        estadoSolicitud:
          detalleData.estadoSolicitud ||
          registroData.estadoSolicitud,

        estado:
          detalleData.estado ||
          detalleData.estatus ||
          detalleData.estadoSolicitud ||
          registroData.estadoSolicitud ||
          registro.estado,

        estatus:
          detalleData.estatus ||
          detalleData.estado ||
          detalleData.estadoSolicitud ||
          registroData.estadoSolicitud ||
          registro.estado,

        delegado:
          detalleData.delegado ||
          registro.delegado,

        fechaApoyo:
          detalleData.fechaApoyo ||
          registroData.fechaApoyo,

        fechaRegistro:
          detalleData.fechaRegistro ||
          registroData.createdAt ||
          registro.fechaRegistro,

        createdAt:
          detalleData.createdAt ||
          registroData.createdAt,

        montoOtorgado:
          detalleData.montoOtorgado ??
          registroData.montoOtorgado,

        observaciones:
          detalleData.observaciones ??
          registroData.observaciones,

        activo:
          detalleData.activo ??
          registroData.activo,

        documentos:
          detalleData.documentos?.length
            ? detalleData.documentos
            : registroData.documentos ?? [],
      });

      setDetalleOpen(true);
    } catch (error) {
      setDetalleSeleccionado(null);

      setRegistroListadoSeleccionado(
        null,
      );

      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setLoadingDetalle(false);
    }
  }

  function cerrarDetalle() {
    if (loadingDetalle) return;

    setDetalleOpen(false);
    setDetalleSeleccionado(null);

    setRegistroListadoSeleccionado(
      null,
    );
  }

  async function abrirEditar(
    registro: RegistroApoyoListado,
  ) {
    try {
      setLoadingEdit(true);

      const { data } =
        await registroApoyoService.obtenerPorId(
          registro.id,
        );

      const documentosExistentes: DocumentoApoyoForm[] =
        data.documentos?.length
          ? data.documentos.map(
              (documento) => ({
                id: documento.id,

                nombreArchivo:
                  documento.nombreArchivo,

                esExistente: true,

                archivo: null,

                monto:
                  documento.monto !==
                    undefined &&
                  documento.monto !== null
                    ? documento.monto.toString()
                    : "",

                descripcion:
                  documento.descripcion ?? "",

                tipoDocumento:
                  normalizarTipoDocumento(
                    documento.tipoDocumento,
                  ),
              }),
            )
          : [crearDocumentoInicial()];

      setRegistroEditandoId(
        registro.id,
      );

      setForm({
        folio:
          data.folio ??
          registro.folio ??
          "",

        apoyoId: data.apoyoId,

        comunidadId:
          data.comunidadId,

        estadoSolicitudId:
          data.estadoSolicitudId,

        fechaApoyo:
          obtenerFechaFormulario(
            data.fechaApoyo,
          ),

        montoOtorgado:
          data.montoOtorgado !==
            undefined &&
          data.montoOtorgado !== null
            ? data.montoOtorgado.toString()
            : "",

        observaciones:
          data.observaciones ?? "",

        documentos:
          documentosExistentes,
      });

      setModalOpen(true);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setLoadingEdit(false);
    }
  }

  function limpiarFiltros() {
    setQuery("");
    setComunidadFiltro("");
    setEstadoFiltro("");
  }

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

  async function handleEliminarRegistro(
    registro: RegistroApoyoListado,
  ) {
    await registroApoyoService.eliminar(
      registro.id,
    );

    if (
      registros.length === 1 &&
      pageNumber > 1
    ) {
      setPageNumber((prev) => prev - 1);
      return;
    }

    await cargarRegistros();
  }

  function pedirEliminarRegistro(
    registro: RegistroApoyoListado,
  ) {
    setConfirmacion({
      open: true,
      title: "Eliminar registro",
      message: `¿Seguro que deseas eliminar el apoyo con folio "${registro.folio}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "danger",
      loading: false,
      action: () =>
        handleEliminarRegistro(registro),
    });
  }

  function handleInputChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    const { name, value } =
      event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function actualizarDocumento<
    K extends keyof DocumentoApoyoForm,
  >(
    index: number,
    field: K,
    value: DocumentoApoyoForm[K],
  ) {
    setForm((prev) => ({
      ...prev,

      documentos: prev.documentos.map(
        (documento, currentIndex) =>
          currentIndex === index
            ? {
                ...documento,
                [field]: value,
              }
            : documento,
      ),
    }));
  }

  function agregarDocumento() {
    setForm((prev) => ({
      ...prev,

      documentos: [
        ...prev.documentos,
        crearDocumentoInicial(),
      ],
    }));
  }

  function quitarDocumento(
    index: number,
  ) {
    setForm((prev) => ({
      ...prev,

      documentos:
        prev.documentos.length === 1
          ? [crearDocumentoInicial()]
          : prev.documentos.filter(
              (_, currentIndex) =>
                currentIndex !== index,
            ),
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.folio.trim() ||
      !form.apoyoId ||
      !form.comunidadId ||
      !form.estadoSolicitudId ||
      !form.fechaApoyo ||
      !form.montoOtorgado
    ) {
      toast.error(
        "Completa todos los campos obligatorios.",
      );

      return;
    }

    const montoOtorgado = Number(
      form.montoOtorgado,
    );

    if (
      !Number.isFinite(montoOtorgado) ||
      montoOtorgado <= 0
    ) {
      toast.error(
        "El monto otorgado debe ser mayor a cero.",
      );

      return;
    }

    const documentosInvalidos =
      form.documentos.some(
        (documento) => {
          if (!documento.monto) {
            return false;
          }

          const montoDocumento = Number(
            documento.monto,
          );

          return (
            !Number.isFinite(
              montoDocumento,
            ) || montoDocumento < 0
          );
        },
      );

    if (documentosInvalidos) {
      toast.error(
        "Los montos de los documentos no pueden ser negativos.",
      );

      return;
    }

    try {
      setSaving(true);

      if (registroEditandoId) {
        await registroApoyoService.actualizar(
          registroEditandoId,
          form,
        );
      } else {
        await registroApoyoService.crear(
          form,
        );
      }

      setModalOpen(false);
      setRegistroEditandoId(null);
      setForm(crearFormularioInicial());

      await cargarRegistros();
    } catch {
      /*
       * Los errores de Axios son mostrados
       * automáticamente por el interceptor.
       */
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div
            className={
              styles.filtersContainer
            }
          >
            <div className={styles.searchBox}>
              <FiSearch />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Buscar por folio, apoyo o delegado..."
              />

              {query && (
                <button
                  type="button"
                  className={
                    styles.clearSearch
                  }
                  onClick={() => setQuery("")}
                  title="Limpiar búsqueda"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className={styles.filterBox}>
              <FiFilter />

              <select
                value={comunidadFiltro}
                onChange={(event) =>
                  setComunidadFiltro(
                    event.target.value,
                  )
                }
                aria-label="Filtrar por comunidad"
                disabled={loadingCatalogos}
              >
                <option value="">
                  Todas las comunidades
                </option>

                {comunidades.map(
                  (comunidad) => (
                    <option
                      key={comunidad.id}
                      value={comunidad.nombre}
                    >
                      {comunidad.nombre}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className={styles.filterBox}>
              <FiFilter />

              <select
                value={estadoFiltro}
                onChange={(event) =>
                  setEstadoFiltro(
                    event.target.value,
                  )
                }
                aria-label="Filtrar por estado"
                disabled={loadingCatalogos}
              >
                <option value="">
                  Todos los estados
                </option>

                {estados.map((estado) => (
                  <option
                    key={estado.id}
                    value={estado.nombre}
                  >
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                className={
                  styles.clearFiltersButton
                }
                onClick={limpiarFiltros}
              >
                <FiX />
                Limpiar
              </button>
            )}
          </div>

          <div
            className={
              styles.toolbarActions
            }
          >
            <Button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={abrirModalNuevo}
              disabled={loadingCatalogos}
            >
              <FiPlus />

              {loadingCatalogos
                ? "Cargando catálogos..."
                : "Nuevo apoyo"}
            </Button>
          </div>
        </div>

        <div
          className={styles.tableWrapper}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Comunidad</th>
                <th>Apoyo</th>
                <th>Estado</th>
                <th>Delegado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className={styles.empty}
                  >
                    Cargando apoyos...
                  </td>
                </tr>
              ) : registrosFiltrados.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={styles.empty}
                  >
                    {hayFiltrosActivos
                      ? "No hay registros que coincidan con los filtros."
                      : "No se encontraron apoyos registrados."}
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map(
                  (registro) => (
                    <tr key={registro.id}>
                      <td>
                        <strong>
                          {registro.folio}
                        </strong>
                      </td>

                      <td>
                        {registro.comunidad ||
                          "—"}
                      </td>

                      <td>
                        {registro.fondo ||
                          registro.tipoApoyo ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={
                            styles.statusBadge
                          }
                        >
                          {registro.estado ||
                            "Sin estado"}
                        </span>
                      </td>

                      <td>
                        {registro.delegado ||
                          "—"}
                      </td>

                      <td>
                        {mostrarFecha(
                          registro.fechaRegistro,
                        )}
                      </td>

                      <td>
                        <div
                          className={styles.actions}
                        >
                          <button
                            type="button"
                            className={
                              styles.viewAction
                            }
                            title={
                              loadingDetalle
                                ? "Cargando detalle"
                                : "Ver detalle"
                            }
                            disabled={
                              loadingDetalle
                            }
                            onClick={() =>
                              void abrirDetalle(
                                registro,
                              )
                            }
                          >
                            <FiEye />
                          </button>

                          <button
                            type="button"
                            className={
                              styles.editAction
                            }
                            title="Editar"
                            disabled={loadingEdit}
                            onClick={() =>
                              void abrirEditar(
                                registro,
                              )
                            }
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            className={
                              styles.deleteAction
                            }
                            title="Eliminar"
                            disabled={
                              confirmacion.loading
                            }
                            onClick={() =>
                              pedirEliminarRegistro(
                                registro,
                              )
                            }
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <footer
          className={styles.pagination}
        >
          <button
            type="button"
            disabled={
              loading || pageNumber <= 1
            }
            onClick={() =>
              setPageNumber((prev) =>
                Math.max(prev - 1, 1),
              )
            }
          >
            Anterior
          </button>

          <span>
            Página {pageNumber} de{" "}
            {totalPages}
          </span>

          <button
            type="button"
            disabled={
              loading ||
              pageNumber >= totalPages
            }
            onClick={() =>
              setPageNumber(
                (prev) => prev + 1,
              )
            }
          >
            Siguiente
          </button>
        </footer>
      </section>

      {modalOpen && (
        <div
          className={styles.modalOverlay}
        >
          <form
            className={styles.modal}
            onSubmit={handleSubmit}
          >
            <div
              className={styles.modalHead}
            >
              <div>
                <h2>
                  {registroEditandoId
                    ? "Editar apoyo"
                    : "Nuevo apoyo"}
                </h2>

                <p>
                  {registroEditandoId
                    ? "Modifica la información general del apoyo."
                    : "Captura la información general y documentos del apoyo."}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={saving}
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div
              className={styles.modalBody}
            >
              <div
                className={styles.formGrid}
              >
                <label>
                  Folio <span>*</span>

                  <input
                    name="folio"
                    value={form.folio}
                    onChange={
                      handleInputChange
                    }
                    placeholder="Ej. APOYO-001"
                    required
                    disabled={saving}
                  />
                </label>

                <label>
                  Fecha del apoyo{" "}
                  <span>*</span>

                  <input
                    name="fechaApoyo"
                    type="date"
                    value={
                      form.fechaApoyo
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    disabled={saving}
                  />
                </label>

                <label>
                  Comunidad <span>*</span>

                  <select
                    name="comunidadId"
                    value={
                      form.comunidadId
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Selecciona una comunidad
                    </option>

                    {comunidades.map(
                      (comunidad) => (
                        <option
                          key={comunidad.id}
                          value={comunidad.id}
                        >
                          {comunidad.nombre}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Tipo de apoyo{" "}
                  <span>*</span>

                  <select
                    name="apoyoId"
                    value={form.apoyoId}
                    onChange={
                      handleInputChange
                    }
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Selecciona un apoyo
                    </option>

                    {apoyos.map((apoyo) => (
                      <option
                        key={apoyo.id}
                        value={apoyo.id}
                      >
                        {apoyo.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Estado de solicitud{" "}
                  <span>*</span>

                  <select
                    name="estadoSolicitudId"
                    value={
                      form.estadoSolicitudId
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Selecciona un estado
                    </option>

                    {estados.map((estado) => (
                      <option
                        key={estado.id}
                        value={estado.id}
                      >
                        {estado.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Monto otorgado{" "}
                  <span>*</span>

                  <input
                    name="montoOtorgado"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      form.montoOtorgado
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="0.00"
                    required
                    disabled={saving}
                  />
                </label>
              </div>

              <label>
                Observaciones

                <textarea
                  name="observaciones"
                  value={
                    form.observaciones
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Notas generales del apoyo"
                  rows={3}
                  disabled={saving}
                />
              </label>

              <div
                className={
                  styles.documentsBox
                }
              >
                <div
                  className={
                    styles.documentsHead
                  }
                >
                  <div>
                    <h3>Documentos</h3>

                    <p>
                      Agrega facturas, imágenes u
                      otros comprobantes.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      agregarDocumento
                    }
                    disabled={saving}
                  >
                    <FiPlus />
                    Agregar
                  </Button>
                </div>

                {registroEditandoId && (
                  <p
                    className={
                      styles.editDocumentsNotice
                    }
                  >
                    Los documentos actuales se
                    muestran como referencia. Para
                    agregar un documento nuevo,
                    utiliza el botón Agregar y
                    selecciona un archivo.
                  </p>
                )}

                {form.documentos.map(
                  (documento, index) => (
                    <div
                      key={
                        documento.id ?? index
                      }
                      className={
                        styles.documentCard
                      }
                    >
                      <div
                        className={
                          styles.documentTitle
                        }
                      >
                        <strong>
                          Documento {index + 1}
                        </strong>

                        {!documento.esExistente && (
                          <button
                            type="button"
                            onClick={() =>
                              quitarDocumento(
                                index,
                              )
                            }
                            title="Quitar documento"
                            disabled={saving}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>

                      <div
                        className={
                          styles.formGrid
                        }
                      >
                        <label>
                          Archivo

                          {documento.esExistente &&
                            documento.nombreArchivo && (
                              <small>
                                Archivo actual:{" "}
                                {
                                  documento.nombreArchivo
                                }
                              </small>
                            )}

                          {!documento.esExistente && (
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              disabled={saving}
                              onChange={(event) =>
                                actualizarDocumento(
                                  index,
                                  "archivo",
                                  event.target.files?.[0] ??
                                    null,
                                )
                              }
                            />
                          )}
                        </label>

                        <label>
                          Tipo

                          <select
                            value={
                              documento.tipoDocumento
                            }
                            disabled={
                              saving ||
                              documento.esExistente
                            }
                            onChange={(event) =>
                              actualizarDocumento(
                                index,
                                "tipoDocumento",
                                event.target
                                  .value as DocumentoApoyoForm["tipoDocumento"],
                              )
                            }
                          >
                            <option value="factura">
                              Factura
                            </option>

                            <option value="imagen">
                              Imagen
                            </option>

                            <option value="otro">
                              Otro
                            </option>
                          </select>
                        </label>

                        <label>
                          Monto

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              documento.monto
                            }
                            disabled={
                              saving ||
                              documento.esExistente
                            }
                            onChange={(event) =>
                              actualizarDocumento(
                                index,
                                "monto",
                                event.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </label>

                        <label>
                          Descripción

                          <input
                            value={
                              documento.descripcion
                            }
                            disabled={
                              saving ||
                              documento.esExistente
                            }
                            onChange={(event) =>
                              actualizarDocumento(
                                index,
                                "descripcion",
                                event.target.value,
                              )
                            }
                            placeholder="Descripción del documento"
                          />
                        </label>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div
              className={styles.modalFoot}
            >
              <Button
                type="button"
                variant="outline"
                onClick={cerrarModal}
                className={
                  styles.cancelButton
                }
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={
                  saving ||
                  loadingCatalogos
                }
                className={
                  styles.primaryButton
                }
              >
                {saving
                  ? "Guardando..."
                  : registroEditandoId
                    ? "Guardar cambios"
                    : "Registrar apoyo"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <RegistroApoyoDetalleModal
        open={detalleOpen}
        detalle={detalleSeleccionado}
        registroListado={
          registroListadoSeleccionado
        }
        onClose={cerrarDetalle}
        onEdit={() => {
          const registro =
            registroListadoSeleccionado;

          cerrarDetalle();

          if (registro) {
            void abrirEditar(registro);
          }
        }}
      />

      <ConfirmModal
        open={confirmacion.open}
        title={confirmacion.title}
        message={confirmacion.message}
        confirmText={
          confirmacion.confirmText
        }
        variant={confirmacion.variant}
        loading={confirmacion.loading}
        onCancel={cerrarConfirmacion}
        onConfirm={() =>
          void confirmarAccion()
        }
      />
    </section>
  );
}