import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import styles from "../styles/Login.module.css";
import LogoPresi from "@/assets/images/logoRGB.png";
import Icono from "@/assets/images/iconoatlantevino.png";

import {
  login,
  recuperarPassword,
  resetPassword,
} from "../../../services/authService";

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const response = await login({
        correo: email,
        password,
      });

      localStorage.setItem("presi2_token", response.token);

      if (response.usuario) {
        localStorage.setItem("presi2_auth", JSON.stringify(response.usuario));
      }

      navigate("/dashboard", { replace: true });
    } catch {
      alert("Correo o contraseña incorrectos.");
    } finally {
      setIsLoading(false);
    }
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

  const handleSendReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      await recuperarPassword({
        correo: email,
      });

      setForgotStep("validate");
    } catch {
      alert("No se pudo enviar el código de recuperación.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotStep("change");
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
      setIsLoading(true);

      await resetPassword({
        token: code,
        nuevoPassword: newPassword,
      });

      alert("Contraseña actualizada correctamente.");
      handleBackToLogin();
    } catch {
      alert("No se pudo cambiar la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${styles.loginContainer} ${isForgot ? styles.isForgot : ""}`}
    >
      <div className={styles.leftPanel}>
        <div className={styles.logoCard}>
          <img
            src={LogoPresi}
            alt="Tula de Allende"
            className={styles.logoImage}
          />
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
                ? "Escribe tu correo para recibir un código de recuperación."
                : forgotStep === "validate"
                ? "Escribe el código que recibiste en tu correo."
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
                  disabled={isLoading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className={styles.forgotPassContainer}>
                <button
                  type="button"
                  className={styles.forgotPass}
                  onClick={handleForgot}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <span className={styles.icon}>@</span>
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar código"}
              </button>

              <button
                type="button"
                className={styles.backLink}
                onClick={handleBackToLogin}
                disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                Continuar
              </button>

              <div className={styles.actionsContainer}>
                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => setForgotStep("request")}
                  disabled={isLoading}
                >
                  Reenviar código
                </button>

                <button
                  type="button"
                  className={styles.backLink}
                  onClick={handleBackToLogin}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? "Actualizando..." : "Cambiar contraseña"}
              </button>

              <button
                type="button"
                className={styles.backLink}
                onClick={handleBackToLogin}
                disabled={isLoading}
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