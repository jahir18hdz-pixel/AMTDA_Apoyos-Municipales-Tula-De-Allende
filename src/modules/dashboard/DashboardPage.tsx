import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  HandHeart,
  LoaderCircle,
  MapPin,
  RefreshCw,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  obtenerApoyosPorMes,
  obtenerApoyosRecientes,
  obtenerDistribucionPorFondo,
  obtenerMontoPorComunidad,
  obtenerResumenDashboard,
  obtenerTopComunidades,
} from "@/services/dashboard.service";

import type {
  ApoyoPorMes,
  DistribucionPorFondo,
} from "@/types/dashboard.types";

import styles from "./DashboardPage.module.css";

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const COLORES_FONDOS = [
  "#4b0016",
  "#b68a2a",
  "#7c243e",
  "#d4ad58",
  "#8c6872",
  "#664c20",
  "#a44b65",
  "#d9c18c",
];

function formatoNumero(valor: number) {
  return new Intl.NumberFormat("es-MX").format(valor ?? 0);
}

function formatoMoneda(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(valor ?? 0);
}

function formatoFecha(fecha: string) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(fecha));
}

function normalizarEstado(estado?: string | null) {
  return estado?.trim().toLowerCase() ?? "";
}

function obtenerClaseEstado(estado?: string | null) {
  const estadoNormalizado = normalizarEstado(estado);

  if (
    estadoNormalizado.includes("aprob") ||
    estadoNormalizado.includes("entreg")
  ) {
    return styles.statusApproved;
  }

  if (
    estadoNormalizado.includes("valid") ||
    estadoNormalizado.includes("revis")
  ) {
    return styles.statusValidated;
  }

  if (
    estadoNormalizado.includes("rechaz") ||
    estadoNormalizado.includes("cancel")
  ) {
    return styles.statusRejected;
  }

  return styles.statusPending;
}

function crearGradienteDona(distribucion: DistribucionPorFondo[]) {
  const total = distribucion.reduce(
    (acumulado, item) => acumulado + item.cantidad,
    0
  );

  if (total <= 0) {
    return "conic-gradient(#e8e2e4 0deg 360deg)";
  }

  let porcentajeActual = 0;

  const segmentos = distribucion.map((item, index) => {
    const porcentaje = (item.cantidad / total) * 100;
    const inicio = porcentajeActual;
    const fin = porcentajeActual + porcentaje;

    porcentajeActual = fin;

    return `${COLORES_FONDOS[index % COLORES_FONDOS.length]} ${inicio}% ${fin}%`;
  });

  return `conic-gradient(${segmentos.join(", ")})`;
}

type DatosGraficaMes = {
  mes: number;
  total: number;
  fondos: Record<string, number>;
};

function agruparApoyosPorMes(datos: ApoyoPorMes[]) {
  const fondos = Array.from(new Set(datos.map((item) => item.fondo)));

  const meses: DatosGraficaMes[] = Array.from({ length: 12 }, (_, index) => {
    const mes = index + 1;
    const registrosMes = datos.filter((item) => item.mes === mes);

    const cantidadesPorFondo = fondos.reduce<Record<string, number>>(
      (resultado, fondo) => {
        resultado[fondo] = registrosMes
          .filter((item) => item.fondo === fondo)
          .reduce((total, item) => total + item.cantidad, 0);

        return resultado;
      },
      {}
    );

    return {
      mes,
      fondos: cantidadesPorFondo,
      total: Object.values(cantidadesPorFondo).reduce(
        (total, cantidad) => total + cantidad,
        0
      ),
    };
  });

  return {
    fondos,
    meses,
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const anioActual = new Date().getFullYear();
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);

  const resumenQuery = useQuery({
    queryKey: ["dashboard", "resumen"],
    queryFn: obtenerResumenDashboard,
  });

  const montoPorComunidadQuery = useQuery({
    queryKey: ["dashboard", "monto-por-comunidad"],
    queryFn: obtenerMontoPorComunidad,
  });

  const apoyosPorMesQuery = useQuery({
    queryKey: ["dashboard", "apoyos-por-mes", anioSeleccionado],
    queryFn: () => obtenerApoyosPorMes(anioSeleccionado),
  });

  const distribucionQuery = useQuery({
    queryKey: ["dashboard", "distribucion-por-fondo"],
    queryFn: obtenerDistribucionPorFondo,
  });

  const recientesQuery = useQuery({
    queryKey: ["dashboard", "recientes"],
    queryFn: () => obtenerApoyosRecientes(5),
  });

  const topComunidadesQuery = useQuery({
    queryKey: ["dashboard", "top-comunidades", anioSeleccionado],
    queryFn: () => obtenerTopComunidades(anioSeleccionado, 5),
  });

  const cargando =
    resumenQuery.isLoading ||
    montoPorComunidadQuery.isLoading ||
    apoyosPorMesQuery.isLoading ||
    distribucionQuery.isLoading ||
    recientesQuery.isLoading ||
    topComunidadesQuery.isLoading;

  const hayError =
    resumenQuery.isError ||
    montoPorComunidadQuery.isError ||
    apoyosPorMesQuery.isError ||
    distribucionQuery.isError ||
    recientesQuery.isError ||
    topComunidadesQuery.isError;

  const resumen = resumenQuery.data;
  const recientes = recientesQuery.data ?? [];
  const distribucion = distribucionQuery.data ?? [];
  const montosPorComunidad = montoPorComunidadQuery.data ?? [];
  const topComunidades = topComunidadesQuery.data;
  const apoyosPorMes = apoyosPorMesQuery.data ?? [];

  const datosGraficaMensual = useMemo(
    () => agruparApoyosPorMes(apoyosPorMes),
    [apoyosPorMes]
  );

  const totalDistribucion = useMemo(
    () =>
      distribucion.reduce(
        (acumulado, elemento) => acumulado + elemento.cantidad,
        0
      ),
    [distribucion]
  );

  const maximoMensual = Math.max(
    ...datosGraficaMensual.meses.map((item) => item.total),
    1
  );

  const maximoMontoComunidad = Math.max(
    ...montosPorComunidad.slice(0, 5).map((item) => item.montoTotal),
    1
  );

  const maximoTopComunidades = Math.max(
    ...(topComunidades?.topComunidades ?? []).map(
      (item) => item.totalApoyos
    ),
    1
  );

  const estadosTotal =
    (topComunidades?.pendientes ?? 0) +
    (topComunidades?.validados ?? 0) +
    (topComunidades?.aprobados ?? 0);

  const aniosDisponibles = Array.from(
    { length: 6 },
    (_, index) => anioActual - index
  );

  function recargarDashboard() {
    void Promise.all([
      resumenQuery.refetch(),
      montoPorComunidadQuery.refetch(),
      apoyosPorMesQuery.refetch(),
      distribucionQuery.refetch(),
      recientesQuery.refetch(),
      topComunidadesQuery.refetch(),
    ]);
  }

  if (cargando) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <LoaderCircle className={styles.spinner} size={34} />
          <strong>Cargando dashboard</strong>
          <span>Estamos preparando la información más reciente.</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        

        <div className={styles.headerActions}>
          <label className={styles.yearControl}>
            <CalendarDays size={17} />
            <span>Año</span>

            <select
              value={anioSeleccionado}
              onChange={(event) =>
                setAnioSeleccionado(Number(event.target.value))
              }
            >
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={recargarDashboard}
            disabled={
              resumenQuery.isFetching ||
              montoPorComunidadQuery.isFetching ||
              apoyosPorMesQuery.isFetching ||
              distribucionQuery.isFetching ||
              recientesQuery.isFetching ||
              topComunidadesQuery.isFetching
            }
          >
            <RefreshCw
              size={17}
              className={
                resumenQuery.isFetching ? styles.refreshing : undefined
              }
            />
            Actualizar
          </button>
        </div>
      </header>

      {hayError && (
        <section className={styles.errorBanner}>
          <div>
            <strong>No fue posible cargar toda la información</strong>
            <span>
              Algunos indicadores podrían no estar disponibles temporalmente.
            </span>
          </div>

          <button type="button" onClick={recargarDashboard}>
            Intentar nuevamente
          </button>
        </section>
      )}

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiWine}`}>
            <HandHeart size={21} />
          </div>

          <div className={styles.kpiContent}>
            <span>Total de apoyos</span>
            <strong>{formatoNumero(resumen?.totalApoyos ?? 0)}</strong>

            <small>
              <TrendingUp size={14} />
              {formatoNumero(resumen?.apoyosEsteMes ?? 0)} este mes
            </small>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiGold}`}>
            <MapPin size={21} />
          </div>

          <div className={styles.kpiContent}>
            <span>Comunidades atendidas</span>
            <strong>
              {formatoNumero(resumen?.comunidadesAtendidas ?? 0)}
            </strong>

            <small>
              <UsersRound size={14} />
              {formatoNumero(resumen?.comunidadesNuevasEsteMes ?? 0)} nuevas
              este mes
            </small>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiGreen}`}>
            <WalletCards size={21} />
          </div>

          <div className={styles.kpiContent}>
            <span>Fondos activos</span>
            <strong>{formatoNumero(resumen?.fondosActivos ?? 0)}</strong>

            <small>
              <CheckCircle2 size={14} />
              Disponibles para registro
            </small>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiOrange}`}>
            <Clock3 size={21} />
          </div>

          <div className={styles.kpiContent}>
            <span>Pendientes por validar</span>
            <strong>{formatoNumero(resumen?.pendientesValidar ?? 0)}</strong>

            <small>
              <FileText size={14} />
              Requieren seguimiento
            </small>
          </div>
        </article>
      </section>

      <section className={styles.primaryGrid}>
        <article className={`${styles.card} ${styles.monthlyCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardEyebrow}>Comportamiento anual</span>
              <h2>Apoyos otorgados por mes</h2>
            </div>

            <span className={styles.cardBadge}>{anioSeleccionado}</span>
          </div>

          {apoyosPorMes.length === 0 ? (
            <div className={styles.emptyState}>
              <CalendarDays size={26} />
              <strong>Sin apoyos registrados</strong>
              <span>No hay información disponible para este año.</span>
            </div>
          ) : (
            <>
              <div className={styles.chartLegend}>
                {datosGraficaMensual.fondos.map((fondo, index) => (
                  <span key={fondo}>
                    <i
                      style={{
                        background:
                          COLORES_FONDOS[index % COLORES_FONDOS.length],
                      }}
                    />
                    {fondo}
                  </span>
                ))}
              </div>

              <div className={styles.monthlyChart}>
                {datosGraficaMensual.meses.map((item) => (
                  <div className={styles.monthColumn} key={item.mes}>
                    <div className={styles.barArea}>
                      <span className={styles.barValue}>
                        {item.total > 0 ? item.total : ""}
                      </span>

                      <div
                        className={styles.monthBar}
                        style={{
                          height: `${
                            item.total > 0
                              ? Math.max(
                                  (item.total / maximoMensual) * 100,
                                  7
                                )
                              : 2
                          }%`,
                        }}
                        title={`${MESES[item.mes - 1]}: ${item.total} apoyos`}
                      >
                        {datosGraficaMensual.fondos.map((fondo, index) => {
                          const cantidad = item.fondos[fondo] ?? 0;

                          if (cantidad <= 0 || item.total <= 0) {
                            return null;
                          }

                          return (
                            <span
                              key={fondo}
                              style={{
                                height: `${(cantidad / item.total) * 100}%`,
                                background:
                                  COLORES_FONDOS[
                                    index % COLORES_FONDOS.length
                                  ],
                              }}
                              title={`${fondo}: ${cantidad}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <span className={styles.monthLabel}>
                      {MESES[item.mes - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>

        <article className={`${styles.card} ${styles.distributionCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardEyebrow}>Distribución general</span>
              <h2>Apoyos por fondo</h2>
            </div>

            <CircleDollarSign size={21} />
          </div>

          {distribucion.length === 0 ? (
            <div className={styles.emptyState}>
              <WalletCards size={26} />
              <strong>Sin distribución disponible</strong>
              <span>Todavía no existen apoyos asociados a fondos.</span>
            </div>
          ) : (
            <div className={styles.donutContent}>
              <div
                className={styles.donut}
                style={{
                  background: crearGradienteDona(distribucion),
                }}
              >
                <div className={styles.donutCenter}>
                  <strong>{formatoNumero(totalDistribucion)}</strong>
                  <span>apoyos</span>
                </div>
              </div>

              <div className={styles.distributionList}>
                {distribucion.map((item, index) => {
                  const porcentaje =
                    totalDistribucion > 0
                      ? Math.round((item.cantidad / totalDistribucion) * 100)
                      : 0;

                  return (
                    <div className={styles.distributionItem} key={item.fondo}>
                      <span
                        className={styles.colorIndicator}
                        style={{
                          background:
                            COLORES_FONDOS[
                              index % COLORES_FONDOS.length
                            ],
                        }}
                      />

                      <div>
                        <strong>{item.fondo}</strong>
                        <span>
                          {formatoNumero(item.cantidad)} apoyos · {porcentaje}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className={styles.secondaryGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardEyebrow}>Inversión acumulada</span>
              <h2>Monto por comunidad</h2>
            </div>

            <Banknote size={21} />
          </div>

          {montosPorComunidad.length === 0 ? (
            <div className={styles.emptyState}>
              <Building2 size={26} />
              <strong>Sin montos disponibles</strong>
              <span>No existen datos de inversión por comunidad.</span>
            </div>
          ) : (
            <div className={styles.rankingList}>
              {montosPorComunidad.slice(0, 5).map((item, index) => (
                <div className={styles.rankingItem} key={item.comunidadId}>
                  <span className={styles.rankingNumber}>{index + 1}</span>

                  <div className={styles.rankingData}>
                    <div className={styles.rankingHeader}>
                      <div>
                        <strong>{item.comunidad}</strong>
                        <span>
                          {formatoNumero(item.totalApoyos)} apoyos
                          {item.delegado ? ` · ${item.delegado}` : ""}
                        </span>
                      </div>

                      <b>{formatoMoneda(item.montoTotal)}</b>
                    </div>

                    <div className={styles.progressTrack}>
                      <span
                        style={{
                          width: `${Math.max(
                            (item.montoTotal / maximoMontoComunidad) * 100,
                            3
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardEyebrow}>
                Comunidades beneficiadas
              </span>
              <h2>Más apoyos en {anioSeleccionado}</h2>
            </div>

            <MapPin size={21} />
          </div>

          {!topComunidades?.topComunidades.length ? (
            <div className={styles.emptyState}>
              <UsersRound size={26} />
              <strong>Sin ranking disponible</strong>
              <span>No hay comunidades registradas para este periodo.</span>
            </div>
          ) : (
            <div className={styles.rankingList}>
              {topComunidades.topComunidades.map((item, index) => (
                <div
                  className={styles.rankingItem}
                  key={`${item.comunidad}-${index}`}
                >
                  <span className={styles.rankingNumber}>{index + 1}</span>

                  <div className={styles.rankingData}>
                    <div className={styles.rankingHeader}>
                      <strong>{item.comunidad}</strong>
                      <b>{formatoNumero(item.totalApoyos)} apoyos</b>
                    </div>

                    <div className={styles.progressTrack}>
                      <span
                        style={{
                          width: `${Math.max(
                            (item.totalApoyos / maximoTopComunidades) * 100,
                            3
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardEyebrow}>Seguimiento global</span>
              <h2>Estado de solicitudes</h2>
            </div>

            <FileText size={21} />
          </div>

          <div className={styles.statusSummary}>
            <div className={styles.statusSummaryTotal}>
              <strong>{formatoNumero(estadosTotal)}</strong>
              <span>solicitudes contabilizadas</span>
            </div>

            <div className={styles.statusRow}>
              <div>
                <span className={styles.pendingDot} />
                <p>
                  <strong>Pendientes</strong>
                  <small>En espera de revisión</small>
                </p>
              </div>

              <b>{formatoNumero(topComunidades?.pendientes ?? 0)}</b>
            </div>

            <div className={styles.statusRow}>
              <div>
                <span className={styles.validatedDot} />
                <p>
                  <strong>Validados</strong>
                  <small>Información verificada</small>
                </p>
              </div>

              <b>{formatoNumero(topComunidades?.validados ?? 0)}</b>
            </div>

            <div className={styles.statusRow}>
              <div>
                <span className={styles.approvedDot} />
                <p>
                  <strong>Aprobados</strong>
                  <small>Apoyos autorizados</small>
                </p>
              </div>

              <b>{formatoNumero(topComunidades?.aprobados ?? 0)}</b>
            </div>
          </div>
        </article>
      </section>

      <section className={`${styles.card} ${styles.recentCard}`}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardEyebrow}>Actividad reciente</span>
            <h2>Últimos apoyos registrados</h2>
          </div>

          <button
            type="button"
            className={styles.linkButton}
            onClick={() => navigate("/apoyos/registro")}
          >
            Ver todos
            <ArrowRight size={16} />
          </button>
        </div>

        {recientes.length === 0 ? (
          <div className={styles.emptyState}>
            <HandHeart size={26} />
            <strong>No hay apoyos recientes</strong>
            <span>Los registros nuevos aparecerán en esta sección.</span>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Comunidad</th>
                  <th>Tipo de apoyo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {recientes.map((apoyo) => (
                  <tr key={apoyo.id}>
                    <td>
                      <div className={styles.communityCell}>
                        <span>
                          <MapPin size={16} />
                        </span>

                        <strong>{apoyo.comunidad || "Sin comunidad"}</strong>
                      </div>
                    </td>

                    <td>{apoyo.tipoApoyo || "Sin especificar"}</td>
                    <td>{formatoFecha(apoyo.fecha)}</td>

                    <td>
                      <span
                        className={`${styles.statusBadge} ${obtenerClaseEstado(
                          apoyo.estado
                        )}`}
                      >
                        {apoyo.estado || "Pendiente"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.rowButton}
                        onClick={() =>
                          navigate(`/apoyos/registro?detalle=${apoyo.id}`)
                        }
                        title="Ver apoyo"
                      >
                        <ArrowRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}