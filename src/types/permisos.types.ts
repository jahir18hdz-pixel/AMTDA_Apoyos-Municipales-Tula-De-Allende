export type Permiso = {
  id: string;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion?: string | null;
  activo: boolean;
};

export type CrearPermisoRequest = {
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion?: string;
};

export type ActualizarPermisoRequest = CrearPermisoRequest;

export type CambiarEstatusPermisoRequest = {
  activo: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalItems?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
};