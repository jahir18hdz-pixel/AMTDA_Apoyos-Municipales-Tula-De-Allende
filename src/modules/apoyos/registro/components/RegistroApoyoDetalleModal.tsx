import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiFile,
  FiFileText,
  FiMapPin,
  FiUser,
  FiX,
} from "react-icons/fi";

import { Button } from "../../../../components/ui/button";

import type {
  RegistroApoyoDetalle,
  RegistroApoyoListado,
} from "../../../../types/registroApoyo.types";

import styles from "./RegistroApoyoDetalleModal.module.css";

type RegistroApoyoDetalleModalProps = {
  open: boolean;
  detalle: RegistroApoyoDetalle | null;
  registroListado?: RegistroApoyoListado | null;
  onClose: () => void;
  onEdit?: () => void;
};

function mostrarFecha(value?: string | null) {
  if (!value) return "No registrada";

  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return "No registrada";
  }

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function mostrarMonto(value?: number | null) {
  if (value === undefined || value === null) {
    return "No registrado";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

function obtenerNombreApoyo(
  detalle: RegistroApoyoDetalle,
  registroListado?: RegistroApoyoListado | null,
) {
  return (
    detalle.apoyo ||
    detalle.fondo ||
    detalle.tipoApoyo ||
    registroListado?.fondo ||
    registroListado?.tipoApoyo ||
    "No registrado"
  );
}

function obtenerEstado(
  detalle: RegistroApoyoDetalle,
  registroListado?: RegistroApoyoListado | null,
) {
  return (
    detalle.estado ||
    detalle.estatus ||
    detalle.estadoSolicitud ||
    registroListado?.estado ||
    "Sin estado"
  );
}

function obtenerTipoDocumento(tipo?: string | null) {
  if (!tipo) return "Documento";

  switch (tipo.toLowerCase()) {
    case "factura":
      return "Factura";

    case "imagen":
      return "Imagen";

    case "otro":
      return "Otro documento";

    default:
      return tipo;
  }
}

export default function RegistroApoyoDetalleModal({
  open,
  detalle,
  registroListado,
  onClose,
  onEdit,
}: RegistroApoyoDetalleModalProps) {
  if (!open || !detalle) return null;

  const folio =
    detalle.folio ||
    registroListado?.folio ||
    "Sin folio";

  const comunidad =
    detalle.comunidad ||
    registroListado?.comunidad ||
    "No registrada";

  const delegado =
    detalle.delegado ||
    registroListado?.delegado ||
    "No registrado";

  const fechaApoyo =
    detalle.fechaApoyo ||
    detalle.fechaRegistro ||
    registroListado?.fechaRegistro;

  const estadoActual = obtenerEstado(
    detalle,
    registroListado,
  );

  const nombreApoyo = obtenerNombreApoyo(
    detalle,
    registroListado,
  );

  const observaciones =
    detalle.observaciones?.trim() ||
    detalle.descripcion?.trim() ||
    "Este registro no tiene observaciones.";

  const documentos = detalle.documentos ?? [];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="registro-apoyo-detalle-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.eyebrow}>
              Detalle del apoyo
            </span>

            <h2 id="registro-apoyo-detalle-title">
              {folio}
            </h2>

            <p>
              Consulta la información general, documentos
              y observaciones del registro.
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar detalle"
          >
            <FiX />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.summary}>
            <article className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <FiCheckCircle />
              </div>

              <div>
                <span>Estado actual</span>

                <strong className={styles.statusBadge}>
                  {estadoActual}
                </strong>
              </div>
            </article>

            <article className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <FiDollarSign />
              </div>

              <div>
                <span>Monto otorgado</span>

                <strong className={styles.summaryAmount}>
                  {mostrarMonto(detalle.montoOtorgado)}
                </strong>
              </div>
            </article>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>
                <FiFileText />
              </span>

              <div>
                <h3>Información del apoyo</h3>

                <p>
                  Datos principales del registro
                  seleccionado.
                </p>
              </div>
            </div>

            <div className={styles.detailGrid}>
              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiFileText />
                </span>

                <div>
                  <span>Folio</span>
                  <strong>{folio}</strong>
                </div>
              </article>

              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiMapPin />
                </span>

                <div>
                  <span>Comunidad</span>
                  <strong>{comunidad}</strong>
                </div>
              </article>

              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiFile />
                </span>

                <div>
                  <span>Tipo de apoyo</span>
                  <strong>{nombreApoyo}</strong>
                </div>
              </article>

              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiUser />
                </span>

                <div>
                  <span>Delegado</span>
                  <strong>{delegado}</strong>
                </div>
              </article>

              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiCalendar />
                </span>

                <div>
                  <span>Fecha del apoyo</span>
                  <strong>
                    {mostrarFecha(fechaApoyo)}
                  </strong>
                </div>
              </article>

              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiCalendar />
                </span>

                <div>
                  <span>Fecha de registro</span>

                  <strong>
                    {mostrarFecha(
                      detalle.createdAt ||
                        detalle.fechaRegistro,
                    )}
                  </strong>
                </div>
              </article>

              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiDollarSign />
                </span>

                <div>
                  <span>Monto otorgado</span>

                  <strong>
                    {mostrarMonto(
                      detalle.montoOtorgado,
                    )}
                  </strong>
                </div>
              </article>

              <article className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  <FiCheckCircle />
                </span>

                <div>
                  <span>Registro activo</span>

                  <strong>
                    {detalle.activo === undefined
                      ? "No especificado"
                      : detalle.activo
                        ? "Sí"
                        : "No"}
                  </strong>
                </div>
              </article>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>
                <FiFileText />
              </span>

              <div>
                <h3>Observaciones</h3>

                <p>
                  Información adicional asociada al
                  apoyo.
                </p>
              </div>
            </div>

            <div className={styles.observations}>
              {observaciones}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>
                <FiFile />
              </span>

              <div>
                <h3>Documentos</h3>

                <p>
                  Archivos y comprobantes asociados al
                  registro.
                </p>
              </div>

              <span className={styles.documentsCount}>
                {documentos.length}
              </span>
            </div>

            {documentos.length === 0 ? (
              <div className={styles.emptyDocuments}>
                <span>
                  <FiFile />
                </span>

                <strong>
                  No hay documentos registrados
                </strong>

                <p>
                  Este apoyo todavía no tiene archivos
                  asociados.
                </p>
              </div>
            ) : (
              <div className={styles.documentsList}>
                {documentos.map(
                  (documento, index) => (
                    <article
                      key={documento.id || index}
                      className={styles.documentItem}
                    >
                      <span
                        className={styles.documentIcon}
                      >
                        <FiFileText />
                      </span>

                      <div
                        className={
                          styles.documentInformation
                        }
                      >
                        <strong>
                          {documento.nombreArchivo ||
                            `Documento ${index + 1}`}
                        </strong>

                        <div
                          className={
                            styles.documentMeta
                          }
                        >
                          <span>
                            {obtenerTipoDocumento(
                              documento.tipoDocumento,
                            )}
                          </span>

                          <span>
                            {mostrarMonto(
                              documento.monto,
                            )}
                          </span>
                        </div>

                        {documento.descripcion && (
                          <p>
                            {documento.descripcion}
                          </p>
                        )}
                      </div>

                      <div
                        className={
                          styles.documentActions
                        }
                      >
                        {documento.url ? (
                          <a
                            href={documento.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir documento"
                          >
                            <FiDownload />
                            <span>Ver archivo</span>
                          </a>
                        ) : (
                          <span
                            className={
                              styles.unavailableFile
                            }
                          >
                            Sin archivo
                          </span>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        <footer className={styles.footer}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cerrar
          </Button>

          {onEdit && (
            <Button
              type="button"
              className={styles.editButton}
              onClick={onEdit}
            >
              <FiEdit2 />
              Editar registro
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}