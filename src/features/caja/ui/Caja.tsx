import React, { useState } from 'react';
import { Wallet, Users, ArrowUpRight, CheckCircle, XCircle, Download, Calendar, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import './Caja.css';

interface CajaUsuario {
  id: string;
  usuario: string;
  estado: 'Abierta' | 'Cerrada';
  horaApertura: string;
  baseInicial: number;
  ingresos: number;
}

interface HistoricoTurno {
  id: string;
  usuario: string;
  fecha: string;
  horaApertura: string;
  horaCierre: string;
  baseInicial: number;
  ingresos: number;
  totalRecaudado: number;
}

const mockCajasActivas: CajaUsuario[] = [
  { id: 'CAJ-01', usuario: 'Roberto Gómez', estado: 'Abierta', horaApertura: '06:30 AM', baseInicial: 50000, ingresos: 145000 },
  { id: 'CAJ-02', usuario: 'Andrea Silva', estado: 'Abierta', horaApertura: '02:00 PM', baseInicial: 30000, ingresos: 80000 },
  { id: 'CAJ-03', usuario: 'Carlos Mendoza', estado: 'Cerrada', horaApertura: '--', baseInicial: 0, ingresos: 0 },
];

const mockHistoricoCajas: HistoricoTurno[] = [
  { id: 'HIST-001', usuario: 'Roberto Gómez', fecha: '2023-10-23', horaApertura: '06:00 AM', horaCierre: '02:00 PM', baseInicial: 50000, ingresos: 320000, totalRecaudado: 370000 },
  { id: 'HIST-002', usuario: 'Andrea Silva', fecha: '2023-10-23', horaApertura: '02:00 PM', horaCierre: '10:00 PM', baseInicial: 30000, ingresos: 210000, totalRecaudado: 240000 },
  { id: 'HIST-003', usuario: 'Carlos Mendoza', fecha: '2023-10-23', horaApertura: '10:00 PM', horaCierre: '06:00 AM', baseInicial: 20000, ingresos: 95000, totalRecaudado: 115000 },
  { id: 'HIST-004', usuario: 'Roberto Gómez', fecha: '2023-10-22', horaApertura: '06:00 AM', horaCierre: '02:00 PM', baseInicial: 50000, ingresos: 280000, totalRecaudado: 330000 },
  { id: 'HIST-005', usuario: 'Andrea Silva', fecha: '2023-10-22', horaApertura: '02:00 PM', horaCierre: '10:00 PM', baseInicial: 30000, ingresos: 195000, totalRecaudado: 225000 },
];

export const Caja: React.FC = () => {
  const [filterUser, setFilterUser] = useState('Todos');
  const [filterDate, setFilterDate] = useState('');

  const cajasAbiertas = mockCajasActivas.filter(c => c.estado === 'Abierta');
  const totalRecaudadoGlobal = cajasAbiertas.reduce((acc, c) => acc + c.ingresos, 0);
  const totalEnCajasGlobal = cajasAbiertas.reduce((acc, c) => acc + (c.baseInicial + c.ingresos), 0);

  // Filter historical data
  const filteredHistorico = mockHistoricoCajas.filter(h => {
    const matchUser = filterUser === 'Todos' || h.usuario === filterUser;
    const matchDate = filterDate === '' || h.fecha === filterDate;
    return matchUser && matchDate;
  });

  const exportToExcel = () => {
    // 1. Prepare data for Excel
    const dataToExport = filteredHistorico.map(row => ({
      'ID Turno': row.id,
      'Usuario (Operador)': row.usuario,
      'Fecha': row.fecha,
      'Hora Apertura': row.horaApertura,
      'Hora Cierre': row.horaCierre,
      'Base Inicial (COP)': row.baseInicial,
      'Ingresos POS (COP)': row.ingresos,
      'Total Recaudado (COP)': row.totalRecaudado
    }));

    // 2. Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico Cajas');

    // 3. Generate file and download
    XLSX.writeFile(workbook, `Historico_Cajas_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="caja-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div className="caja-header">
        <h1>Monitoreo de Cajas (Operadores)</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Vista en tiempo real del estado de cajas reportadas por el sistema POS.</p>
      </div>

      {/* Tarjetas Superiores */}
      <div className="caja-stats-grid">
        <div className="caja-stat-card">
          <div className="caja-stat-icon blue">
            <Users size={24} />
          </div>
          <div className="caja-stat-info">
            <h3>Cajas Activas</h3>
            <p className="value">{cajasAbiertas.length} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>/ {mockCajasActivas.length}</span></p>
          </div>
        </div>
        
        <div className="caja-stat-card">
          <div className="caja-stat-icon green">
            <ArrowUpRight size={24} />
          </div>
          <div className="caja-stat-info">
            <h3>Total Ingresos (Turnos Activos)</h3>
            <p className="value">$ {totalRecaudadoGlobal.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="caja-stat-card">
          <div className="caja-stat-icon purple">
            <Wallet size={24} />
          </div>
          <div className="caja-stat-info">
            <h3>Dinero Físico Total Esperado</h3>
            <p className="value">$ {totalEnCajasGlobal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabla de Cajas Activas */}
      <div className="table-card">
        <div className="section-header" style={{ padding: '24px 24px 0 24px' }}>
          <h2>Estado de Cajas por Usuario (Actual)</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>USUARIO (OPERADOR)</th>
              <th>ESTADO</th>
              <th>HORA APERTURA</th>
              <th className="text-right">BASE INICIAL</th>
              <th className="text-right">INGRESOS POS</th>
              <th className="text-right">TOTAL EN CAJA</th>
            </tr>
          </thead>
          <tbody>
            {mockCajasActivas.map((c, i) => (
              <tr key={i}>
                <td className="font-bold">{c.usuario}</td>
                <td>
                  <span className={`caja-status-badge ${c.estado === 'Abierta' ? 'status-open' : 'status-closed'}`} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                    {c.estado === 'Abierta' ? <CheckCircle size={12} /> : <XCircle size={12} />} {c.estado}
                  </span>
                </td>
                <td className="text-muted">{c.horaApertura}</td>
                <td className="text-right text-muted">
                  $ {c.baseInicial.toLocaleString()}
                </td>
                <td className="text-right text-muted">
                  $ {c.ingresos.toLocaleString()}
                </td>
                <td className="text-right font-bold text-primary">
                  $ {(c.baseInicial + c.ingresos).toLocaleString()} COP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nueva Sección: Histórico y Exportación */}
      <div className="table-card">
        <div className="section-header" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Historial Consolidado de Cajas</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filtros */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-body)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <User size={16} className="text-muted" />
              <select 
                value={filterUser} 
                onChange={(e) => setFilterUser(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              >
                <option value="Todos">Todos los usuarios</option>
                <option value="Roberto Gómez">Roberto Gómez</option>
                <option value="Andrea Silva">Andrea Silva</option>
                <option value="Carlos Mendoza">Carlos Mendoza</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-body)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Calendar size={16} className="text-muted" />
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              />
            </div>

            {/* Botón Exportar */}
            <button className="btn-action primary" onClick={exportToExcel} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Exportar Excel
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>USUARIO (OPERADOR)</th>
              <th>APERTURA / CIERRE</th>
              <th className="text-right">BASE INICIAL</th>
              <th className="text-right">INGRESOS POS</th>
              <th className="text-right">TOTAL RECAUDADO</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistorico.length > 0 ? (
              filteredHistorico.map((h, i) => (
                <tr key={i}>
                  <td className="font-bold text-muted">{h.fecha}</td>
                  <td className="font-bold">{h.usuario}</td>
                  <td className="text-muted">{h.horaApertura} - {h.horaCierre}</td>
                  <td className="text-right text-muted">$ {h.baseInicial.toLocaleString()}</td>
                  <td className="text-right text-muted">$ {h.ingresos.toLocaleString()}</td>
                  <td className="text-right font-bold text-primary">$ {h.totalRecaudado.toLocaleString()} COP</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No hay registros históricos para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
