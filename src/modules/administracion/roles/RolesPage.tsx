import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiShield, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "../../../components/ui/confirm-modal/ConfirmModal";
import { rolService } from "../../../services/rolService";
import type { Rol, RolPermiso } from "@/types/rol.types";
import { useToast } from "@/components/ui/toast/useToast";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import styles from "./RolesPage.module.css";

const initialForm = {
  nombre: "",
  descripcion: "",
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

type Permiso =
  | string
  | {
      permiso: string;
    };

function getUserPermissions() {
  const rawUser = localStorage.getItem("presi2_auth");

  if (!rawUser) return [];

  try {
    const user = JSON.parse(rawUser) as {
      permisos?: Permiso[];
      permissions?: Permiso[];
    };

    const permisosRaw = user.permisos ?? user.permissions ?? [];

    return permisosRaw
      .map((permiso) =>
        typeof permiso === "string" ? permiso : permiso.permiso
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

export default function RolesPage() {
  const toast = useToast();
  const permissions = useMemo(() => getUserPermissions(), []);

  const hasPermission = (permission: string) => permissions.includes(permission);

  const canCreate = hasPermission("roles.create");
  const canEdit = hasPermission("roles.edit");
  const canChangeStatus = hasPermission("roles.status");
  const canManagePermissions = hasPermission("roles.permissions");

  const [roles, setRoles] = useState<Rol[]>([]);
  const [query, setQuery] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [rolPermisos, setRolPermisos] = useState<RolPermiso[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmacion, setConfirmacion] = useState(initialConfirmacion);

  async function cargarRoles() {
    try {
      setLoading(true);

      const { data } = mostrarInactivos
        ? await rolService.obtenerInactivos(1, 20)
        : await rolService.obtenerActivos(1, 20);

      setRoles(data.items ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        setLoading(true);

        const { data } = mostrarInactivos
          ? await rolService.obtenerInactivos(1, 20)
          : await rolService.obtenerActivos(1, 20);

        if (!activo) return;

        setRoles(data.items ?? []);
      } catch (error) {
        if (activo) {
          toast.error(getApiErrorMessage(error));
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
  }, [mostrarInactivos, toast]);

  const rolesFiltrados = useMemo(() => {
    const value = query.toLowerCase().trim();

    if (!value) return roles;

    return roles.filter((rol) => {
      return (
        rol.nombre.toLowerCase().includes(value) ||
        rol.descripcion?.toLowerCase().includes(value)
      );
    });
  }, [roles, query]);

  const permisosAgrupados = useMemo(() => {
    return rolPermisos.reduce<Record<string, RolPermiso[]>>((acc, permiso) => {
      const modulo = permiso.modulo || "General";

      if (!acc[modulo]) acc[modulo] = [];

      acc[modulo].push(permiso);

      return acc;
    }, {});
  }, [rolPermisos]);

  const showActions = canEdit || canChangeStatus || canManagePermissions;

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

  function openModal(rol?: Rol) {
    if (rol && !canEdit) return;
    if (!rol && !canCreate) return;

    if (rol) {
      setEditingId(rol.id);
      setForm({
        nombre: rol.nombre,
        descripcion: rol.descripcion ?? "",
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

  function cerrarPermisos() {
    setPermissionsModalOpen(false);
    setSelectedRol(null);
    setRolPermisos([]);
  }

  function toggleVista() {
    setMostrarInactivos((prev) => !prev);
    setQuery("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId && !canEdit) return;
    if (!editingId && !canCreate) return;

    try {
      setSaving(true);

      if (editingId) {
        await rolService.actualizar(editingId, form);
        toast.success("Rol actualizado correctamente.");
      } else {
        await rolService.crear(form);
        toast.success("Rol creado correctamente.");
      }

      closeModal();
      await cargarRoles();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstatus(rol: Rol) {
    if (!canChangeStatus) return;

    try {
      await rolService.cambiarEstatus(rol.id, {
        activo: !rol.activo,
      });

      await cargarRoles();

      toast.success(
        rol.activo
          ? "Rol desactivado correctamente."
          : "Rol activado correctamente."
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  function pedirCambioEstatus(rol: Rol) {
    setConfirmacion({
      open: true,
      title: rol.activo ? "Desactivar rol" : "Activar rol",
      message: `¿Seguro que deseas ${
        rol.activo ? "desactivar" : "activar"
      } el rol "${rol.nombre}"?`,
      confirmText: rol.activo ? "Desactivar" : "Activar",
      variant: rol.activo ? "danger" : "success",
      loading: false,
      action: () => cambiarEstatus(rol),
    });
  }

  async function openPermissionsModal(rol: Rol) {
    if (!canManagePermissions) return;

    try {
      setSelectedRol(rol);
      setPermissionsModalOpen(true);

      const { data } = await rolService.obtenerPermisos(rol.id);

      setRolPermisos(data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function togglePermiso(permiso: RolPermiso) {
    if (!selectedRol) return;

    const nuevoValor = !permiso.asignado;

    setRolPermisos((prev) =>
      prev.map((item) =>
        item.permisoId === permiso.permisoId
          ? { ...item, asignado: nuevoValor }
          : item
      )
    );

    try {
      await rolService.actualizarPermiso(selectedRol.id, {
        permisoId: permiso.permisoId,
        asignado: nuevoValor,
      });

      toast.success(
        nuevoValor
          ? "Permiso asignado correctamente."
          : "Permiso removido correctamente."
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));

      setRolPermisos((prev) =>
        prev.map((item) =>
          item.permisoId === permiso.permisoId
            ? { ...item, asignado: permiso.asignado }
            : item
        )
      );
    }
  }

  return (
    <section className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar rol..."
            />
          </div>

          <div className={styles.toolbarActions}>
            <Button
              type="button"
              variant="outline"
              onClick={toggleVista}
              className={styles.secondaryButton}
            >
              {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
            </Button>

            {canCreate && (
              <Button
                type="button"
                onClick={() => openModal()}
                className={styles.primaryButton}
              >
                <FiPlus />
                Nuevo rol
              </Button>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rol</th>
                <th>Descripción</th>
                <th>Estatus</th>
                {showActions && <th>Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={showActions ? 4 : 3} className={styles.empty}>
                    Cargando roles...
                  </td>
                </tr>
              ) : rolesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 4 : 3} className={styles.empty}>
                    No se encontraron roles.
                  </td>
                </tr>
              ) : (
                rolesFiltrados.map((rol) => (
                  <tr key={rol.id}>
                    <td>
                      <strong>{rol.nombre}</strong>
                    </td>

                    <td>{rol.descripcion || "Sin descripción"}</td>

                    <td>
                      <span
                        className={rol.activo ? styles.active : styles.inactive}
                      >
                        {rol.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {showActions && (
                      <td>
                        <div className={styles.actions}>
                          {canManagePermissions && (
                            <button
                              type="button"
                              className={styles.actionPermissions}
                              title="Permisos"
                              onClick={() => void openPermissionsModal(rol)}
                            >
                              <FiShield />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              className={styles.actionEdit}
                              title="Editar"
                              onClick={() => openModal(rol)}
                            >
                              <FiEdit2 />
                            </button>
                          )}

                          {canChangeStatus && (
                            <label
                              className={styles.statusSwitch}
                              title={rol.activo ? "Desactivar" : "Activar"}
                            >
                              <input
                                type="checkbox"
                                checked={rol.activo}
                                onChange={() => pedirCambioEstatus(rol)}
                              />
                              <span />
                            </label>
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
      </section>

      {modalOpen && (
        <div className={styles.modalBg}>
          <form className={styles.modal} onSubmit={handleSubmit}>
            <div className={styles.modalHead}>
              <div>
                <h2>{editingId ? "Editar rol" : "Nuevo rol"}</h2>
                <p>
                  {editingId
                    ? "Actualiza la información del rol."
                    : "Crea un rol para asignarle permisos."}
                </p>
              </div>

              <button type="button" onClick={closeModal} title="Cerrar">
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              <label>
                Nombre del rol <span>*</span>
                <input
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      nombre: event.target.value,
                    }))
                  }
                  placeholder="Ej. Administrador"
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
                  placeholder="Describe brevemente el propósito del rol"
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
                    ? "Guardar cambios"
                    : "Crear rol"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {permissionsModalOpen && selectedRol && (
        <div className={styles.modalBg}>
          <div className={styles.permissionsModal}>
            <div className={styles.modalHead}>
              <div>
                <h2>Permisos del rol</h2>
                <p>{selectedRol.nombre}</p>
              </div>

              <button type="button" onClick={cerrarPermisos} title="Cerrar">
                <FiX />
              </button>
            </div>

            <div className={styles.permissionsBody}>
              {Object.entries(permisosAgrupados).length === 0 ? (
                <div className={styles.emptyPermissions}>
                  No hay permisos disponibles para mostrar.
                </div>
              ) : (
                Object.entries(permisosAgrupados).map(([modulo, permisos]) => (
                  <div key={modulo} className={styles.permissionGroup}>
                    <h3>{modulo}</h3>

                    <div className={styles.permissionList}>
                      {permisos.map((permiso) => (
                        <label
                          key={permiso.permisoId}
                          className={styles.permissionItem}
                        >
                          <div>
                            <strong>{permiso.nombre}</strong>
                            <span>{permiso.descripcion || permiso.codigo}</span>
                          </div>

                          <input
                            type="checkbox"
                            checked={permiso.asignado}
                            onChange={() => void togglePermiso(permiso)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.modalFoot}>
              <Button
                type="button"
                onClick={cerrarPermisos}
                className={styles.primaryButton}
              >
                Listo
              </Button>
            </div>
          </div>
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