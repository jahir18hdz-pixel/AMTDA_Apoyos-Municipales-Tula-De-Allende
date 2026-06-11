import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import styles from "../styles/Login.module.css";
import LogoPresi from "@/assets/images/logoRGB.png";
import Icono from "@/assets/images/iconoatlantevino.png";

type Mode = "login" | "forgot";
type ForgotStep = "request" | "validate" | "change";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const isForgot = mode === "forgot";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    window.setTimeout(() => {
      const mockUser = {
        id: "user.admin",
        name: "Administrador",
        email,
        roleId: "role.admin",
        roleName: "Administrador",
        permissions: [
          "dashboard.view",
          "apoyos.create",
          "apoyos.history",
          "comunidades.view",
          "fondos.view",
        ],
      };

      localStorage.setItem("presi2_auth", JSON.stringify(mockUser));
      setIsLoading(false);
      navigate("/dashboard", { replace: true });
    }, 600);
  };

  const handleForgot = () => {
    setMode("forgot");
    setForgotStep("request");
    setPassword("");
    setCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleBackToLogin = () => {
    setMode("login");
    setForgotStep("request");
    setCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSendReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotStep("validate");
  };

  const handleValidateCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotStep("change");
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleBackToLogin();
  };

  return (
    <div
      className={`${styles.loginContainer} ${isForgot ? styles.isForgot : ""}`}
    >
      <div className={styles.leftPanel}>
        <div className={styles.logoCard}>
          <img src={LogoPresi} alt="Tula de Allende" />
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <img src={Icono} alt="Icono" className={styles.formIcon} />

          <h2 className={styles.formTitle}>
            {isForgot ? "Recuperar Contraseña" : "Iniciar Sesión"}
          </h2>

          <div className={styles.underline} />

          <p className={styles.description}>
            {isForgot
              ? forgotStep === "request"
                ? "Escribe tu correo para simular el envío de un código de recuperación."
                : forgotStep === "validate"
                ? "Escribe el código de recuperación."
                : "Ingresa tu nueva contraseña."
              : "Plataforma administrativa para el registro y seguimiento de apoyos municipales."}
          </p>

          {!isForgot ? (
            <form onSubmit={handleSubmit}>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <span className={styles.icon}>@</span>
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className={styles.forgotPassContainer}>
                <button
                  type="button"
                  className={styles.forgotPass}
                  onClick={handleForgot}
                >
                  Olvidé contraseña
                </button>
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>
          ) : forgotStep === "request" ? (
            <form onSubmit={handleSendReset}>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className={styles.icon}>@</span>
              </div>

              <button type="submit" className={styles.loginButton}>
                Enviar código
              </button>

              <button
                type="button"
                className={styles.backLink}
                onClick={handleBackToLogin}
              >
                Volver a iniciar sesión
              </button>
            </form>
          ) : forgotStep === "validate" ? (
            <form onSubmit={handleValidateCode}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Código de recuperación"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.loginButton}>
                Validar código
              </button>

              <div className={styles.actionsContainer}>
                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => setForgotStep("request")}
                >
                  Reenviar código
                </button>

                <button
                  type="button"
                  className={styles.backLink}
                  onClick={handleBackToLogin}
                >
                  Volver
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword}>
              <div className={styles.inputWrapper}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Confirmar nueva contraseña"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.loginButton}>
                Cambiar contraseña
              </button>

              <button
                type="button"
                className={styles.backLink}
                onClick={handleBackToLogin}
              >
                Volver a iniciar sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}