import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verificarCorreo } from "../../services/authService";
import styles from "./ActivarCuenta.module.css";
import logo from "@/assets/images/LogoPresi.jpg";

type Status = "loading" | "success" | "error";

export default function ActivarCuentaPage() {
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const [status, setStatus] = useState<Status>(() =>
    token ? "loading" : "error"
  );

  useEffect(() => {
    if (!token) return;

    let cancelado = false;

    verificarCorreo(token)
      .then(() => {
        if (!cancelado) setStatus("success");
      })
      .catch(() => {
        if (!cancelado) setStatus("error");
      });

    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <img src={logo} alt="Presidencia Municipal" className={styles.logo} />

        {status === "loading" && (
          <>
            <h1>Verificando correo...</h1>
            <p>Estamos validando tu cuenta.</p>
            <div className={styles.loader} />
          </>
        )}

        {status === "success" && (
          <>
            <h1>Correo verificado</h1>
            <p>Tu cuenta fue verificada correctamente.</p>
            <p>Ya puedes iniciar sesión en el sistema.</p>

            <Link to="/login" className={styles.button}>
              Iniciar sesión
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1>No se pudo verificar</h1>
            <p>El enlace es inválido, expiró o ya fue utilizado.</p>

            <Link to="/login" className={styles.button}>
              Volver al login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}