import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiCalendar, FiClock, FiMenu } from "react-icons/fi";

import styles from "./Header.module.css";

type HeaderProps = {
  onMenuClick?: () => void;
};

function titleFromPath(pathname: string) {
  const map: Record<string, string> = {
    "/dashboard": "Inicio",
    "/apoyos/registro": "Registro de apoyo",
    "/comunidades": "Comunidades",
    "/fondos": "Fondos",
    "/administracion/usuarios": "Usuarios",
    "/administracion/roles": "Roles",
    "/administracion/permisos": "Permisos",
  };

  return map[pathname] ?? "Inicio";
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const title = useMemo(() => titleFromPath(pathname), [pathname]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeStr = useMemo(
    () =>
      now.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [now]
  );

  const dateStr = useMemo(
    () =>
      now.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [now]
  );

  return (
    <header className={styles.topBar}>
      <button
        onClick={onMenuClick}
        className={styles.menuButton}
        aria-label="Abrir menú"
      >
        <FiMenu />
      </button>

      <div className={styles.left}>
        <h1 className={styles.topTitle}>{title}</h1>
      </div>

      <div className={styles.datetime}>
        <div className={styles.dtChip}>
          <FiClock />
          <span>{timeStr}</span>
        </div>

        <div className={styles.dtDivider} />

        <div className={styles.dtChip}>
          <FiCalendar />
          <span>{dateStr}</span>
        </div>
      </div>
    </header>
  );
}