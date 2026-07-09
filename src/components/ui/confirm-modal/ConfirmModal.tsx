import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import styles from "./ConfirmModal.module.css";

type ConfirmVariant = "danger" | "warning" | "success" | "default";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const icons = {
  danger: FiAlertTriangle,
  warning: FiAlertTriangle,
  success: FiCheckCircle,
  default: FiInfo,
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  const Icon = icons[variant];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <section
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`${styles.iconBox} ${styles[variant]}`}>
          <Icon />
        </div>

        <div className={styles.content}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            disabled={loading}
            title="Cerrar"
          >
            <FiX />
          </button>

          <h2>{title}</h2>
          <p>{message}</p>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>

          <button
            type="button"
            className={`${styles.confirmButton} ${styles[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}