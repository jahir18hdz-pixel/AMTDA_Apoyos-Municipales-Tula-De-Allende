export interface Comunidad {
  id: string;
  claveInterna: string;
  nombre: string;
  codigoPostal: string;
  delegado: string | null;
  telefonoDelegado: string | null;
  activo: boolean;
  delegadoIneUrl: string | null;
}

export interface CrearComunidadRequest {
  claveInterna: string;
  nombre: string;
  codigoPostal: string;
  delegado?: string;
  telefonoDelegado?: string;
  delegadoIne?: File | null;
}

export interface ActualizarComunidadRequest {
  claveInterna?: string;
  nombre?: string;
  codigoPostal?: string;
  delegado?: string;
  telefonoDelegado?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}