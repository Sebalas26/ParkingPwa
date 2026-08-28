import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, Download, Building } from 'lucide-react';
import { reportsService } from '../data/reportsService';
import type { ReportTicketDto } from '../model/ReportContracts';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';
import { authService } from '../../auth/data/authService';
import './Reports.css';

export const Reports: React.FC = () => {
  const { selectedParqueadero } = useParqueaderoContext();
  const [tickets, setTickets] = useState<ReportTicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filtros
  const [filterPeriod, setFilterPeriod] = useState<'dia' | 'mes' | 'todos' | 'personalizado'>('todos');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      const data = await reportsService.getTicketsReport();
      setTickets(data || []);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado de tickets
  const filteredTickets = tickets.filter((t) => {
    if (!t.entryTimeUtc) return false;
    const ticketDate = t.entryTimeUtc.slice(0, 10);

    if (filterPeriod === 'dia' && selectedDate) {
      return ticketDate === selectedDate;
    }
    if (filterPeriod === 'personalizado') {
      if (dateFrom && ticketDate < dateFrom) return false;
      if (dateTo && ticketDate > dateTo) return false;
      return true;
    }
    return true;
  });

  // Métricas calculadas
  const totalVehiculos = filteredTickets.length;
  const totalIngresos = filteredTickets.reduce((acc, t) => acc + (t.amountPaid || 0), 0);
  const totalDescuentos = filteredTickets.reduce((acc, t) => acc + (t.discountAmount || 0), 0);
  const tiempoPromedioMin = totalVehiculos > 0
    ? Math.round(filteredTickets.reduce((acc, t) => acc + (t.totalDurationMinutes || 0), 0) / totalVehiculos)
    : 0;

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Hoja 1: Detalle de Tiquetes
      const ticketsExport = filteredTickets.map((t) => ({
        'Número Tiquete': t.ticketNumber,
        'Placa': t.plateNumber,
        'Fecha Ingreso': t.entryTimeUtc ? new Date(t.entryTimeUtc).toLocaleString() : '--',
        'Fecha Salida': t.exitTimeUtc ? new Date(t.exitTimeUtc).toLocaleString() : 'En parqueadero',
        'Duración (min)': t.totalDurationMinutes || 0,
        'Tarifa Base': t.hourlyRate || 0,
        'Monto Bruto': t.grossAmount || 0,
        'Descuento': t.discountAmount || 0,
        'Monto Neto': t.netAmount || 0,
        'Total Pagado': t.amountPaid || 0,
        'Operador': t.operatorName || 'Sistema',
      }));

      const wsTickets = XLSX.utils.json_to_sheet(ticketsExport);
      XLSX.utils.book_append_sheet(wb, wsTickets, 'Tiquetes');

      // Hoja 2: Resumen Financiero
      const summaryExport = [
        { Concepto: 'Total Vehículos Atendidos', Valor: totalVehiculos },
        { Concepto: 'Total Ingresos Recaudados', Valor: totalIngresos },
        { Concepto: 'Total Descuentos Otorgados', Valor: totalDescuentos },
        { Concepto: 'Tiempo Promedio Estancia (min)', Valor: tiempoPromedioMin },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryExport);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

      XLSX.writeFile(wb, `Reporte_Estacionamiento_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exportando Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="reports-container">
      {/* Encabezado */}
      <div className="reports-header">
        <div className="reports-title-group">
          <div className="reports-title-row">
            <h1>Centro de Reportes</h1>
            <span className="reports-branch-badge">
              <Building size={14} />
              {selectedParqueadero ? selectedParqueadero.name : '🌐 Todos los Parqueaderos'}
            </span>
          </div>
          <p className="reports-subtitle">
            Generación y descarga de métricas consolidadas a partir de transacciones reales.
          </p>
        </div>

        {authService.hasPermission('reports.export') && (
          <button
            type="button"
            className="btn-export-excel"
            onClick={handleExportExcel}
            disabled={isExporting || filteredTickets.length === 0}
            title="Descargar reporte en formato Excel"
          >
            <Download size={16} />
            <span>{isExporting ? 'Generando...' : 'Exportar a Excel'}</span>
          </button>
        )}
      </div>

      {/* Grilla de Tarjetas de Resumen (2x2 en Móvil) */}
      <div className="reports-stats-grid">
        <div className="report-stat-card">
          <span className="report-stat-label">Total Vehículos</span>
          <p className="report-stat-value primary">{totalVehiculos}</p>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label">Ingresos Totales</span>
          <p className="report-stat-value success">${totalIngresos.toLocaleString()}</p>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label">Descuentos / Conv.</span>
          <p className="report-stat-value warning">${totalDescuentos.toLocaleString()}</p>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label">Estancia Promedio</span>
          <p className="report-stat-value">{tiempoPromedioMin} min</p>
        </div>
      </div>

      {/* Barra de Filtros Responsive */}
      <div className="reports-filters-card">
        <div className="reports-filters-row">
          <div className="filter-pills-container">
            <button
              type="button"
              className={`filter-pill ${filterPeriod === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('todos')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`filter-pill ${filterPeriod === 'dia' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('dia')}
            >
              Por Día
            </button>
            <button
              type="button"
              className={`filter-pill ${filterPeriod === 'personalizado' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('personalizado')}
            >
              Rango Fechas
            </button>
          </div>

          {filterPeriod === 'dia' && (
            <div className="filter-date-box">
              <Calendar size={16} style={{ color: 'var(--primary-color, #07665e)', flexShrink: 0 }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Seleccionar fecha de reporte"
              />
            </div>
          )}

          {filterPeriod === 'personalizado' && (
            <div className="filter-custom-range">
              <div className="filter-date-box">
                <Calendar size={15} style={{ color: 'var(--primary-color, #07665e)', flexShrink: 0 }} />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="Fecha inicio"
                />
              </div>
              <span className="filter-range-separator">hasta</span>
              <div className="filter-date-box">
                <Calendar size={15} style={{ color: 'var(--primary-color, #07665e)', flexShrink: 0 }} />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="Fecha fin"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Detalle con Scroll Horizontal Protegido */}
      <div className="reports-table-card">
        <div className="reports-table-header">
          <h2>Transacciones y Tiquetes ({filteredTickets.length})</h2>
        </div>
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>TIQUETE</th>
                <th>PLACA</th>
                <th>INGRESO</th>
                <th>SALIDA</th>
                <th>DURACIÓN</th>
                <th className="text-right">BRUTO</th>
                <th className="text-right">DESCUENTO</th>
                <th className="text-right">TOTAL PAGADO</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr key={t.ticketId}>
                    <td style={{ fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>{t.ticketNumber}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary-color, #07665e)' }}>{t.plateNumber}</td>
                    <td style={{ color: 'var(--text-secondary, #64748b)' }}>
                      {formatDateTime(t.entryTimeUtc || (t as any).entryTime || (t as any).createdAtUtc || (t as any).entryDate)}
                    </td>
                    <td style={{ color: 'var(--text-secondary, #64748b)' }}>
                      {t.exitTimeUtc ? formatDateTime(t.exitTimeUtc || (t as any).exitTime) : 'En parqueadero'}
                    </td>
                    <td>{t.totalDurationMinutes ? `${t.totalDurationMinutes} min` : '--'}</td>
                    <td className="text-right" style={{ color: 'var(--text-secondary, #64748b)' }}>
                      ${(t.grossAmount || 0).toLocaleString()}
                    </td>
                    <td className="text-right" style={{ color: '#f59e0b', fontWeight: 600 }}>
                      ${(t.discountAmount || 0).toLocaleString()}
                    </td>
                    <td className="text-right" style={{ fontWeight: 800, color: '#10b981' }}>
                      ${(t.amountPaid || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="reports-empty-state">
                    {isLoading ? 'Cargando datos...' : 'No hay registros que coincidan con los filtros seleccionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
