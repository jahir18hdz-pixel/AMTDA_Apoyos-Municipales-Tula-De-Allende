export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  correoVerificado?: boolean;
  rol?: string | null;
  subRol?: string | null;
  ultimoAcceso?: string | null;

  rolId?: string | null;
  rolNombre?: string | null;
  nombreRol?: string | null;
  subRolId?: string | null;
  subRolNombre?: string | null;
  nombreSubRol?: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type ActualizarUsuarioDto = {
  nombre?: string;
  correo?: string;
};

export type AsignarRolUsuarioDto = {
  rolId: string;
  subRolId?: string | null;
};

export type RegistrarUsuarioDto = {
  nombre: string;
  correo: string;
  password: string;
};