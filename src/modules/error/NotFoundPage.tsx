import {
  ArrowLeft,
  Home,
  SearchX,
} from "lucide-react";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";

import "./NotFoundPage.css";

function NotFoundPage() {
  const navigate = useNavigate();
  const error = useRouteError();

  const esErrorDeRuta = isRouteErrorResponse(error);

  const codigo =
    esErrorDeRuta && error.status
      ? error.status
      : 404;

  const esPaginaNoEncontrada = codigo === 404;

  const regresar = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/dashboard", {
      replace: true,
    });
  };

  return (
    <main className="error-page">
      <section className="error-page__card">
        <div className="error-page__decoration error-page__decoration--top" />
        <div className="error-page__decoration error-page__decoration--bottom" />

        <div className="error-page__content">
          <div className="error-page__icon-container">
            <SearchX
              className="error-page__icon"
              aria-hidden="true"
            />
          </div>

          <span className="error-page__badge">
            Error {codigo}
          </span>

          <h1 className="error-page__code">
            {codigo}
          </h1>

          <h2 className="error-page__title">
            {esPaginaNoEncontrada
              ? "Página no encontrada"
              : "Algo salió mal"}
          </h2>

          <p className="error-page__description">
            {esPaginaNoEncontrada
              ? "La dirección que intentas visitar no existe, fue modificada o ya no se encuentra disponible."
              : "Ocurrió un problema inesperado al cargar esta sección. Intenta regresar o volver al inicio."}
          </p>

          <div className="error-page__actions">
            <button
              type="button"
              className="error-page__button error-page__button--primary"
              onClick={() =>
                navigate("/dashboard", {
                  replace: true,
                })
              }
            >
              <Home size={19} />
              Ir al inicio
            </button>

            <button
              type="button"
              className="error-page__button error-page__button--secondary"
              onClick={regresar}
            >
              <ArrowLeft size={19} />
              Regresar
            </button>
          </div>

          <div className="error-page__divider">
            <span />
            <p>Sistema de gestión de apoyos municipales</p>
            <span />
          </div>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;