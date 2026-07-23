export type RegistroApoyoListado = {
  id: string;
  folio: string;
  comunidad?: string | null;
  fondo?: string | null;
  tipoApoyo?: string | null;
  fechaRegistro: string;
  estado?: string | null;
  delegado?: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type DocumentoApoyoForm = {
  id?: string;
  nombreArchivo?: string;
  esExistente?: boolean;
  archivo: File | null;
  monto: string;
  descripcion: string;
  tipoDocumento: "imagen" | "factura" | "otro";
  facturado: boolean;
  metodoPago: string;
  fechaFacturado: string;
};
export type CrearRegistroApoyoForm = {
  folio: string;
  apoyoId: string;
  comunidadId: string;
  estadoSolicitudId: string;
  fechaApoyo: string;
  montoOtorgado: string;
  observaciones: string;
  documentos: DocumentoApoyoForm[];
};

export type CatalogoOption = {
  id: string;
  nombre: string;
};

export type RegistroApoyoDocumento = {
  id: string;
  nombreArchivo: string;
  url: string;
  tipoDocumento: string;
  monto: number;
  descripcion?: string | null;
  facturado: boolean;
  metodoPago?: string | null;
  fechaFacturado?: string | null;
};

export type RegistroApoyoPorId = {
  id: string;
  folio?: string;
  apoyoId: string;
  apoyo?: string | null;
  comunidadId: string;
  comunidad?: string | null;
  estadoSolicitudId: string;
  estadoSolicitud?: string | null;
  fechaApoyo: string;
  montoOtorgado: number;
  observaciones?: string | null;
  activo: boolean;
  createdAt: string;
  documentos: RegistroApoyoDocumento[];
};

export type RegistroApoyoDetalle = {
  id: string;
  folio?: string | null;

  apoyoId?: string | null;
  apoyo?: string | null;
  fondo?: string | null;
  tipoApoyo?: string | null;

  comunidadId?: string | null;
  comunidad?: string | null;

  estadoSolicitudId?: string | null;
  estadoSolicitud?: string | null;
  estado?: string | null;
  estatus?: string | null;

  fechaApoyo?: string | null;
  fechaRegistro?: string | null;
  fechaActualizacion?: string | null;

  montoOtorgado?: number | null;
  observaciones?: string | null;
  descripcion?: string | null;
  delegado?: string | null;

  activo?: boolean;
  createdAt?: string | null;

  documentos: RegistroApoyoDocumento[];
};
