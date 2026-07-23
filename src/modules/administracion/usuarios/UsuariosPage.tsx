import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import {
  FiCheck,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiSearch,
  FiUserCheck,
  FiX,
} from "react-icons/fi";

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

type CampoRegistro =
  | "nombre"
  | "correo"
  | "password"
  | "confirmarPassword";

type RegistroForm = {
  nombre: string;
  correo: string;
  password: string;
  confirmarPassword: string;
};

type RegistroErrors = Partial<Record<CampoRegistro, string>>;
type CamposTocados = Partial<Record<CampoRegistro, boolean>>;

type ApiValidationError = {
  response?: {
    data?: {
      message?: string;
      errores?: string[];
    };
  };
};

const PAGE_SIZE = 10;

const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialRegistroForm: RegistroForm = {
  nombre: "",
  correo: "",
  password: "",
  confirmarPassword: "",
};

const initialConfirmacion = {
  open: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  variant: "default" as ConfirmVariant,
  loading: false,
  action: null as (() => Promise<void>) | null,
};

function formatearNombre(value: string) {
  return value
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\b\p{L}/gu, (letra) => letra.toUpperCase());
}

export default function UsuariosPage() {
  const toast = useToast();

  const [vista, setVista] = useState<Vista>("activos");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [modalRegistro, setModalRegistro] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarioRol, setUsuarioRol] = useState<Usuario | null>(null);

  const [registroForm, setRegistroForm] =
    useState<RegistroForm>(initialRegistroForm);
  const [registroErrors, setRegistroErrors] = useState<RegistroErrors>({});
  const [camposTocados, setCamposTocados] = useState<CamposTocados>({});

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmacion, setConfirmacion] = useState(initialConfirmacion);

  const passwordRules = useMemo(
    () => ({
      longitud: registroForm.password.length >= 8,
      mayuscula: /[A-Z]/.test(registroForm.password),
      minuscula: /[a-z]/.test(registroForm.password),
      numero: /\d/.test(registroForm.password),
      especial: /[^A-Za-z0-9]/.test(registroForm.password),
      sinEspacios: !/\s/.test(registroForm.password),
    }),
    [registroForm.password]
  );

  const passwordValido = useMemo(
    () => Object.values(passwordRules).every(Boolean),
    [passwordRules]
  );

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

  function validarCampoRegistro(
    campo: CampoRegistro,
    valor: string,
    formulario: RegistroForm = registroForm
  ): string {
    switch (campo) {
      case "nombre": {
        const nombre = valor.trim();

        if (!nombre) {
          return "El nombre es obligatorio.";
        }

        if (nombre.length < 3) {
          return "El nombre debe tener al menos 3 caracteres.";
        }

        if (nombre.length > 100) {
          return "El nombre no puede superar los 100 caracteres.";
        }

        if (!NOMBRE_REGEX.test(nombre)) {
          return "El nombre solo puede contener letras, espacios, guiones y apóstrofes.";
        }

        return "";
      }

      case "correo": {
        const correo = valor.trim();

        if (!correo) {
          return "El correo es obligatorio.";
        }

        if (correo.length > 150) {
          return "El correo no puede superar los 150 caracteres.";
        }

        if (!CORREO_REGEX.test(correo)) {
          return "Ingresa un correo electrónico válido.";
        }

        return "";
      }

      case "password": {
        if (!valor) {
          return "La contraseña es obligatoria.";
        }

        if (valor.length < 8) {
          return "La contraseña debe tener al menos 8 caracteres.";
        }

        if (!/[A-Z]/.test(valor)) {
          return "La contraseña debe contener una letra mayúscula.";
        }

        if (!/[a-z]/.test(valor)) {
          return "La contraseña debe contener una letra minúscula.";
        }

        if (!/\d/.test(valor)) {
          return "La contraseña debe contener un número.";
        }

        if (!/[^A-Za-z0-9]/.test(valor)) {
          return "La contraseña debe contener un carácter especial.";
        }

        if (/\s/.test(valor)) {
          return "La contraseña no puede contener espacios.";
        }

        return "";
      }

      case "confirmarPassword": {
        if (!valor) {
          return "Confirma la contraseña.";
        }

        if (valor !== formulario.password) {
          return "Las contraseñas no coinciden.";
        }

        return "";
      }

      default:
        return "";
    }
  }

  function validarFormularioRegistro(formulario: RegistroForm) {
    const errores: RegistroErrors = {
      nombre: validarCampoRegistro("nombre", formulario.nombre, formulario),
      correo: validarCampoRegistro("correo", formulario.correo, formulario),
      password: validarCampoRegistro(
        "password",
        formulario.password,
        formulario
      ),
      confirmarPassword: validarCampoRegistro(
        "confirmarPassword",
        formulario.confirmarPassword,
        formulario
      ),
    };

    Object.keys(errores).forEach((key) => {
      const campo = key as CampoRegistro;

      if (!errores[campo]) {
        delete errores[campo];
      }
    });

    return errores;
  }

  function handleRegistroChange(event: ChangeEvent<HTMLInputElement>) {
    const campo = event.target.name as CampoRegistro;
    let value = event.target.value;

    if (campo === "nombre") {
      value = formatearNombre(value);
    }

    if (campo === "correo") {
      value = value.replace(/\s/g, "").toLowerCase();
    }

    const siguienteFormulario: RegistroForm = {
      ...registroForm,
      [campo]: value,
    };

    setRegistroForm(siguienteFormulario);

    setRegistroErrors((prev) => {
      const nuevosErrores = { ...prev };

      if (camposTocados[campo]) {
        const mensaje = validarCampoRegistro(
          campo,
          value,
          siguienteFormulario
        );

        if (mensaje) {
          nuevosErrores[campo] = mensaje;
        } else {
          delete nuevosErrores[campo];
        }
      }

      if (
        campo === "password" &&
        camposTocados.confirmarPassword &&
        siguienteFormulario.confirmarPassword
      ) {
        const mensajeConfirmacion = validarCampoRegistro(
          "confirmarPassword",
          siguienteFormulario.confirmarPassword,
          siguienteFormulario
        );

        if (mensajeConfirmacion) {
          nuevosErrores.confirmarPassword = mensajeConfirmacion;
        } else {
          delete nuevosErrores.confirmarPassword;
        }
      }

      return nuevosErrores;
    });
  }

  function handleRegistroBlur(event: FocusEvent<HTMLInputElement>) {
    const campo = event.target.name as CampoRegistro;
    const value = event.target.value;

    setCamposTocados((prev) => ({
      ...prev,
      [campo]: true,
    }));

    const mensaje = validarCampoRegistro(campo, value, registroForm);

    setRegistroErrors((prev) => {
      const nuevosErrores = { ...prev };

      if (mensaje) {
        nuevosErrores[campo] = mensaje;
      } else {
        delete nuevosErrores[campo];
      }

      return nuevosErrores;
    });
  }

  function abrirModalRegistro() {
    setRegistroForm(initialRegistroForm);
    setRegistroErrors({});
    setCamposTocados({});
    setMostrarPassword(false);
    setMostrarConfirmacion(false);
    setModalRegistro(true);
  }

  function cerrarModalRegistro() {
    if (registrando) return;

    setModalRegistro(false);
    setRegistroForm(initialRegistroForm);
    setRegistroErrors({});
    setCamposTocados({});
    setMostrarPassword(false);
    setMostrarConfirmacion(false);
  }

  function obtenerErroresBackend(error: unknown): string[] {
    const apiError = error as ApiValidationError;
    const errores = apiError.response?.data?.errores;

    if (Array.isArray(errores)) {
      return errores;
    }

    const mensaje = apiError.response?.data?.message;

    return mensaje ? [mensaje] : [];
  }

  function aplicarErroresBackend(errores: string[]) {
    const nuevosErrores: RegistroErrors = {};

    errores.forEach((error) => {
      const mensaje = error.toLowerCase();

      if (mensaje.includes("correo")) {
        nuevosErrores.correo = error;
        return;
      }

      if (mensaje.includes("nombre")) {
        nuevosErrores.nombre = error;
        return;
      }

      if (
        mensaje.includes("contraseña") ||
        mensaje.includes("password")
      ) {
        nuevosErrores.password = error;
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setRegistroErrors((prev) => ({
        ...prev,
        ...nuevosErrores,
      }));

      setCamposTocados({
        nombre: true,
        correo: true,
        password: true,
        confirmarPassword: true,
      });
    }
  }

  async function handleRegistrarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formularioNormalizado: RegistroForm = {
      nombre: formatearNombre(registroForm.nombre.trim()),
      correo: registroForm.correo.trim().toLowerCase(),
      password: registroForm.password,
      confirmarPassword: registroForm.confirmarPassword,
    };

    const errores = validarFormularioRegistro(formularioNormalizado);

    setCamposTocados({
      nombre: true,
      correo: true,
      password: true,
      confirmarPassword: true,
    });

    setRegistroErrors(errores);

    if (Object.keys(errores).length > 0) {
      toast.error("Revisa los campos marcados antes de continuar.");
      return;
    }

    try {
      setRegistrando(true);

      await registrarUsuario({
        nombre: formularioNormalizado.nombre,
        correo: formularioNormalizado.correo,
        password: formularioNormalizado.password,
      });

      setModalRegistro(false);
      setRegistroForm(initialRegistroForm);
      setRegistroErrors({});
      setCamposTocados({});

      setVista("inactivos");
      setPageNumber(1);
      setBusqueda("");

      const response = await obtenerUsuariosInactivos(1, 100);

      const usuarioCreado = response.items.find(
        (usuario) =>
          usuario.correo.toLowerCase() ===
          formularioNormalizado.correo.toLowerCase()
      );

      setUsuarios(response.items ?? []);
      setTotalPages(response.totalPages || 1);

      toast.success("Usuario registrado correctamente.");

      if (usuarioCreado) {
        setUsuarioRol(usuarioCreado);
      }
    } catch (error) {
      const erroresBackend = obtenerErroresBackend(error);

      if (erroresBackend.length > 0) {
        aplicarErroresBackend(erroresBackend);
        toast.error(erroresBackend[0]);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setRegistrando(false);
    }
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

  async function handleGuardarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuarioEditando) return;

    const formData = new FormData(event.currentTarget);

    const nombre = formatearNombre(
      String(formData.get("nombre") ?? "").trim()
    );

    const correo = String(formData.get("correo") ?? "")
      .trim()
      .toLowerCase();

    if (!nombre) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    if (nombre.length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres.");
      return;
    }

    if (!NOMBRE_REGEX.test(nombre)) {
      toast.error(
        "El nombre solo puede contener letras, espacios, guiones y apóstrofes."
      );
      return;
    }

    if (!CORREO_REGEX.test(correo)) {
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }

    try {
      await actualizarUsuario(usuarioEditando.id, {
        nombre,
        correo,
      });

      setUsuarioEditando(null);
      await cargarUsuarios();

      toast.success("Usuario actualizado correctamente.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleAsignarRol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuarioRol) return;

    const formData = new FormData(event.currentTarget);
    const rolId = String(formData.get("rolId") ?? "").trim();

    if (!rolId) {
      toast.error("Selecciona un rol.");
      return;
    }

    try {
      await asignarRolUsuario(usuarioRol.id, {
        rolId,
        subRolId: null,
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

  const formularioRegistroValido =
    registroForm.nombre.trim().length >= 3 &&
    NOMBRE_REGEX.test(registroForm.nombre.trim()) &&
    CORREO_REGEX.test(registroForm.correo.trim()) &&
    passwordValido &&
    registroForm.confirmarPassword === registroForm.password;

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
              onClick={abrirModalRegistro}
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
                onClick={cerrarModalRegistro}
                disabled={registrando}
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
                  value={registroForm.nombre}
                  onChange={handleRegistroChange}
                  onBlur={handleRegistroBlur}
                  placeholder="Ej. María López"
                  maxLength={100}
                  autoComplete="name"
                  aria-invalid={Boolean(registroErrors.nombre)}
                  className={
                    registroErrors.nombre ? styles.inputError : undefined
                  }
                />

                <small className={styles.fieldHint}>
                  Solo letras. Cada palabra iniciará con mayúscula.
                </small>

                {registroErrors.nombre && (
                  <span className={styles.fieldError}>
                    {registroErrors.nombre}
                  </span>
                )}
              </label>

              <label>
                Correo electrónico

                <input
                  name="correo"
                  type="email"
                  value={registroForm.correo}
                  onChange={handleRegistroChange}
                  onBlur={handleRegistroBlur}
                  placeholder="usuario@correo.com"
                  maxLength={150}
                  autoComplete="email"
                  aria-invalid={Boolean(registroErrors.correo)}
                  className={
                    registroErrors.correo ? styles.inputError : undefined
                  }
                />

                {registroErrors.correo && (
                  <span className={styles.fieldError}>
                    {registroErrors.correo}
                  </span>
                )}
              </label>

              <label>
                Contraseña

                <div className={styles.passwordInput}>
                  <input
                    name="password"
                    type={mostrarPassword ? "text" : "password"}
                    value={registroForm.password}
                    onChange={handleRegistroChange}
                    onBlur={handleRegistroBlur}
                    placeholder="Crea una contraseña segura"
                    autoComplete="new-password"
                    aria-invalid={Boolean(registroErrors.password)}
                    className={
                      registroErrors.password ? styles.inputError : undefined
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    title={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {registroErrors.password && (
                  <span className={styles.fieldError}>
                    {registroErrors.password}
                  </span>
                )}

                <div className={styles.passwordRequirements}>
                  <p>La contraseña debe contener:</p>

                  <ul>
                    <li
                      className={
                        passwordRules.longitud ? styles.ruleValid : undefined
                      }
                    >
                      <FiCheck />
                      Al menos 8 caracteres
                    </li>

                    <li
                      className={
                        passwordRules.mayuscula ? styles.ruleValid : undefined
                      }
                    >
                      <FiCheck />
                      Una letra mayúscula
                    </li>

                    <li
                      className={
                        passwordRules.minuscula ? styles.ruleValid : undefined
                      }
                    >
                      <FiCheck />
                      Una letra minúscula
                    </li>

                    <li
                      className={
                        passwordRules.numero ? styles.ruleValid : undefined
                      }
                    >
                      <FiCheck />
                      Un número
                    </li>

                    <li
                      className={
                        passwordRules.especial ? styles.ruleValid : undefined
                      }
                    >
                      <FiCheck />
                      Un carácter especial
                    </li>

                    <li
                      className={
                        passwordRules.sinEspacios
                          ? styles.ruleValid
                          : undefined
                      }
                    >
                      <FiCheck />
                      Sin espacios
                    </li>
                  </ul>
                </div>
              </label>

              <label>
                Confirmar contraseña

                <div className={styles.passwordInput}>
                  <input
                    name="confirmarPassword"
                    type={mostrarConfirmacion ? "text" : "password"}
                    value={registroForm.confirmarPassword}
                    onChange={handleRegistroChange}
                    onBlur={handleRegistroBlur}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    aria-invalid={Boolean(
                      registroErrors.confirmarPassword
                    )}
                    className={
                      registroErrors.confirmarPassword
                        ? styles.inputError
                        : undefined
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarConfirmacion((prev) => !prev)}
                    title={
                      mostrarConfirmacion
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-label={
                      mostrarConfirmacion
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarConfirmacion ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {registroErrors.confirmarPassword && (
                  <span className={styles.fieldError}>
                    {registroErrors.confirmarPassword}
                  </span>
                )}

                {registroForm.confirmarPassword &&
                  registroForm.confirmarPassword ===
                    registroForm.password && (
                    <span className={styles.fieldSuccess}>
                      <FiCheck />
                      Las contraseñas coinciden.
                    </span>
                  )}
              </label>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={cerrarModalRegistro}
                disabled={registrando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!formularioRegistroValido || registrando}
              >
                {registrando ? "Registrando..." : "Registrar usuario"}
              </button>
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
                  defaultValue={formatearNombre(usuarioEditando.nombre)}
                  onInput={(event) => {
                    event.currentTarget.value = formatearNombre(
                      event.currentTarget.value
                    );
                  }}
                  required
                  minLength={3}
                  maxLength={100}
                />

                <small className={styles.fieldHint}>
                  Solo letras. Cada palabra iniciará con mayúscula.
                </small>
              </label>

              <label>
                Correo

                <input
                  name="correo"
                  type="email"
                  defaultValue={usuarioEditando.correo}
                  onInput={(event) => {
                    event.currentTarget.value =
                      event.currentTarget.value
                        .replace(/\s/g, "")
                        .toLowerCase();
                  }}
                  required
                  maxLength={150}
                />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
              >
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
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setUsuarioRol(null)}
              >
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