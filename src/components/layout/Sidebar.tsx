import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiSettings,
  FiMapPin,
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

function getMockUser() {
  const rawUser = localStorage.getItem("presi2_auth");

  if (!rawUser) {
    return {
      email: "admin@presidencia.gob.mx",
      permissions: [
        "dashboard.view",
        "apoyos.create",
        "apoyos.history",
        "comunidades.view",
        "fondos.view",
        "usuarios.view",
        "roles.view",
        "permisos.view",
      ],
    };
  }

  return JSON.parse(rawUser) as {
    email: string;
    permissions: string[];
  };
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest("button, a, input, textarea, select, label");
}

export default function Sidebar({
  collapsed = false,
  onNavigate,
  onBackgroundToggle,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const { email, permissions } = getMockUser();

  const allowedModules = useMemo(
  () =>
    new Set([
      ...permissions,
      "dashboard.view",
      "apoyos.create",
      "apoyos.history",
      "comunidades.view",
      "fondos.view",
      "usuarios.view",
      "roles.view",
      "permisos.view",
    ]),
  [permissions]
);

  const [apoyosOpen, setApoyosOpen] = useState(
    location.pathname.startsWith("/apoyos/")
  );

  const [catalogosOpen, setCatalogosOpen] = useState(
    location.pathname.startsWith("/comunidades") ||
      location.pathname.startsWith("/fondos")
  );

  const [adminOpen, setAdminOpen] = useState(
    location.pathname.startsWith("/administracion")
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
        id: "apoyos.group",
        label: "Apoyos",
        icon: <FiFolder />,
        children: [
          {
            id: "apoyos.create",
            label: "Registro de apoyo",
            to: "/apoyos/registro",
          },
          {
            id: "apoyos.history",
            label: "Historial de apoyos",
            to: "/apoyos/historial",
          },
        ],
      },
      {
        id: "catalogos.group",
        label: "Catálogos",
        icon: <FiMapPin />,
        children: [
          {
            id: "comunidades.view",
            label: "Comunidades",
            to: "/comunidades",
          },
          {
            id: "fondos.view",
            label: "Fondos",
            to: "/fondos",
          },
        ],
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
    []
  );

  const filteredMenu = useMemo(() => {
    const canSee = (id: string) =>
      allowedModules.has(id) || id.endsWith(".group");

    return menu
      .map((item) => {
        if (!item.children) {
          return canSee(item.id) ? item : null;
        }

        const children = item.children.filter((child) => canSee(child.id));

        if (children.length === 0) return null;

        return {
          ...item,
          children,
        };
      })
      .filter((item): item is MenuItem => Boolean(item));
  }, [menu, allowedModules]);

  const handleLogout = () => {
    localStorage.removeItem("presi2_auth");
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  const handleGroupClick = (label: string) => {
    if (collapsed && onBackgroundToggle) {
      onBackgroundToggle();
    }

    if (label === "Apoyos") {
      setApoyosOpen((prev) => !prev);
    }

    if (label === "Catálogos") {
      setCatalogosOpen((prev) => !prev);
    }

    if (label === "Administración") {
      setAdminOpen((prev) => !prev);
    }
  };

  const shouldShowSubmenu = (label: string) => {
    if (collapsed) return false;
    if (label === "Apoyos") return apoyosOpen;
    if (label === "Catálogos") return catalogosOpen;
    if (label === "Administración") return adminOpen;
    return false;
  };

  const isGroupOpen = (label: string) => {
    if (label === "Apoyos") return apoyosOpen;
    if (label === "Catálogos") return catalogosOpen;
    if (label === "Administración") return adminOpen;
    return false;
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      onPointerDownCapture={(e) => {
        if (!onBackgroundToggle) return;

        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (isInteractiveTarget(target)) return;

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

        <div className={styles.goldLine} />

        <div className={styles.userRow}>
          <span className={styles.userIcon}>
            <FiUser />
          </span>

          {!collapsed && <span className={styles.userName}>{email}</span>}
        </div>

        <div className={styles.goldLine} />
      </div>

      <div className={styles.scrollArea}>
        <nav className={styles.nav}>
          {filteredMenu.map((item) =>
            item.children ? (
              <div key={item.id} className={styles.group}>
                <button
                  type="button"
                  className={styles.itemBtn}
                  data-permission-id={item.id}
                  onClick={() => handleGroupClick(item.label)}
                >
                  <span className={styles.left}>
                    <span className={styles.icon}>{item.icon}</span>

                    {!collapsed && (
                      <span className={styles.label}>{item.label}</span>
                    )}
                  </span>

                  {!collapsed && (
                    <span
                      className={`${styles.chev} ${
                        isGroupOpen(item.label) ? styles.chevOpen : ""
                      }`}
                    >
                      <FiChevronDown />
                    </span>
                  )}
                </button>

                {shouldShowSubmenu(item.label) && (
                  <div
                    className={`${styles.submenu} ${
                      isGroupOpen(item.label) ? styles.submenuOpen : ""
                    }`}
                  >
                    {item.children.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.to}
                        data-permission-id={child.id}
                        onClick={() => onNavigate?.()}
                        className={({ isActive }) =>
                          isActive
                            ? `${styles.subItem} ${styles.active}`
                            : styles.subItem
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.id}
                to={item.to!}
                data-permission-id={item.id}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  isActive ? `${styles.item} ${styles.active}` : styles.item
                }
              >
                <span className={styles.icon}>{item.icon}</span>

                {!collapsed && <span className={styles.label}>{item.label}</span>}
              </NavLink>
            )
          )}
        </nav>
      </div>

      <div className={styles.bottom}>
        <button type="button" className={styles.bottomBtn} onClick={handleLogout}>
          <span className={styles.icon}>
            <FiLogOut />
          </span>

          {!collapsed && <span className={styles.label}>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}