import { useMemo, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiHome,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiSettings,
  FiMapPin,
  FiHeart,
  FiBarChart2,
  FiDollarSign,
} from "react-icons/fi";

import styles from "./Sidebar.module.css";
import LogoPresi from "@/assets/images/logoRGB.png";

type MenuItem = {
  id: string;
  label: string;
  to?: string;
  icon: React.ReactNode;
  children?: {
    id: string;
    label: string;
    to: string;
  }[];
};

type SidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  onBackgroundToggle?: () => void;
};

function getAuthUser() {
  const rawUser =
    localStorage.getItem("presi2_auth");

  if (!rawUser) {
    return {
      email: "",
      permissions: [],
    };
  }

  try {
    const user = JSON.parse(rawUser) as {
      correo?: string;
      email?: string;
      permisos?: (
        | { permiso: string }
        | string
      )[];
      permissions?: (
        | { permiso: string }
        | string
      )[];
    };

    const permisosRaw =
      user.permisos ??
      user.permissions ??
      [];

    return {
      email:
        user.correo ??
        user.email ??
        "",
      permissions: permisosRaw.map(
        (permiso) =>
          typeof permiso === "string"
            ? permiso
            : permiso.permiso,
      ),
    };
  } catch {
    return {
      email: "",
      permissions: [],
    };
  }
}

function isInteractiveTarget(
  target: EventTarget | null,
) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "button, a, input, textarea, select, label",
    ),
  );
}

export default function Sidebar({
  collapsed = false,
  onNavigate,
  onBackgroundToggle,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const { email, permissions } =
    getAuthUser();

  const allowedModules = useMemo(
    () => new Set(permissions),
    [permissions],
  );

  const [adminOpen, setAdminOpen] =
    useState(
      location.pathname.startsWith(
        "/administracion",
      ),
    );

  const menu: MenuItem[] = useMemo(
    () => [
      {
        id: "dashboard.view",
        label: "Inicio",
        to: "/dashboard",
        icon: <FiHome />,
      },
      {
        id: "apoyos.create",
        label: "Apoyos",
        to: "/apoyos/registro",
        icon: <FiHeart />,
      },
      {
        id: "reportes.view",
        label: "Reportes",
        to: "/reportes",
        icon: <FiBarChart2 />,
      },
      {
        id: "comunidades.view",
        label: "Comunidades",
        to: "/comunidades",
        icon: <FiMapPin />,
      },
      {
        id: "fondos.view",
        label: "Fondos",
        to: "/fondos",
        icon: <FiDollarSign />,
      },
      {
        id: "administracion.group",
        label: "Administración",
        icon: <FiSettings />,
        children: [
          {
            id: "usuarios.view",
            label: "Usuarios",
            to: "/administracion/usuarios",
          },
          {
            id: "roles.view",
            label: "Roles",
            to: "/administracion/roles",
          },
          {
            id: "permisos.view",
            label: "Permisos",
            to: "/administracion/permisos",
          },
        ],
      },
    ],
    [],
  );

  const filteredMenu = useMemo(() => {
    const canSee = (id: string) =>
      allowedModules.has(id);

    return menu
      .map((item) => {
        if (!item.children) {
          return canSee(item.id)
            ? item
            : null;
        }

        const children =
          item.children.filter((child) =>
            canSee(child.id),
          );

        if (children.length === 0) {
          return null;
        }

        return {
          ...item,
          children,
        };
      })
      .filter(
        (item): item is MenuItem =>
          Boolean(item),
      );
  }, [menu, allowedModules]);

  function handleLogout() {
    localStorage.removeItem(
      "presi2_auth",
    );
    localStorage.removeItem(
      "presi2_token",
    );

    onNavigate?.();

    navigate("/login", {
      replace: true,
    });
  }

  function handleGroupClick() {
    if (
      collapsed &&
      onBackgroundToggle
    ) {
      onBackgroundToggle();
    }

    setAdminOpen((prev) => !prev);
  }

  function shouldShowSubmenu() {
    if (collapsed) {
      return false;
    }

    return adminOpen;
  }

  return (
    <aside
      className={`${styles.sidebar} ${
        collapsed
          ? styles.collapsed
          : ""
      }`}
      onPointerDownCapture={(event) => {
        if (!onBackgroundToggle) {
          return;
        }

        const target =
          event.target as HTMLElement | null;

        if (
          !target ||
          isInteractiveTarget(target)
        ) {
          return;
        }

        onBackgroundToggle();
      }}
    >
      <div className={styles.top}>
        {!collapsed && (
          <h1 className={styles.title}>
            Sistema de
            <br />
            gestión de apoyos
            <br />
            municipales
          </h1>
        )}

        <div className={styles.logoWrap}>
          <img
            src={LogoPresi}
            alt="Presidencia Municipal"
            className={styles.logo}
          />
        </div>

        <div
          className={styles.goldLine}
        />

        <div className={styles.userRow}>
          <span
            className={styles.userIcon}
          >
            <FiUser />
          </span>

          {!collapsed && (
            <span
              className={styles.userName}
            >
              {email}
            </span>
          )}
        </div>

        <div
          className={styles.goldLine}
        />
      </div>

      <div
        className={styles.scrollArea}
      >
        <nav className={styles.nav}>
          {filteredMenu.map((item) =>
            item.children ? (
              <div
                key={item.id}
                className={styles.group}
              >
                <button
                  type="button"
                  className={
                    styles.itemBtn
                  }
                  data-permission-id={
                    item.id
                  }
                  onClick={
                    handleGroupClick
                  }
                >
                  <span
                    className={
                      styles.left
                    }
                  >
                    <span
                      className={
                        styles.icon
                      }
                    >
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <span
                        className={
                          styles.label
                        }
                      >
                        {item.label}
                      </span>
                    )}
                  </span>

                  {!collapsed && (
                    <span
                      className={`${
                        styles.chev
                      } ${
                        adminOpen
                          ? styles.chevOpen
                          : ""
                      }`}
                    >
                      <FiChevronDown />
                    </span>
                  )}
                </button>

                {shouldShowSubmenu() && (
                  <div
                    className={`${
                      styles.submenu
                    } ${
                      adminOpen
                        ? styles.submenuOpen
                        : ""
                    }`}
                  >
                    {item.children.map(
                      (child) => (
                        <NavLink
                          key={child.id}
                          to={child.to}
                          data-permission-id={
                            child.id
                          }
                          onClick={() =>
                            onNavigate?.()
                          }
                          className={({
                            isActive,
                          }) =>
                            isActive
                              ? `${styles.subItem} ${styles.active}`
                              : styles.subItem
                          }
                        >
                          {child.label}
                        </NavLink>
                      ),
                    )}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.id}
                to={item.to!}
                data-permission-id={
                  item.id
                }
                onClick={() =>
                  onNavigate?.()
                }
                className={({
                  isActive,
                }) =>
                  isActive
                    ? `${styles.item} ${styles.active}`
                    : styles.item
                }
              >
                <span
                  className={
                    styles.icon
                  }
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span
                    className={
                      styles.label
                    }
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>
            ),
          )}
        </nav>
      </div>

      <div className={styles.bottom}>
        <button
          type="button"
          className={
            styles.bottomBtn
          }
          onClick={handleLogout}
        >
          <span
            className={styles.icon}
          >
            <FiLogOut />
          </span>

          {!collapsed && (
            <span
              className={styles.label}
            >
              Cerrar sesión
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}