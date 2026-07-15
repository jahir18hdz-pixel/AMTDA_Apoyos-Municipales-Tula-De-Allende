export type ResumenDashboard = {
  totalApoyos: number;
  apoyosEsteMes: number;
  comunidadesAtendidas: number;
  comunidadesNuevasEsteMes: number;
  fondosActivos: number;
  pendientesValidar: number;
};

export type MontoPorComunidad = {
  comunidadId: string;
  comunidad: string;
  delegado?: string | null;
  montoTotal: number;
  totalApoyos: number;
};

export type ApoyoPorMes = {
  mes: number;
  fondo: string;
  cantidad: number;
};

export type DistribucionPorFondo = {
  fondo: string;
  cantidad: number;
};

export type ApoyoReciente = {
  id: string;
  comunidad?: string | null;
  tipoApoyo?: string | null;
  estado?: string | null;
  fecha: string;
};

export type TopComunidadItem = {
  comunidadId?: string;
  comunidad: string;
  totalApoyos: number;
};

export type TopComunidades = {
  topComunidades: TopComunidadItem[];
  pendientes: number;
  validados: number;
  aprobados: number;
};