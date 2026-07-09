export type Fondo = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  montoMaximo?: number | null;
  requiereValidacion: boolean;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CrearFondoDto = {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  montoMaximo?: number | null;
  requiereValidacion: boolean;
};

export type ActualizarFondoDto = {
  nombre?: string;
  descripcion?: string | null;
  montoMaximo?: number | null;
  requiereValidacion?: boolean;
};

export type CambiarEstatusFondoDto = {
  activo: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords?: number;
  totalCount?: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};