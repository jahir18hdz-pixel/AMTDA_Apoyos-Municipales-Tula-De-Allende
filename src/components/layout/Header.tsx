import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiCalendar, FiClock } from "react-icons/fi";

import styles from "./Header.module.css";

type HeaderProps = {
  onMenuClick?: () => void;
};

function titleFromPath(pathname: string) {
  const map: Record<string, string> = {
    "/dashboard": "Inicio",
    "/apoyos/registro": "Registro de apoyo",
    "/apoyos/historial": "Historial de apoyos",
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
        second: "2-digit",
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
    <header className={styles.topBar} onDoubleClick={onMenuClick}>
      <div className={styles.left}>
        <p className={styles.topEyebrow}>Apoyos Municipales</p>
        <h1 className={styles.topTitle}>{title}</h1>
      </div>

      <div className={styles.datetime}>
        <div className={styles.dtChip}>
          <FiClock aria-hidden="true" />
          <span>{timeStr}</span>
        </div>
        <div className={styles.dtDivider} aria-hidden="true" />
        <div className={styles.dtChip}>
          <FiCalendar aria-hidden="true" />
          <span>{dateStr}</span>
        </div>
      </div>
    </header>
  );
}