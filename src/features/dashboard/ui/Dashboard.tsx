import React, { useEffect, useState } from 'react';
import { dashboardService } from '../data/dashboardService';
import type { DashboardStats, CarEntry, Alert } from '../model/DashboardTypes';
import { Car, Bike, Truck, FileText, Calendar, User, Phone, FileSignature, X } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [entries, setEntries] = useState<CarEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Modal state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const s = await dashboardService.getStats();
      const e = await dashboardService.getRecentEntries();
      const a = await dashboardService.getAlerts();
      setStats(s);
      setEntries(e);
      setAlerts(a);
    };
    loadData();
  }, []);

  if (!stats) return <div className="loading-screen">Cargando...</div>;

  return (
    <>
      <div className="stats-row three-cols">
        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">VEHÍCULOS INGRESADOS HOY</span>
            <Car size={16} className="text-muted" />
          </div>
          <div className="stat-value">{stats.vehiculosIngresadosHoy}</div>
          <div className="stat-desc">Total acumulado del día</div>
        </div>
        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">VEHÍCULOS ACTUALES</span>
            <Car size={16} className="text-muted" />
          </div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {stats.vehiculosActuales} <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>En sitio</span>
          </div>
          <div className="stat-desc">Actualmente dentro de las instalaciones</div>
        </div>
        <div className="stat-box">
          <div className="stat-header">
            <span className="stat-title">RECAUDACIÓN HOY</span>
            <FileText size={16} className="text-muted" />
          </div>
          <div className="stat-value">$ {(stats.revenueToday * 1000).toLocaleString()} COP</div>
          <div className="stat-desc">+14.2% vs promedio de ayer</div>
        </div>
      </div>

      <div className="middle-row">
        <div className="chart-box">
          <div className="box-header">
            <div>
              <h3>Ocupación en el Tiempo</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Seguimiento histórico de los últimos 7 días</p>
            </div>
          </div>
          <div className="chart-mock">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="line-chart">
              <polyline 
                fill="none" 
                stroke="var(--primary-color)" 
                strokeWidth="2" 
                points="0,100 70,80 140,120 210,60 280,100 350,40 420,50 500,60" 
              />
            </svg>
            <div className="chart-labels">
              <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
            </div>
          </div>
        </div>

        <div className="activity-box">
          <div className="box-header">
            <h3>Actividad Reciente</h3>
          </div>
          <table className="activity-table">
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td className="font-medium">
                    {entry.vehicleType === 'Moto' ? <Bike size={14} className="text-muted" style={{ marginRight: '6px', verticalAlign: 'middle' }}/> :
                     entry.vehicleType === 'Camioneta' ? <Truck size={14} className="text-muted" style={{ marginRight: '6px', verticalAlign: 'middle' }}/> :
                     <Car size={14} className="text-muted" style={{ marginRight: '6px', verticalAlign: 'middle' }}/>}
                    {entry.licensePlate}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{entry.vehicleType}</td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{entry.entryTime}</td>
                  <td className="td-right">
                    <span className={`badge ${entry.status === 'entry' ? 'badge-success' : 'badge-danger'}`}>
                      {entry.status === 'entry' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="alerts-section">
        <h3>Alertas y Novedades</h3>
        <div className="alerts-grid">
          {alerts.map((alert) => {
            let badgeClass = "badge-warning";
            if (alert.type === 'VEHÍCULO HURTADO') badgeClass = "badge-danger";
            
            return (
              <div key={alert.id} className="alert-card">
                <div className="alert-header">
                  <span className={`badge ${badgeClass}`}>{alert.type}</span>
                </div>
                <div className="alert-plate-container">
                  <Car size={20} className="text-muted" />
                  <div className="alert-plate">{alert.licensePlate}</div>
                </div>
                <button className="btn-outline mt-auto" onClick={() => setSelectedAlert(alert)}>Ver Detalle</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Dialog Fragment */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle de Incidente</h3>
              <button className="modal-close" onClick={() => setSelectedAlert(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-badge-wrapper">
                <span className={`badge ${selectedAlert.type === 'VEHÍCULO HURTADO' ? 'badge-danger' : 'badge-warning'}`}>
                  {selectedAlert.type}
                </span>
              </div>
              
              <div className="modal-info-grid">
                <div className="info-item">
                  <Calendar size={16} className="text-muted"/>
                  <div>
                    <div className="info-label">Fecha del Incidente</div>
                    <div className="info-value">{selectedAlert.fechaIncidente}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Car size={16} className="text-muted"/>
                  <div>
                    <div className="info-label">Placa</div>
                    <div className="info-value font-bold">{selectedAlert.licensePlate}</div>
                  </div>
                </div>
                <div className="info-item">
                  <User size={16} className="text-muted"/>
                  <div>
                    <div className="info-label">Nombre del Propietario</div>
                    <div className="info-value">{selectedAlert.propietario}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Phone size={16} className="text-muted"/>
                  <div>
                    <div className="info-label">Celular</div>
                    <div className="info-value">{selectedAlert.celular}</div>
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <div className="info-label flex-label"><FileSignature size={16}/> Observación</div>
                <p className="modal-obs">{selectedAlert.observacion}</p>
              </div>
              
              <div className="modal-section">
                <div className="info-label">Evidencia Fotográfica</div>
                <div className="modal-evidence">
                  <img src={selectedAlert.evidencia} alt="Evidencia del incidente" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
