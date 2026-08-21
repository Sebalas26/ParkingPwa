import React, { useEffect, useState } from 'react';
import { dashboardService } from '../data/dashboardService';
import type { DailySummaryDto, OccupancyStatsDto, RecentTicketDto } from '../model/DashboardContracts';
import { formatTime, calculateDuration } from '../../../shared/utils/dateUtils';
import {
  Car,
  Bike,
  Truck,
  DollarSign,
  Activity,
  RefreshCw,
  Clock,
  ParkingCircle,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Eye,
  X,
  CreditCard,
  Wallet,
  QrCode
} from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DailySummaryDto | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyStatsDto | null>(null);
  const [activeTickets, setActiveTickets] = useState<RecentTicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<RecentTicketDto | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, occ, tickets] = await Promise.all([
        dashboardService.getDailySummary(),
        dashboardService.getOccupancyStats(),
        dashboardService.getActiveTickets(),
      ]);
      setSummary(sum);
      setOccupancy(occ);
      setActiveTickets(tickets || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // Polling cada 20 segundos
    return () => clearInterval(interval);
  }, []);

  // Métricas normalizadas
  const totalCapacity = occupancy?.totalCapacity || 120;
  const occupiedSpots = occupancy?.occupiedSpots ?? activeTickets.length ?? 0;
  const availableSpots = occupancy?.availableSpots ?? Math.max(0, totalCapacity - occupiedSpots);
  const occupancyRate = occupancy?.occupancyRate ?? (totalCapacity > 0 ? Math.round((occupiedSpots * 1000) / totalCapacity) / 10 : 0);

  const activeVehiclesCount = summary?.activeVehiclesCount ?? activeTickets.length;
  const completedCount = summary?.completedTransactionsToday ?? 0;
  const totalVehiclesEnteredToday = summary?.totalTickets ?? (activeVehiclesCount + completedCount);
  const totalRevenueToday = summary?.totalRevenueToday ?? 0;
  const avgDurationMin = Math.round(summary?.averageDurationMinutes || 0);

  const avgHours = Math.floor(avgDurationMin / 60);
  const avgMins = avgDurationMin % 60;
  const formattedAvgDuration = avgHours > 0 ? `${avgHours}h ${avgMins}m` : `${avgMins} min`;

  // Mapeo de Medios de Pago
  const getPaymentMethodLabel = (method: string | number) => {
    switch (String(method)) {
      case '0':
      case 'Cash':
      case 'Efectivo':
        return 'Efectivo';
      case '1':
      case 'CreditCard':
        return 'Tarjeta de Crédito';
      case '2':
      case 'DebitCard':
        return 'Tarjeta de Débito';
      case '3':
      case 'Transfer':
        return 'Transferencia / Nequi / PSE';
      default:
        return String(method);
    }
  };

  const getPaymentMethodIcon = (method: string | number) => {
    const label = getPaymentMethodLabel(method);
    if (label === 'Efectivo') return <Wallet size={15} style={{ color: '#10b981' }} />;
    if (label.includes('Tarjeta')) return <CreditCard size={15} style={{ color: '#3b82f6' }} />;
    return <QrCode size={15} style={{ color: '#8b5cf6' }} />;
  };

  const paymentBreakdown = summary?.revenueByPaymentMethod || { Cash: totalRevenueToday };
  const cashAmount = paymentBreakdown['Cash'] ?? paymentBreakdown['0'] ?? paymentBreakdown['Efectivo'] ?? totalRevenueToday;
  const cardAmount = (paymentBreakdown['CreditCard'] || 0) + (paymentBreakdown['DebitCard'] || 0) + (paymentBreakdown['1'] || 0) + (paymentBreakdown['2'] || 0);
  const transferAmount = paymentBreakdown['Transfer'] || paymentBreakdown['3'] || 0;

  // Clasificación de vehículos activos
  const countByCategory = activeTickets.reduce<Record<string, number>>((acc, t) => {
    const typeStr = String(t.vehicleType);
    let key = 'Auto';
    if (typeStr === '1' || typeStr === 'Motorcycle' || typeStr === 'Moto') key = 'Moto';
    else if (typeStr === '2' || typeStr === 'Truck' || typeStr === 'Camión') key = 'Camión';
    else if (typeStr === '3' || typeStr === 'Van' || typeStr === 'Camioneta') key = 'Camioneta';
    else if (typeStr === '5' || typeStr === 'Suv' || typeStr === 'SUV') key = 'SUV';

    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const getVehicleTypeLabel = (type: string | number) => {
    switch (String(type)) {
      case '1':
      case 'Motorcycle':
      case 'Moto':
        return 'Motocicleta';
      case '2':
      case 'Truck':
      case 'Camión':
        return 'Camión Pesado';
      case '3':
      case 'Van':
      case 'Camioneta':
        return 'Furgón / Van';
      case '5':
      case 'Suv':
      case 'SUV':
        return 'Camioneta / SUV';
      default:
        return 'Automóvil / Sedán';
    }
  };

  const renderVehicleIcon = (type: string | number, size = 16) => {
    const label = getVehicleTypeLabel(type);
    if (label.includes('Motocicleta')) return <Bike size={size} style={{ color: '#3b82f6' }} />;
    if (label.includes('Camión') || label.includes('Furgón')) return <Truck size={size} style={{ color: '#8b5cf6' }} />;
    return <Car size={size} style={{ color: '#10b981' }} />;
  };

  const recentActiveTickets = activeTickets.slice(0, 7);

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <div className="dashboard-hero-header">
        <div className="dashboard-hero-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>Panel de Control Operativo</h1>
            <span className="dashboard-status-badge">
              <span className="status-dot-pulse" />
              SISTEMA EN LÍNEA
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
            Monitoreo ejecutivo en tiempo real de flujo vehicular, recaudación diaria por medios de pago y ocupación.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <button className="btn-glass" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>{lastUpdated ? `Actualizado ${lastUpdated}` : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* 6 Executive KPI Metric Cards */}
      <div className="dashboard-kpi-grid">
        {/* Card 1: Recaudación Total */}
        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-title">Recaudación Total Hoy</span>
            <div className="kpi-icon-wrapper green">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">$ {totalRevenueToday.toLocaleString()}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>COP</span>
          </div>
          <div className="kpi-subtext">
            <TrendingUp size={13} style={{ color: '#10b981' }} />
            <span>{completedCount > 0 ? `${completedCount} transacciones completadas` : 'Recaudo activo del día'}</span>
          </div>
        </div>

        {/* Card 2: Vehículos Activos */}
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-title">Vehículos en Parqueadero</span>
            <div className="kpi-icon-wrapper blue">
              <Car size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{activeVehiclesCount}</span>
            <span className="pulse-badge">
              <span className="dot" /> {occupancyRate}% Ocupado
            </span>
          </div>
          <div className="kpi-subtext">
            <Activity size={13} />
            <span>{occupiedSpots} de {totalCapacity} plazas ocupadas</span>
          </div>
        </div>

        {/* Card 3: Vehículos Ingresados Hoy */}
        <div className="kpi-card indigo">
          <div className="kpi-header">
            <span className="kpi-title">Vehículos Ingresados Hoy</span>
            <div className="kpi-icon-wrapper indigo">
              <Zap size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{totalVehiclesEnteredToday}</span>
            <span style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600 }}>Vehículos</span>
          </div>
          <div className="kpi-subtext">
            <ShieldCheck size={13} />
            <span>{activeVehiclesCount} activos en sitio • {completedCount} salidas</span>
          </div>
        </div>

        {/* Card 4: Estancia Promedio */}
        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-title">Estancia Promedio</span>
            <div className="kpi-icon-wrapper purple">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{formattedAvgDuration}</span>
          </div>
          <div className="kpi-subtext">
            <span>Permanencia media en parqueadero</span>
          </div>
        </div>

        {/* Card 5: Plazas Disponibles */}
        <div className="kpi-card teal">
          <div className="kpi-header">
            <span className="kpi-title">Plazas Libres</span>
            <div className="kpi-icon-wrapper teal">
              <ParkingCircle size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#0d9488' }}>{availableSpots}</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>/ {totalCapacity}</span>
          </div>
          <div className="kpi-subtext">
            <CheckCircle2 size={13} style={{ color: '#0d9488' }} />
            <span>Espacios listos para recepción</span>
          </div>
        </div>

        {/* Card 6: Medios de Pago del Día */}
        <div className="kpi-card amber">
          <div className="kpi-header">
            <span className="kpi-title">Medios de Pago del Día</span>
            <div className="kpi-icon-wrapper amber">
              <Wallet size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">$ {cashAmount.toLocaleString()}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Efectivo</span>
          </div>
          <div className="kpi-subtext" style={{ gap: '8px' }}>
            {cardAmount > 0 && <span>Tarjeta: ${cardAmount.toLocaleString()}</span>}
            {transferAmount > 0 && <span>Transferencia: ${transferAmount.toLocaleString()}</span>}
            {cardAmount === 0 && transferAmount === 0 && <span>100% Recaudado en Efectivo</span>}
          </div>
        </div>
      </div>

      {/* Grid Principal: Ocupación vs Stream Vehicular */}
      <div className="dashboard-main-grid">
        {/* Columna Izquierda: Ocupación + Medios de Pago Desglosados */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3>
                <ParkingCircle size={18} style={{ color: 'var(--primary-color)' }} />
                Ocupación y Capacidad de Instalaciones
              </h3>
              <p>Estado en tiempo real de parqueo general y distribución por tipo de vehículo.</p>
            </div>
          </div>

          {/* Medidor visual */}
          <div className="occupancy-meter-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Nivel de Ocupación General</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: occupancyRate > 85 ? '#ef4444' : '#10b981' }}>
                {occupancyRate}%
              </span>
            </div>

            <div className="occupancy-bar-wrapper">
              <div
                className="occupancy-bar-fill"
                style={{
                  width: `${Math.min(occupancyRate, 100)}%`,
                  background:
                    occupancyRate > 85
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : 'linear-gradient(90deg, #10b981, #3b82f6)',
                }}
              />
            </div>

            <div className="occupancy-stats-pills">
              <div className="occ-pill">
                <span className="occ-pill-label">Capacidad Total</span>
                <span className="occ-pill-value">{totalCapacity} Plazas</span>
              </div>
              <div className="occ-pill">
                <span className="occ-pill-label">Ocupadas</span>
                <span className="occ-pill-value" style={{ color: '#3b82f6' }}>{occupiedSpots}</span>
              </div>
              <div className="occ-pill">
                <span className="occ-pill-label">Disponibles</span>
                <span className="occ-pill-value" style={{ color: '#10b981' }}>{availableSpots}</span>
              </div>
            </div>
          </div>

          {/* Desglose de Medios de Pago del Día */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              MEDIOS DE PAGO UTILIZADOS HOY
            </h4>
            <div className="revenue-breakdown-list">
              {Object.keys(paymentBreakdown).length > 0 ? (
                Object.entries(paymentBreakdown).map(([methodKey, amount]) => {
                  const label = getPaymentMethodLabel(methodKey);
                  const pct = totalRevenueToday > 0 ? Math.round((amount * 100) / totalRevenueToday) : 100;
                  return (
                    <div key={methodKey} className="revenue-item">
                      <div className="revenue-item-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getPaymentMethodIcon(methodKey)}
                          {label}
                        </span>
                        <span style={{ fontWeight: 700 }}>$ {amount.toLocaleString()} COP ({pct}%)</span>
                      </div>
                      <div className="revenue-item-bar">
                        <div
                          className="revenue-item-fill"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background:
                              label === 'Efectivo'
                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                : label.includes('Tarjeta')
                                ? 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                                : 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="revenue-item">
                  <div className="revenue-item-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wallet size={15} style={{ color: '#10b981' }} /> Efectivo
                    </span>
                    <span style={{ fontWeight: 700 }}>$ {totalRevenueToday.toLocaleString()} COP (100%)</span>
                  </div>
                  <div className="revenue-item-bar">
                    <div className="revenue-item-fill" style={{ width: '100%', background: '#10b981' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Distribución por Categoría de Vehículo */}
          <div style={{ marginTop: '0.5rem' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              DISTRIBUCIÓN DE VEHÍCULOS ACTIVOS EN SITIO
            </h4>
            <div className="category-breakdown-grid">
              <div className="category-mini-card">
                <div className="category-mini-header">
                  <span>Autos / Sedán</span>
                  <Car size={14} style={{ color: '#10b981' }} />
                </div>
                <div className="category-mini-count">{countByCategory['Auto'] || 0}</div>
              </div>

              <div className="category-mini-card">
                <div className="category-mini-header">
                  <span>Motocicletas</span>
                  <Bike size={14} style={{ color: '#3b82f6' }} />
                </div>
                <div className="category-mini-count">{countByCategory['Moto'] || 0}</div>
              </div>

              <div className="category-mini-card">
                <div className="category-mini-header">
                  <span>Camionetas / SUV</span>
                  <Truck size={14} style={{ color: '#f59e0b' }} />
                </div>
                <div className="category-mini-count">{(countByCategory['Camioneta'] || 0) + (countByCategory['SUV'] || 0)}</div>
              </div>

              <div className="category-mini-card">
                <div className="category-mini-header">
                  <span>Camiones / Pesado</span>
                  <Truck size={14} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="category-mini-count">{countByCategory['Camión'] || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Stream de Vehículos Activos */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3>
                <Activity size={18} style={{ color: '#3b82f6' }} />
                Resumen de Vehículos Activos ({activeTickets.length})
              </h3>
              <p>Últimos vehículos ingresados en parqueadero.</p>
            </div>
          </div>

          {/* Tabla Stream */}
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table className="active-stream-table">
              <thead>
                <tr>
                  <th>PLACA / TIQUETE</th>
                  <th>CATEGORÍA</th>
                  <th>INGRESO</th>
                  <th>ESTANCIA</th>
                  <th style={{ textAlign: 'right' }}>VER</th>
                </tr>
              </thead>
              <tbody>
                {recentActiveTickets.length > 0 ? (
                  recentActiveTickets.map((t) => (
                    <tr key={t.ticketId}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="plate-badge-styled">{t.plateNumber}</span>
                          <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.ticketNumber}</small>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                          {renderVehicleIcon(t.vehicleType, 14)}
                          <span>{getVehicleTypeLabel(t.vehicleType)}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {formatTime(t.entryTimeUtc || (t as any).entryTime || (t as any).createdAtUtc)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {calculateDuration(t.entryTimeUtc || (t as any).entryTime || (t as any).createdAtUtc)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedTicket(t)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            color: 'var(--primary-color)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                          title="Ver detalle de tiquete"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-secondary)' }}>
                      {isLoading ? 'Cargando stream vehicular...' : 'No hay vehículos activos que coincidan con la búsqueda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Vista Rápida de Tiquete */}
      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="plate-badge-styled" style={{ fontSize: '1.2rem' }}>{selectedTicket.plateNumber}</span>
                <span className="pulse-badge"><span className="dot" /> Activo</span>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedTicket(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ gap: '1rem' }}>
              <div style={{ padding: '12px', background: 'var(--bg-body)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Tiquete ID</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Categoría</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{getVehicleTypeLabel(selectedTicket.vehicleType)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Hora de Ingreso</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '0.88rem' }}>
                    {formatTime(selectedTicket.entryTimeUtc || (selectedTicket as any).entryTime || (selectedTicket as any).createdAtUtc)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Tiempo Transcurrido</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-color)' }}>
                    {calculateDuration(selectedTicket.entryTimeUtc || (selectedTicket as any).entryTime || (selectedTicket as any).createdAtUtc)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tarifa Base Configurada</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                  ${(selectedTicket.hourlyRate || 4000).toLocaleString()} /hr
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedTicket(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
