import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import styles from "./FondosPage.module.css";
import {
  actualizarFondo,
  cambiarEstatusFondo,
  crearFondo,
  eliminarFondo,
  obtenerFondosActivos,
  obtenerFondosInactivos,
} from "../../services/fondos.service";
import type { CrearFondoDto, Fondo } from "../../types/fondos.types";
import { useToast } from "@/components/ui/toast/useToast";
import { ConfirmModal } from "../../components/ui/confirm-modal/ConfirmModal";

const PAGE_SIZE = 10;

const initialForm: CrearFondoDto = {
  codigo: "",
  nombre: "",
  descripcion: "",
  montoMaximo: null,
  requiereValidacion: false,
};

type ConfirmVariant = "danger" | "warning" | "success" | "default";

const initialConfirmacion = {
  open: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  variant: "default" as ConfirmVariant,
  loading: false,
  action: null as (() => Promise<void>) | null,
};

function dividirEnFilasDeCinco(texto: string) {
  const palabras = texto.trim().split(/\s+/);

  return palabras.reduce<string[]>((filas, palabra, index) => {
    const fila = Math.floor(index / 5);

    if (!filas[fila]) filas[fila] = "";
    filas[fila] += `${filas[fila] ? " " : ""}${palabra}`;

    return filas;
  }, []);
}

export default function FondosPage() {
  const toast = useToast();

  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [form, setForm] = useState<CrearFondoDto>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [descripcionesAbiertas, setDescripcionesAbiertas] = useState<
    Record<string, boolean>
  >({});
  const [confirmacion, setConfirmacion] = useState(initialConfirmacion);

  const fondosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return fondos;

    return fondos.filter((fondo) =>
      [
        fondo.codigo,
        fondo.nombre,
        fondo.descripcion ?? "",
        fondo.montoMaximo?.toString() ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [fondos, busqueda]);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setLoading(true);

        const resultado = mostrarInactivos
          ? await obtenerFondosInactivos(pageNumber, PAGE_SIZE)
          : await obtenerFondosActivos(pageNumber, PAGE_SIZE);

        if (cancelado) return;

        setFondos(resultado.items ?? []);
        setTotalPages(resultado.totalPages || 1);
      } catch (error) {
        if (!cancelado) {
          toast.error(error);
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [pageNumber, mostrarInactivos, toast]);

  async function recargarFondos() {
    const resultado = mostrarInactivos
      ? await obtenerFondosInactivos(pageNumber, PAGE_SIZE)
      : await obtenerFondosActivos(pageNumber, PAGE_SIZE);

    setFondos(resultado.items ?? []);
    setTotalPages(resultado.totalPages || 1);
  }

  function limpiarFormulario() {
    setForm(initialForm);
    setEditingId(null);
  }

  function abrirNuevo() {
    limpiarFormulario();
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    limpiarFormulario();
  }

  function editarFondo(fondo: Fondo) {
    setEditingId(fondo.id);
    setForm({
      codigo: fondo.codigo,
      nombre: fondo.nombre,
      descripcion: fondo.descripcion ?? "",
      montoMaximo: fondo.montoMaximo ?? null,
      requiereValidacion: fondo.requiereValidacion,
    });
    setModalAbierto(true);
  }

  function toggleDescripcion(id: string) {
    setDescripcionesAbiertas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function cerrarConfirmacion() {
    if (confirmacion.loading) return;
    setConfirmacion(initialConfirmacion);
  }

  async function confirmarAccion() {
    if (!confirmacion.action) return;

    try {
      setConfirmacion((prev) => ({
        ...prev,
        loading: true,
      }));

      await confirmacion.action();

      setConfirmacion(initialConfirmacion);
    } catch {
      setConfirmacion((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }

  async function guardarFondo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error("El código y el nombre son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      if (editingId) {
        await actualizarFondo(editingId, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion?.trim() || null,
          montoMaximo: form.montoMaximo,
          requiereValidacion: form.requiereValidacion,
        });

        toast.success("Fondo actualizado correctamente.");
      } else {
        await crearFondo({
          codigo: form.codigo.trim().toUpperCase(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion?.trim() || null,
          montoMaximo: form.montoMaximo,
          requiereValidacion: form.requiereValidacion,
        });

        toast.success("Fondo creado correctamente.");
      }

      cerrarModal();
      await recargarFondos();
    } catch (error) {
      toast.error(error);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstatus(fondo: Fondo) {
    try {
      await cambiarEstatusFondo(fondo.id, { activo: !fondo.activo });
      await recargarFondos();

      toast.success(
        fondo.activo
          ? "Fondo desactivado correctamente."
          : "Fondo activado correctamente."
      );
    } catch (error) {
      toast.error(error);
      throw error;
    }
  }

  async function eliminar(fondo: Fondo) {
    try {
      await eliminarFondo(fondo.id);
      await recargarFondos();

      toast.success("Fondo eliminado correctamente.");
    } catch (error) {
      toast.error(error);
      throw error;
    }
  }

  function pedirCambioEstatus(fondo: Fondo) {
    setConfirmacion({
      open: true,
      title: fondo.activo ? "Desactivar fondo" : "Activar fondo",
      message: `¿Seguro que deseas ${
        fondo.activo ? "desactivar" : "activar"
      } el fondo "${fondo.nombre}"?`,
      confirmText: fondo.activo ? "Desactivar" : "Activar",
      variant: fondo.activo ? "danger" : "success",
      loading: false,
      action: () => cambiarEstatus(fondo),
    });
  }

  function pedirEliminar(fondo: Fondo) {
    setConfirmacion({
      open: true,
      title: "Eliminar fondo",
      message: `¿Seguro que deseas eliminar el fondo "${fondo.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "danger",
      loading: false,
      action: () => eliminar(fondo),
    });
  }

  function cambiarVista() {
    setMostrarInactivos((prev) => !prev);
    setPageNumber(1);
    setDescripcionesAbiertas({});
    limpiarFormulario();
  }

  return (
    <section className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              value={busqueda}
              placeholder="Buscar por código, nombre o descripción..."
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={cambiarVista}
            >
              {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={abrirNuevo}
            >
              <FiPlus />
              Nuevo fondo
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Monto máximo</th>
                <th>Validación</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    Cargando fondos...
                  </td>
                </tr>
              )}

              {!loading && fondosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    No se encontraron fondos.
                  </td>
                </tr>
              )}

              {!loading &&
                fondosFiltrados.map((fondo) => {
                  const descripcion = fondo.descripcion?.trim();
                  const palabrasDescripcion = descripcion
                    ? descripcion.split(/\s+/)
                    : [];
                  const descripcionLarga = palabrasDescripcion.length > 5;
                  const descripcionAbierta =
                    descripcionesAbiertas[fondo.id] ?? false;

                  return (
                    <tr key={fondo.id}>
                      <td>
                        <strong>{fondo.codigo}</strong>
                      </td>

                      <td>{fondo.nombre}</td>

                      <td>
                        {descripcion ? (
                          <div className={styles.descripcionCell}>
                            {descripcionLarga && descripcionAbierta
                              ? dividirEnFilasDeCinco(descripcion).map(
                                  (fila, index) => (
                                    <span key={`${fondo.id}-${index}`}>
                                      {fila}
                                    </span>
                                  )
                                )
                              : descripcionLarga
                                ? `${palabrasDescripcion
                                    .slice(0, 5)
                                    .join(" ")}...`
                                : descripcion}

                            {descripcionLarga && (
                              <button
                                type="button"
                                className={styles.linkButton}
                                onClick={() => toggleDescripcion(fondo.id)}
                              >
                                {descripcionAbierta ? "Ver menos" : "Ver más"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className={styles.muted}>Sin descripción</span>
                        )}
                      </td>

                      <td>
                        {fondo.montoMaximo != null
                          ? fondo.montoMaximo.toLocaleString("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            })
                          : "Sin monto"}
                      </td>

                      <td>
                        {fondo.requiereValidacion ? (
                          <span className={styles.success}>
                            <FiCheckCircle /> Sí
                          </span>
                        ) : (
                          <span className={styles.muted}>No</span>
                        )}
                      </td>

                      <td>
                        {fondo.activo ? (
                          <span className={styles.active}>Activo</span>
                        ) : (
                          <span className={styles.inactive}>Inactivo</span>
                        )}
                      </td>

                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => editarFondo(fondo)}
                          >
                            <FiEdit2 />
                          </button>

                          <label
                            className={styles.statusSwitch}
                            title={fondo.activo ? "Desactivar" : "Activar"}
                          >
                            <input
                              type="checkbox"
                              checked={fondo.activo}
                              onChange={() => pedirCambioEstatus(fondo)}
                            />
                            <span />
                          </label>

                          <button
                            type="button"
                            title="Eliminar"
                            onClick={() => pedirEliminar(fondo)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((prev) => prev - 1)}
          >
            Anterior
          </button>

          <span>
            Página {pageNumber} de {totalPages}
          </span>

          <button
            type="button"
            disabled={pageNumber >= totalPages}
            onClick={() => setPageNumber((prev) => prev + 1)}
          >
            Siguiente
          </button>
        </footer>
      </section>

      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={guardarFondo}>
            <div className={styles.formHeader}>
              <h2>{editingId ? "Editar fondo" : "Nuevo fondo"}</h2>

              <button
                type="button"
                className={styles.iconButton}
                onClick={cerrarModal}
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <label>
              Código
              <input
                value={form.codigo}
                disabled={!!editingId}
                placeholder="Ej. FONDO-001"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    codigo: e.target.value.toUpperCase(),
                  }))
                }
                required
              />
            </label>

            <label>
              Nombre
              <input
                value={form.nombre}
                placeholder="Nombre del fondo"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Descripción
              <textarea
                value={form.descripcion ?? ""}
                placeholder="Descripción del fondo"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Monto máximo
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.montoMaximo ?? ""}
                placeholder="0.00"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    montoMaximo: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.requiereValidacion}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    requiereValidacion: e.target.checked,
                  }))
                }
              />
              Requiere validación
            </label>

            <div className={styles.modalActions}>
              <button type="button" onClick={cerrarModal}>
                Cancelar
              </button>

              <button type="submit" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear fondo"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={confirmacion.open}
        title={confirmacion.title}
        message={confirmacion.message}
        confirmText={confirmacion.confirmText}
        variant={confirmacion.variant}
        loading={confirmacion.loading}
        onCancel={cerrarConfirmacion}
        onConfirm={() => void confirmarAccion()}
      />
    </section>
  );
}