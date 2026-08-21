import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, Download } from 'lucide-react';
import { reportsService } from '../data/reportsService';
import type { ReportTicketDto } from '../model/ReportContracts';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import './Reports.css';

export const Reports: React.FC = () => {
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
        'Total Pagado (COP)': t.amountPaid || 0,
        'Operador': t.operatorName || 'Sistema',
      }));

      const wsTickets = XLSX.utils.json_to_sheet(ticketsExport);
      XLSX.utils.book_append_sheet(wb, wsTickets, 'Tiquetes');

      // Hoja 2: Resumen Financiero
      const summaryExport = [
        { Concepto: 'Total Vehículos Atendidos', Valor: totalVehiculos },
        { Concepto: 'Total Ingresos Recaudados (COP)', Valor: totalIngresos },
        { Concepto: 'Total Descuentos Otorgados (COP)', Valor: totalDescuentos },
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
    <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Centro de Reportes Financieros y Operativos</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Generación y descarga de métricas consolidadas a partir de transacciones reales.</p>
        </div>

        <button
          className="btn-primary"
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={handleExportExcel}
          disabled={isExporting}
        >
          <Download size={16} /> {isExporting ? 'Generando...' : 'Exportar a Excel'}
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Vehículos Registrados</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold' }}>{totalVehiculos}</p>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Ingresos Totales (COP)</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${totalIngresos.toLocaleString()} COP</p>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Descuentos / Convenios</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold', color: '#f59e0b' }}>${totalDescuentos.toLocaleString()} COP</p>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Estancia Promedio</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold' }}>{tiempoPromedioMin} min</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="table-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`filter-pill ${filterPeriod === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('todos')}
            >
              Todos los Registros
            </button>
            <button
              className={`filter-pill ${filterPeriod === 'dia' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('dia')}
            >
              Por Día
            </button>
            <button
              className={`filter-pill ${filterPeriod === 'personalizado' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('personalizado')}
            >
              Rango de Fechas
            </button>
          </div>

          {filterPeriod === 'dia' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-body)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Calendar size={16} className="text-muted" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              />
            </div>
          )}

          {filterPeriod === 'personalizado' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '6px 12px' }}
              />
              <span className="text-muted">hasta</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '6px 12px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Detalle */}
      <div className="table-card">
        <div className="section-header" style={{ padding: '24px 24px 0 24px' }}>
          <h2>Transacciones y Tiquetes ({filteredTickets.length})</h2>
        </div>
        <table className="data-table">
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
                  <td className="font-bold text-muted">{t.ticketNumber}</td>
                  <td className="font-bold text-primary">{t.plateNumber}</td>
                  <td className="text-muted">
                    {formatDateTime(t.entryTimeUtc || (t as any).entryTime || (t as any).createdAtUtc || (t as any).entryDate)}
                  </td>
                  <td className="text-muted">
                    {t.exitTimeUtc ? formatDateTime(t.exitTimeUtc || (t as any).exitTime) : 'En parqueadero'}
                  </td>
                  <td>{t.totalDurationMinutes ? `${t.totalDurationMinutes} min` : '--'}</td>
                  <td className="text-right text-muted">${(t.grossAmount || 0).toLocaleString()}</td>
                  <td className="text-right text-muted">${(t.discountAmount || 0).toLocaleString()}</td>
                  <td className="text-right font-bold text-primary">${(t.amountPaid || 0).toLocaleString()} COP</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  {isLoading ? 'Cargando datos...' : 'No hay registros que coincidan con los filtros seleccionados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
