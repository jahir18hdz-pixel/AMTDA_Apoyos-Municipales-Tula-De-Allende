import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiKey,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { permisoService } from "../../../services/permisosService";
import type { Permiso } from "../../../types/permisos.types";
import styles from "./PermisosPage.module.css";

const initialForm = {
  codigo: "",
  nombre: "",
  modulo: "",
  descripcion: "",
};

function getUserPermissions() {
  const rawUser = localStorage.getItem("presi2_auth");

  if (!rawUser) {
    return [
      "permisos.view",
      "permisos.create",
      "permisos.edit",
      "permisos.status",
    ];
  }

  try {
    const user = JSON.parse(rawUser) as { permissions?: string[] };
    return user.permissions ?? [];
  } catch {
    return [];
  }
}

export default function PermisosPage() {
  const permissions = useMemo(() => getUserPermissions(), []);

  const hasPermission = (permission: string) => permissions.includes(permission);

  const canCreate = hasPermission("permisos.create");
  const canEdit = hasPermission("permisos.edit");
  const canChangeStatus = hasPermission("permisos.status");

  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [query, setQuery] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function recargarPermisos() {
    const { data } = mostrarInactivos
      ? await permisoService.obtenerInactivos(1, 50)
      : await permisoService.obtenerActivos(1, 50);

    setPermisos(data.items);
  }

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        setLoading(true);

        const { data } = mostrarInactivos
          ? await permisoService.obtenerInactivos(1, 50)
          : await permisoService.obtenerActivos(1, 50);

        if (!activo) return;

        setPermisos(data.items);
      } catch (error) {
        if (activo) {
          console.error("Error al cargar permisos", error);
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }

    void cargarInicial();

    return () => {
      activo = false;
    };
  }, [mostrarInactivos]);

  const permisosFiltrados = useMemo(() => {
    const value = query.toLowerCase().trim();

    if (!value) return permisos;

    return permisos.filter((permiso) => {
      return (
        permiso.codigo.toLowerCase().includes(value) ||
        permiso.nombre.toLowerCase().includes(value) ||
        permiso.modulo.toLowerCase().includes(value) ||
        permiso.descripcion?.toLowerCase().includes(value)
      );
    });
  }, [permisos, query]);

  const permisosAgrupados = useMemo(() => {
    return permisosFiltrados.reduce<Record<string, Permiso[]>>((acc, permiso) => {
      const modulo = permiso.modulo || "General";

      if (!acc[modulo]) acc[modulo] = [];

      acc[modulo].push(permiso);

      return acc;
    }, {});
  }, [permisosFiltrados]);

  function openModal(permiso?: Permiso) {
    if (permiso && !canEdit) return;
    if (!permiso && !canCreate) return;

    if (permiso) {
      setEditingId(permiso.id);
      setForm({
        codigo: permiso.codigo,
        nombre: permiso.nombre,
        modulo: permiso.modulo,
        descripcion: permiso.descripcion ?? "",
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId && !canEdit) return;
    if (!editingId && !canCreate) return;

    try {
      setSaving(true);

      const payload = {
        codigo: form.codigo.trim().toLowerCase(),
        nombre: form.nombre.trim(),
        modulo: form.modulo.trim(),
        descripcion: form.descripcion.trim(),
      };

      if (editingId) {
        await permisoService.actualizar(editingId, payload);
      } else {
        await permisoService.crear(payload);
      }

      closeModal();
      await recargarPermisos();
    } catch (error) {
      console.error("Error al guardar permiso", error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEstatus(permiso: Permiso) {
    if (!canChangeStatus) return;

    try {
      await permisoService.cambiarEstatus(permiso.id, {
        activo: !permiso.activo,
      });

      await recargarPermisos();
    } catch (error) {
      console.error("Error al cambiar estatus del permiso", error);
    }
  }

  const showActions = canEdit || canChangeStatus;

  return (
    <section className={styles.page}>
      {/* HEADER - Fijo (no hace scroll) */}
      <div className={styles.header}>
        <div>
          <h1>Catálogo de vistas y acciones disponibles en el sistema</h1>
        </div>

        {canCreate && (
          <Button onClick={() => openModal()} className={styles.primaryButton}>
            <FiPlus size={20} />
            Nuevo permiso
          </Button>
        )}
      </div>

      {/* TOOLBAR - Fijo (no hace scroll) */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar permiso, código o módulo…"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setMostrarInactivos((prev) => !prev)}
          className={styles.toggleButton}
        >
          {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
        </Button>
      </div>

      {/* CONTENIDO CON SCROLL */}
      <div className={styles.scrollableContent}>
        <div className={styles.groups}>
          {loading ? (
            <div className={styles.empty}>
              <div className={styles.spinner}></div>
              <p>Cargando permisos...</p>
            </div>
          ) : Object.keys(permisosAgrupados).length === 0 ? (
            <div className={styles.empty}>
              <p>
                {query
                  ? "No se encontraron permisos con esa búsqueda."
                  : "No hay permisos registrados."}
              </p>
              {query && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setQuery("")}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            Object.entries(permisosAgrupados).map(([modulo, permisosModulo]) => (
              <div key={modulo} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <h2>{modulo}</h2>
                  <span>{permisosModulo.length} permisos</span>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Estatus</th>
                        {showActions && <th style={{ width: "120px" }}>Acciones</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {permisosModulo.map((permiso) => (
                        <tr key={permiso.id}>
                          <td>
                            <span className={styles.code}>
                              {permiso.codigo}
                            </span>
                          </td>

                          <td>
                            <div className={styles.nameCell}>
                              <div className={styles.icon}>
                                <FiKey size={18} />
                              </div>
                              <strong>{permiso.nombre}</strong>
                            </div>
                          </td>

                          <td>
                            {permiso.descripcion ? (
                              <span className={styles.description}>
                                {permiso.descripcion}
                              </span>
                            ) : (
                              <span className={styles.noDescription}>—</span>
                            )}
                          </td>

                          <td>
                            <span
                              className={
                                permiso.activo ? styles.active : styles.inactive
                              }
                            >
                              {permiso.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>

                          {showActions && (
                            <td>
                              <div className={styles.actions}>
                                {canEdit && (
                                  <button
                                    className={styles.actionEdit}
                                    title="Editar permiso"
                                    onClick={() => openModal(permiso)}
                                  >
                                    <FiEdit2 size={16} />
                                  </button>
                                )}

                                {canChangeStatus && (
                                  <button
                                    className={
                                      permiso.activo
                                        ? styles.actionDisable
                                        : styles.actionEnable
                                    }
                                    title={
                                      permiso.activo ? "Desactivar" : "Activar"
                                    }
                                    onClick={() => toggleEstatus(permiso)}
                                  >
                                    <FiTrash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className={styles.modalBg} onClick={closeModal}>
          <form
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className={styles.modalHead}>
              <div>
                <h2>{editingId ? "Editar permiso" : "Nuevo permiso"}</h2>
                <p>
                  {editingId
                    ? "Actualiza los datos del permiso."
                    : "Registra una vista o acción disponible."}
                </p>
              </div>

              <button type="button" onClick={closeModal} title="Cerrar">
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <label>
                Código <span>*</span>
                <input
                  value={form.codigo}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      codigo: event.target.value,
                    }))
                  }
                  placeholder="Ej. comunidades.create"
                  required
                  autoFocus
                />
                <small>Ejemplo: modulo.accion</small>
              </label>

              <label>
                Nombre <span>*</span>
                <input
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      nombre: event.target.value,
                    }))
                  }
                  placeholder="Ej. Crear comunidades"
                  required
                />
              </label>

              <label>
                Módulo <span>*</span>
                <input
                  value={form.modulo}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      modulo: event.target.value,
                    }))
                  }
                  placeholder="Ej. Catálogos"
                  required
                />
              </label>

              <label>
                Descripción
                <textarea
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      descripcion: event.target.value,
                    }))
                  }
                  placeholder="Describe qué permite hacer este permiso"
                  rows={4}
                />
              </label>
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
                className={styles.primaryButton}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar permiso"
                    : "Guardar permiso"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}