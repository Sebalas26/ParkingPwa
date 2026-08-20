import React, { useEffect, useState } from 'react';
import { dashboardService } from '../data/dashboardService';
import type { DailySummaryDto, OccupancyStatsDto, RecentTicketDto } from '../model/DashboardContracts';
import { Car, Bike, Truck, FileText, Activity, RefreshCw } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DailySummaryDto | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyStatsDto | null>(null);
  const [activeTickets, setActiveTickets] = useState<RecentTicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Polling cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Normalización de datos para evitar cualquier undefined
  const totalCapacity = occupancy?.totalCapacity || 120;
  const occupiedSpots = occupancy?.occupiedSpots ?? occupancy?.occupiedSpaces ?? activeTickets.length ?? 0;
  const availableSpots = occupancy?.availableSpots ?? occupancy?.availableSpaces ?? Math.max(0, totalCapacity - occupiedSpots);
  const occupancyRate = occupancy?.occupancyRate ?? occupancy?.occupancyPercentage ?? (totalCapacity > 0 ? Math.round((occupiedSpots * 100) / totalCapacity) : 0);

  const activeVehiclesCount = summary?.activeVehiclesCount ?? summary?.activeTickets ?? occupiedSpots;
  const completedCount = summary?.completedTransactionsToday ?? summary?.completedTickets ?? 0;
  const totalTicketsToday = summary?.totalTickets ?? (activeVehiclesCount + completedCount);
  const totalRevenueToday = summary?.totalRevenueToday ?? summary?.totalRevenue ?? 0;
  const avgDuration = Math.round(summary?.averageDurationMinutes || 0);

  const getVehicleTypeLabel = (type: string | number) => {
    switch (String(type)) {
      case '1':
      case 'Motorcycle':
      case 'Moto':
        return 'Moto';
      case '2':
      case 'Truck':
      case 'Camión':
        return 'Camión';
      case '3':
      case 'Van':
      case 'Camioneta':
        return 'Camioneta';
      default:
        return 'Auto';
    }
  };

  const renderVehicleIcon = (type: string | number) => {
    const label = getVehicleTypeLabel(type);
    if (label === 'Moto') return <Bike size={14} className="text-muted" style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    if (label === 'Camioneta' || label === 'Camión') return <Truck size={14} className="text-muted" style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    return <Car size={14} className="text-muted" style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
  };

  return (
    <>
      <div className="stats-row three-cols">
        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">VEHÍCULOS INGRESADOS HOY</span>
            <Car size={16} className="text-muted" />
          </div>
          <div className="stat-value">{totalTicketsToday}</div>
          <div className="stat-desc">Total acumulado de tiquetes emitidos hoy</div>
        </div>

        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">VEHÍCULOS EN PARQUEADERO</span>
            <Activity size={16} className="text-muted" />
          </div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeVehiclesCount}{' '}
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {occupancyRate}% Ocupado
            </span>
          </div>
          <div className="stat-desc">
            {occupiedSpots} ocupados de {totalCapacity} espacios
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">RECAUDACIÓN TOTAL HOY</span>
            <FileText size={16} className="text-muted" />
          </div>
          <div className="stat-value">$ {totalRevenueToday.toLocaleString()} COP</div>
          <div className="stat-desc">
            {completedCount > 0 ? `${completedCount} tiquetes liquidados hoy` : 'Total recaudado del día'}
          </div>
        </div>
      </div>

      <div className="middle-row" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="chart-box">
          <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Capacidad y Ocupación del Parqueadero</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Métricas en vivo de plazas disponibles y ocupadas</p>
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
              }}
              title="Actualizar datos"
            >
              <RefreshCw size={12} className={isLoading ? 'spin' : ''} /> {lastUpdated || 'Actualizar'}
            </button>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                <span>Ocupación General ({occupancyRate}%)</span>
                <span>{occupiedSpots} / {totalCapacity} Plazas</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(occupancyRate, 100)}%`,
                    height: '100%',
                    background: occupancyRate > 85 ? 'var(--danger-color)' : 'var(--primary-color)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-body, var(--bg-main))', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Espacios Disponibles</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                  {availableSpots}
                </p>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-body, var(--bg-main))', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Tiempo Promedio Estancia</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 'bold' }}>
                  {avgDuration} min
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="activity-box">
          <div className="box-header">
            <h3>Vehículos Activos Recientes</h3>
          </div>
          <table className="activity-table">
            <tbody>
              {activeTickets.length > 0 ? (
                activeTickets.slice(0, 6).map((ticket) => (
                  <tr key={ticket.ticketId}>
                    <td className="font-medium">
                      {renderVehicleIcon(ticket.vehicleType)}
                      <span className="font-bold">{ticket.plateNumber}</span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {getVehicleTypeLabel(ticket.vehicleType)}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {ticket.entryTimeUtc ? new Date(ticket.entryTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="td-right">
                      <span className="badge badge-success">
                        En Parqueadero
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No hay vehículos activos en este momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
