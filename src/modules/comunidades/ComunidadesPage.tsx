import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiDownload,
  FiEdit2,
  FiEye,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { comunidadService } from "@/services/comunidad.service";
import type { Comunidad, CrearComunidadRequest } from "@/types/comunidad.types";
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

function getItems<T>(data: BackendPaginatedResult<T>) {
  return data.Items ?? data.items ?? [];
}

function getPaginationMeta<T>(data: BackendPaginatedResult<T>): PaginationMeta {
  return {
    pageNumber: data.PageNumber ?? data.pageNumber ?? 1,
    pageSize: data.PageSize ?? data.pageSize ?? REGISTROS_POR_PAGINA,
    totalRecords: data.TotalRecords ?? data.totalRecords ?? 0,
    totalPages: data.TotalPages ?? data.totalPages ?? 1,
    hasPreviousPage: data.HasPreviousPage ?? data.hasPreviousPage ?? false,
    hasNextPage: data.HasNextPage ?? data.hasNextPage ?? false,
  };
}

function getUserPermissions() {
  const rawUser = localStorage.getItem("presi2_auth");

  if (!rawUser) {
    return [
      "comunidades.view",
      "comunidades.create",
      "comunidades.edit",
      "comunidades.status",
      "comunidades.ine.view",
      "comunidades.ine.download",
      "comunidades.export",
    ];
  }

  try {
    const user = JSON.parse(rawUser) as { permissions?: string[] };
    return user.permissions ?? [];
  } catch {
    return [];
  }
}

function initials(nombre: string) {
  return nombre
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function capitalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function onlyNumbers(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export default function ComunidadesPage() {
  const permissions = useMemo(() => getUserPermissions(), []);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const canCreate = hasPermission("comunidades.create");
  const canEdit = hasPermission("comunidades.edit");
  const canChangeStatus = hasPermission("comunidades.status");
  const canViewIne = hasPermission("comunidades.ine.view");
  const canDownloadIne = hasPermission("comunidades.ine.download");
  const canExport = hasPermission("comunidades.export");

  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [form, setForm] = useState<CrearComunidadRequest>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [mostrarActivas, setMostrarActivas] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [pagination, setPagination] =
    useState<PaginationMeta>(initialPagination);

  const [totalActivas, setTotalActivas] = useState(0);
  const [totalInactivas, setTotalInactivas] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [ineModalOpen, setIneModalOpen] = useState(false);

  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedIne, setSelectedIne] = useState<string | null>(null);
  const [selectedCommunityName, setSelectedCommunityName] = useState("");
  const [selectedDelegado, setSelectedDelegado] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargarComunidades = useCallback(
    async (page: number) => {
      try {
        setLoading(true);

        const request = mostrarActivas
          ? comunidadService.obtenerTodas(page, REGISTROS_POR_PAGINA)
          : comunidadService.obtenerInactivas(page, REGISTROS_POR_PAGINA);

        const [mainResponse, activasResponse, inactivasResponse] =
          await Promise.all([
            request,
            comunidadService.obtenerTodas(1, 1),
            comunidadService.obtenerInactivas(1, 1),
          ]);

        const mainData = mainResponse.data as BackendPaginatedResult<Comunidad>;
        const activasData =
          activasResponse.data as BackendPaginatedResult<Comunidad>;
        const inactivasData =
          inactivasResponse.data as BackendPaginatedResult<Comunidad>;

        setComunidades(getItems(mainData));
        setPagination(getPaginationMeta(mainData));
        setTotalActivas(getPaginationMeta(activasData).totalRecords);
        setTotalInactivas(getPaginationMeta(inactivasData).totalRecords);
      } catch (error) {
        console.error("Error al cargar comunidades", error);
        setComunidades([]);
        setPagination(initialPagination);
        setTotalActivas(0);
        setTotalInactivas(0);
      } finally {
        setLoading(false);
      }
    },
    [mostrarActivas],
  );


  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarComunidades(paginaActual);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [cargarComunidades, paginaActual]);

  const comunidadesFiltradas = useMemo(() => {
    const value = query.toLowerCase().trim();

    if (!value) return comunidades;

    return comunidades.filter((comunidad) => {
      return (
        comunidad.nombre.toLowerCase().includes(value) ||
        comunidad.claveInterna.toLowerCase().includes(value) ||
        comunidad.delegado?.toLowerCase().includes(value)
      );
    });
  }, [comunidades, query]);

  const totalComunidades = totalActivas + totalInactivas;
  const paginaSegura = pagination.pageNumber;
  const totalPaginas = pagination.totalPages;

  function handleQueryChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function toggleFiltroActivas() {
    setMostrarActivas((prev) => !prev);
    setPaginaActual(1);
    setQuery("");
  }

  function openModal(comunidad?: Comunidad) {
    if (comunidad && !canEdit) return;
    if (!comunidad && !canCreate) return;

    if (comunidad) {
      setEditingId(comunidad.id);
      setForm({
        claveInterna: comunidad.claveInterna,
        nombre: comunidad.nombre,
        codigoPostal: comunidad.codigoPostal,
        delegado: comunidad.delegado ?? "",
        telefonoDelegado: comunidad.telefonoDelegado ?? "",
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

  function handleTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, files } = event.target;

    if (name === "delegadoIne") {
      const file = files?.[0] ?? null;

      setForm((prev) => ({
        ...prev,
        delegadoIne: file,
      }));

      setSelectedFileName(file?.name ?? "");
      return;
    }

    let formattedValue = value;

    if (name === "nombre" || name === "delegado") {
      formattedValue = capitalizeWords(value);
    }

    if (name === "codigoPostal") {
      formattedValue = onlyNumbers(value, 5);
    }

    if (name === "telefonoDelegado") {
      formattedValue = onlyNumbers(value, 10);
    }

    if (name === "claveInterna") {
      formattedValue = value.toUpperCase();
    }

    setForm((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId && !canEdit) return;
    if (!editingId && !canCreate) return;

    if (form.codigoPostal.length !== 5) {
      alert("El código postal debe tener 5 dígitos.");
      return;
    }

    if (form.telefonoDelegado && form.telefonoDelegado.length !== 10) {
      alert("El teléfono del delegado debe tener 10 dígitos.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await comunidadService.actualizar(editingId, {
          claveInterna: form.claveInterna,
          nombre: form.nombre,
          codigoPostal: form.codigoPostal,
          delegado: form.delegado,
          telefonoDelegado: form.telefonoDelegado,
        });

        if (form.delegadoIne) {
          await comunidadService.actualizarIne(editingId, form.delegadoIne);
        }
      } else {
        await comunidadService.crear(form);
      }

      closeModal();
      await cargarComunidades(paginaActual);
    } catch (error) {
      console.error("Error al guardar comunidad", error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEstatus(comunidad: Comunidad) {
    if (!canChangeStatus) return;

    try {
      await comunidadService.cambiarEstatus(comunidad.id, !comunidad.activo);

      const debeRegresarPagina = comunidades.length === 1 && paginaActual > 1;

      if (debeRegresarPagina) {
        setPaginaActual((prev) => prev - 1);
      } else {
        await cargarComunidades(paginaActual);
      }
    } catch (error) {
      console.error("Error al cambiar estatus", error);
    }
  }

  function verIne(comunidad: Comunidad) {
    if (!canViewIne) return;

    setSelectedCommunityName(comunidad.nombre);
    setSelectedDelegado(comunidad.delegado ?? "");
    setSelectedIne(comunidad.delegadoIneUrl);
    setIneModalOpen(true);
  }

  const showActions = canViewIne || canEdit || canChangeStatus;

  return (
    <section className={styles.page}>
      <div className={styles.header}>

        <div className={styles.headerActions}>
          {canExport && (
            <Button variant="outline" size="sm" className={styles.exportButton}>
              <FiDownload />
              Exportar PDF
            </Button>
          )}

          {canCreate && (
            <Button
              onClick={() => openModal()}
              className={styles.primaryButton}
            >
              <FiPlus />
              Nueva Comunidad
            </Button>
          )}
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiMapPin />
            </div>
            <div>
              <span>Total comunidades</span>
              <strong>{totalComunidades}</strong>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.statCard} ${styles.statusFilterCard}`}
            onClick={toggleFiltroActivas}
          >
            <div
              className={
                mostrarActivas ? styles.statIconGreen : styles.statIconGold
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
              <strong>{mostrarActivas ? totalActivas : totalInactivas}</strong>
            </div>
          </button>
        </div>

        <div className={styles.searchBox}>
          <FiSearch />
          <input
            value={query}
            onChange={handleQueryChange}
            placeholder="Buscar comunidad o delegado…"
          />
        </div>
      </div>

      <p className={styles.scrollHint}>
        Desliza la tabla hacia la derecha para ver más información.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Comunidad</th>
              <th>Clave</th>
              <th>C.P.</th>
              <th>Delegado</th>
              <th>Teléfono</th>
              <th>Estatus</th>
              {showActions && <th>Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 7 : 6} className={styles.empty}>
                  Cargando comunidades...
                </td>
              </tr>
            ) : comunidadesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 7 : 6} className={styles.empty}>
                  No se encontraron comunidades en esta página.
                </td>
              </tr>
            ) : (
              comunidadesFiltradas.map((comunidad) => (
                <tr key={comunidad.id}>
                  <td>
                    <div className={styles.communityCell}>
                      <div className={styles.avatar}>
                        {initials(comunidad.nombre)}
                      </div>

                      <div>
                        <strong>{comunidad.nombre}</strong>
                        <div className={styles.progress}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: comunidad.activo ? "100%" : "35%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={styles.chip}>
                      {comunidad.claveInterna}
                    </span>
                  </td>

                  <td>{comunidad.codigoPostal}</td>

                  <td>
                    {comunidad.delegado || (
                      <span className={styles.muted}>Sin asignar</span>
                    )}
                  </td>

                  <td>{comunidad.telefonoDelegado || "—"}</td>

                  <td>
                    <span
                      className={
                        comunidad.activo ? styles.active : styles.inactive
                      }
                    >
                      {comunidad.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>

                  {showActions && (
                    <td>
                      <div className={styles.actions}>
                        {canViewIne && (
                          <button
                            type="button"
                            className={styles.actionView}
                            title="Ver INE"
                            onClick={() => verIne(comunidad)}
                          >
                            <FiEye />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            className={styles.actionEdit}
                            title="Editar"
                            onClick={() => openModal(comunidad)}
                          >
                            <FiEdit2 />
                          </button>
                        )}

                        {canChangeStatus && (
                          <button
                            type="button"
                            className={
                              comunidad.activo
                                ? styles.actionDisable
                                : styles.actionEnable
                            }
                            title={comunidad.activo ? "Desactivar" : "Activar"}
                            onClick={() => toggleEstatus(comunidad)}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {pagination.totalRecords === 0 ? 0 : paginaSegura} de{" "}
          {pagination.totalRecords === 0 ? 0 : totalPaginas} ·{" "}
          {pagination.totalRecords} registros
        </span>

        <div>
          <button
            type="button"
            disabled={loading || !pagination.hasPreviousPage}
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          >
            Anterior
          </button>

          <button
            type="button"
            disabled={loading || !pagination.hasNextPage}
            onClick={() => setPaginaActual((prev) => prev + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className={styles.modalBg}>
          <form className={styles.modal} onSubmit={handleSubmit}>
            <div className={styles.modalHero}>
              <div className={styles.modalIcon}>
                <FiMapPin />
              </div>

              <div>
                <h2>{editingId ? "Editar Comunidad" : "Nueva Comunidad"}</h2>
                <p>
                  {editingId
                    ? "Actualiza los datos generales de la comunidad."
                    : "Registra una nueva comunidad beneficiada."}
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <label>
                  Nombre de la comunidad <span>*</span>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleTextChange}
                    placeholder="Ej. Héroes Carranza"
                    required
                  />
                </label>

                <label>
                  Clave <span>*</span>
                  <input
                    name="claveInterna"
                    value={form.claveInterna}
                    onChange={handleTextChange}
                    placeholder="Ej. HCA-001"
                    required
                  />
                </label>
              </div>

              <label>
                Código Postal <span>*</span>
                <input
                  name="codigoPostal"
                  value={form.codigoPostal}
                  onChange={handleTextChange}
                  placeholder="Ej. 42810"
                  maxLength={5}
                  inputMode="numeric"
                  required
                />
              </label>

              <div className={styles.delegateBox}>
                <h3>Delegado responsable</h3>

                <div className={styles.formRow}>
                  <label>
                    Nombre del delegado
                    <input
                      name="delegado"
                      value={form.delegado}
                      onChange={handleTextChange}
                      placeholder="Nombre completo"
                    />
                  </label>

                  <label>
                    Teléfono
                    <input
                      name="telefonoDelegado"
                      value={form.telefonoDelegado}
                      onChange={handleTextChange}
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
                    onChange={handleTextChange}
                  />
                </label>

                {selectedFileName && (
                  <div className={styles.filePreview}>
                    INE seleccionada: {selectedFileName}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFoot}>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className={styles.cancelButton}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className={styles.saveButton}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar comunidad"
                    : "Guardar comunidad"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {ineModalOpen && (
        <div className={styles.modalBg}>
          <div className={styles.ineModal}>
            <div className={styles.ineHead}>
              <div className={styles.ineHeadInfo}>
                <div className={styles.ineHeadIcon}>
                  <FiUserCheck />
                </div>

                <div>
                  <h2>Identificación del delegado</h2>
                  <p>{selectedCommunityName}</p>
                </div>
              </div>

              <button type="button" onClick={() => setIneModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className={styles.ineBody}>
              {selectedDelegado && (
                <div className={styles.ineDelegateRow}>
                  <div className={styles.avatar}>
                    {initials(selectedDelegado)}
                  </div>

                  <div>
                    <strong>{selectedDelegado}</strong>
                    <span>Delegado responsable</span>
                  </div>
                </div>
              )}

              {selectedIne ? (
                <a
                  href={selectedIne}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.ineFrame}
                >
                  <img
                    src={selectedIne}
                    alt={`INE del delegado de ${selectedCommunityName}`}
                    className={styles.ineImage}
                  />
                  <span className={styles.ineZoom}>
                    <FiEye /> Ver en tamaño completo
                  </span>
                </a>
              ) : (
                <div className={styles.noIne}>
                  <FiUserCheck />
                  <p>Esta comunidad no tiene INE registrada.</p>
                </div>
              )}
            </div>

            <div className={styles.modalFoot}>
              {selectedIne && canDownloadIne && (
                <a
                  href={selectedIne}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className={styles.ineDownload}
                >
                  <FiDownload />
                  Descargar
                </a>
              )}

              <Button
                type="button"
                onClick={() => setIneModalOpen(false)}
                className={styles.primaryButton}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
