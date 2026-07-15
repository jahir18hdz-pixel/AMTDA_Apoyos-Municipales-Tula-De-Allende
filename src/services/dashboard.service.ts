import { api } from "./api";

import type {
  ApoyoPorMes,
  ApoyoReciente,
  DistribucionPorFondo,
  MontoPorComunidad,
  ResumenDashboard,
  TopComunidades,
} from "@/types/dashboard.types";

const endpoint = "/estadisticas";

export async function obtenerResumenDashboard() {
  const response = await api.get<ResumenDashboard>(`${endpoint}/resumen`);
  return response.data;
}

export async function obtenerMontoPorComunidad() {
  const response = await api.get<MontoPorComunidad[]>(
    `${endpoint}/monto-por-comunidad`
  );

  return response.data;
}

export async function obtenerApoyosPorMes(anio: number) {
  const response = await api.get<ApoyoPorMes[]>(
    `${endpoint}/apoyos-por-mes`,
    {
      params: { anio },
    }
  );

  return response.data;
}

export async function obtenerDistribucionPorFondo() {
  const response = await api.get<DistribucionPorFondo[]>(
    `${endpoint}/distribucion-por-fondo`
  );

  return response.data;
}

export async function obtenerApoyosRecientes(top = 5) {
  const response = await api.get<ApoyoReciente[]>(`${endpoint}/recientes`, {
    params: { top },
  });

  return response.data;
}

export async function obtenerTopComunidades(anio: number, top = 5) {
  const response = await api.get<TopComunidades>(
    `${endpoint}/top-comunidades`,
    {
      params: {
        anio,
        top,
      },
    }
  );

  return response.data;
}