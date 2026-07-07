export type Rol = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
};

export type CrearRolRequest = {
  nombre: string;
  descripcion?: string;
};

export type ActualizarRolRequest = {
  nombre: string;
  descripcion?: string;
};

export type CambiarEstatusRolRequest = {
  activo: boolean;
};

export type RolPermiso = {
  permisoId: string;
  id?: string;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion?: string | null;
  asignado: boolean;
};

export type UpsertPermisoRolRequest = {
  permisoId: string;
  asignado: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalItems?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
};