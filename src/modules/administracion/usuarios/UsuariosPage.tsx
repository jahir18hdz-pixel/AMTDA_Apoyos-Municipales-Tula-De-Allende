import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiUserCheck, FiX } from "react-icons/fi";

import styles from "./UsuariosPage.module.css";

import type { Usuario } from "../../../types/usuarios.types";
import type { Rol } from "../../../types/rol.types";

import { rolService } from "../../../services/rolService";
import {
  actualizarUsuario,
  asignarRolUsuario,
  cambiarEstatusUsuario,
  obtenerUsuariosActivos,
  obtenerUsuariosInactivos,
  registrarUsuario,
} from "../../../services/usuarios.service";

import { ConfirmModal } from "../../../components/ui/confirm-modal/ConfirmModal";
import { useToast } from "@/components/ui/toast/useToast";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

type Vista = "activos" | "inactivos";
type ConfirmVariant = "danger" | "warning" | "success" | "default";

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

export default function UsuariosPage() {
  const toast = useToast();

  const [vista, setVista] = useState<Vista>("activos");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [modalRegistro, setModalRegistro] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarioRol, setUsuarioRol] = useState<Usuario | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmacion, setConfirmacion] = useState(initialConfirmacion);

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);

      const response =
        vista === "activos"
          ? await obtenerUsuariosActivos(pageNumber, PAGE_SIZE)
          : await obtenerUsuariosInactivos(pageNumber, PAGE_SIZE);

      setUsuarios(response.items ?? []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [vista, pageNumber, toast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarUsuarios();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [cargarUsuarios]);

  useEffect(() => {
    let activo = true;

    async function cargarRoles() {
      try {
        const { data } = await rolService.obtenerActivos(1, 100);

        if (!activo) return;

        setRoles(data.items ?? []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    }

    void cargarRoles();

    return () => {
      activo = false;
    };
  }, [toast]);

  const obtenerNombreRol = useCallback(
    (rolId?: string | null) => {
      if (!rolId) return null;
      return roles.find((rol) => rol.id === rolId)?.nombre ?? null;
    },
    [roles]
  );

  const obtenerRolId = useCallback(
    (nombreRol?: string | null) => {
      if (!nombreRol) return "";

      const rol = roles.find(
        (item) => item.nombre.toLowerCase() === nombreRol.toLowerCase()
      );

      return rol?.id ?? "";
    },
    [roles]
  );

  const obtenerRolUsuario = useCallback(
    (usuario: Usuario) => {
      return (
        usuario.rolNombre ||
        usuario.nombreRol ||
        usuario.rol ||
        obtenerNombreRol(usuario.rolId) ||
        "Sin rol"
      );
    },
    [obtenerNombreRol]
  );

  const obtenerSubRolUsuario = useCallback((usuario: Usuario) => {
    return (
      usuario.subRolNombre || usuario.nombreSubRol || usuario.subRol || null
    );
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const value = busqueda.trim().toLowerCase();

    if (!value) return usuarios;

    return usuarios.filter((usuario) => {
      const rol = obtenerRolUsuario(usuario).toLowerCase();
      const subRol = (obtenerSubRolUsuario(usuario) ?? "").toLowerCase();

      return (
        usuario.nombre.toLowerCase().includes(value) ||
        usuario.correo.toLowerCase().includes(value) ||
        rol.includes(value) ||
        subRol.includes(value)
      );
    });
  }, [usuarios, busqueda, obtenerRolUsuario, obtenerSubRolUsuario]);

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

  async function handleRegistrarUsuario(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const nombre = String(formData.get("nombre") ?? "").trim();
    const correo = String(formData.get("correo") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!nombre || !correo || !password) {
      toast.error("Completa todos los campos.");
      return;
    }

    try {
      await registrarUsuario({
        nombre,
        correo,
        password,
      });

      setModalRegistro(false);
      setVista("inactivos");
      setPageNumber(1);
      setBusqueda("");

      const response = await obtenerUsuariosInactivos(1, 100);

      const usuarioCreado = response.items.find(
        (usuario) => usuario.correo.toLowerCase() === correo.toLowerCase()
      );

      setUsuarios(response.items ?? []);
      setTotalPages(response.totalPages || 1);

      toast.success("Usuario registrado correctamente.");

      if (usuarioCreado) {
        setUsuarioRol(usuarioCreado);
      } else {
        toast.success("Puedes verlo en la tabla de inactivos.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleCambiarEstatus(usuario: Usuario) {
    const nuevoEstatus = !usuario.activo;

    try {
      await cambiarEstatusUsuario(usuario.id, nuevoEstatus);

      setUsuarios((prevUsuarios) =>
        prevUsuarios.filter((item) => item.id !== usuario.id)
      );

      if (nuevoEstatus) {
        setVista("activos");
        setPageNumber(1);
        toast.success("Usuario activado correctamente.");
      } else {
        setVista("inactivos");
        setPageNumber(1);
        toast.success("Usuario desactivado correctamente.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  function pedirCambioEstatus(usuario: Usuario) {
    setConfirmacion({
      open: true,
      title: usuario.activo ? "Desactivar usuario" : "Activar usuario",
      message: `¿Seguro que deseas ${
        usuario.activo ? "desactivar" : "activar"
      } al usuario "${usuario.nombre}"?`,
      confirmText: usuario.activo ? "Desactivar" : "Activar",
      variant: usuario.activo ? "danger" : "success",
      loading: false,
      action: () => handleCambiarEstatus(usuario),
    });
  }

  async function handleGuardarUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuarioEditando) return;

    const formData = new FormData(event.currentTarget);

    try {
      await actualizarUsuario(usuarioEditando.id, {
        nombre: String(formData.get("nombre") ?? "").trim(),
        correo: String(formData.get("correo") ?? "").trim(),
      });

      setUsuarioEditando(null);
      await cargarUsuarios();

      toast.success("Usuario actualizado correctamente.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleAsignarRol(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuarioRol) return;

    const formData = new FormData(event.currentTarget);

    const rolId = String(formData.get("rolId") ?? "").trim();
    const subRolId = String(formData.get("subRolId") ?? "").trim();

    if (!rolId) {
      toast.error("Selecciona un rol.");
      return;
    }

    try {
      await asignarRolUsuario(usuarioRol.id, {
        rolId,
        subRolId: subRolId || null,
      });

      setUsuarioRol(null);
      await cargarUsuarios();

      toast.success("Rol asignado correctamente.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function handleCambiarVista() {
    setVista((prev) => (prev === "activos" ? "inactivos" : "activos"));
    setPageNumber(1);
    setBusqueda("");
  }

  return (
    <section className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por nombre, correo o rol..."
            />
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCambiarVista}
            >
              {vista === "activos" ? "Ver inactivos" : "Ver activos"}
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setModalRegistro(true)}
            >
              <FiPlus />
              Nuevo usuario
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Correo verificado</th>
                <th>Rol</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Cargando usuarios...
                  </td>
                </tr>
              )}

              {!loading && usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}

              {!loading &&
                usuariosFiltrados.map((usuario) => {
                  const rolUsuario = obtenerRolUsuario(usuario);
                  const subRolUsuario = obtenerSubRolUsuario(usuario);

                  return (
                    <tr key={usuario.id}>
                      <td>
                        <strong>{usuario.nombre}</strong>
                      </td>

                      <td>{usuario.correo}</td>

                      <td>
                        <span
                          className={
                            usuario.correoVerificado
                              ? styles.statusVerified
                              : styles.statusPending
                          }
                        >
                          {usuario.correoVerificado
                            ? "Verificado"
                            : "Pendiente"}
                        </span>
                      </td>

                      <td>
                        <span className={styles.roleBadge}>{rolUsuario}</span>

                        {subRolUsuario && (
                          <small className={styles.subRole}>
                            {subRolUsuario}
                          </small>
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            usuario.activo
                              ? styles.statusActive
                              : styles.statusInactive
                          }
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => setUsuarioEditando(usuario)}
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            title="Asignar rol"
                            onClick={() => setUsuarioRol(usuario)}
                          >
                            <FiUserCheck />
                          </button>

                          <label
                            className={styles.statusSwitch}
                            title={usuario.activo ? "Desactivar" : "Activar"}
                          >
                            <input
                              type="checkbox"
                              checked={usuario.activo}
                              onChange={() => pedirCambioEstatus(usuario)}
                            />
                            <span />
                          </label>
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
            disabled={pageNumber === 1}
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

      {modalRegistro && (
        <div className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={handleRegistrarUsuario}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Registrar usuario</h2>
                <p>
                  El usuario se registrará como inactivo. Después podrás
                  asignarle un rol y activarlo.
                </p>
              </div>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setModalRegistro(false)}
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              <label>
                Nombre
                <input name="nombre" required />
              </label>

              <label>
                Correo
                <input name="correo" type="email" required />
              </label>

              <label>
                Contraseña
                <input name="password" type="password" required minLength={6} />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setModalRegistro(false)}>
                Cancelar
              </button>

              <button type="submit">Registrar usuario</button>
            </div>
          </form>
        </div>
      )}

      {usuarioEditando && (
        <div className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={handleGuardarUsuario}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Editar usuario</h2>
                <p>Actualiza la información básica del usuario.</p>
              </div>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setUsuarioEditando(null)}
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              <label>
                Nombre
                <input
                  name="nombre"
                  defaultValue={usuarioEditando.nombre}
                  required
                />
              </label>

              <label>
                Correo
                <input
                  name="correo"
                  type="email"
                  defaultValue={usuarioEditando.correo}
                  required
                />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setUsuarioEditando(null)}>
                Cancelar
              </button>

              <button type="submit">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

      {usuarioRol && (
        <div className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={handleAsignarRol}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Asignar rol</h2>
                <p>
                  Usuario seleccionado: <strong>{usuarioRol.nombre}</strong>
                </p>
              </div>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setUsuarioRol(null)}
                title="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              <label>
                Rol
                <select
                  name="rolId"
                  defaultValue={
                    usuarioRol.rolId ?? obtenerRolId(usuarioRol.rol) ?? ""
                  }
                  required
                >
                  <option value="" disabled>
                    Selecciona un rol
                  </option>

                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Subrol
                <select name="subRolId" defaultValue={usuarioRol.subRolId ?? ""}>
                  <option value="">Sin subrol</option>
                </select>
              </label>
            </div>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setUsuarioRol(null)}>
                Cancelar
              </button>

              <button type="submit">Asignar rol</button>
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