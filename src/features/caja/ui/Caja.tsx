import React, { useState, useEffect } from 'react';
import { Wallet, Users, ArrowUpRight, CheckCircle, XCircle, Download, Calendar, User, Plus, LogOut, X, Building } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cajaService } from '../data/cajaService';
import type { WorkShiftDto } from '../model/CajaContracts';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';
import { authService } from '../../auth/data/authService';
import './Caja.css';

export const Caja: React.FC = () => {
  const { selectedParqueadero, selectedParqueaderoId } = useParqueaderoContext();
  const [activeShift, setActiveShift] = useState<WorkShiftDto | null>(null);
  const [shiftHistory, setShiftHistory] = useState<WorkShiftDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterUser, setFilterUser] = useState('Todos');
  const [filterDate, setFilterDate] = useState('');

  // Modales
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [baseAmount, setBaseAmount] = useState(50000);
  const [actualCashCounted, setActualCashCounted] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedParqueaderoId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [active, history] = await Promise.all([
        cajaService.getActiveShift(),
        cajaService.getHistory(),
      ]);
      setActiveShift(active);
      setShiftHistory(history || []);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los datos de caja.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newShift = await cajaService.openShift({ baseAmount: Number(baseAmount), notes });
      setActiveShift(newShift);
      setIsOpenShiftModalOpen(false);
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'No se pudo abrir el turno.');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      await cajaService.closeShift({
        shiftId: activeShift.shiftId,
        actualCashCounted: Number(actualCashCounted),
        notes,
      });
      setActiveShift(null);
      setIsCloseShiftModalOpen(false);
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'No se pudo cerrar el turno.');
    }
  };

  // Cálculos estadísticos con fallback de propiedades C# y TS
  const totalRecaudadoTurno = activeShift?.totalCashCollected ?? activeShift?.totalCollected ?? 0;
  const baseInicialTurno = activeShift?.baseAmount ?? activeShift?.initialCashAmount ?? 0;
  const totalEnCajaTurno = activeShift?.expectedCash ?? (baseInicialTurno + totalRecaudadoTurno);

  // Filtrado de histórico
  const filteredHistorico = shiftHistory.filter((h) => {
    const matchUser = filterUser === 'Todos' || h.operatorName === filterUser;
    const dateStr = h.startTimeUtc || h.openedAtUtc || h.createdAtUtc || '';
    const shiftDate = dateStr ? dateStr.slice(0, 10) : '';
    const matchDate = filterDate === '' || shiftDate === filterDate;
    return matchUser && matchDate;
  });

  const uniqueOperators = Array.from(new Set(shiftHistory.map((s) => s.operatorName).filter(Boolean)));

  const exportToExcel = () => {
    const dataToExport = filteredHistorico.map((row) => {
      const start = row.startTimeUtc || row.openedAtUtc || row.createdAtUtc;
      const end = row.endTimeUtc || row.closedAtUtc;
      const base = row.baseAmount ?? row.initialCashAmount ?? 0;
      const collected = row.totalCashCollected ?? row.totalCollected ?? 0;
      const counted = row.actualCashCounted ?? row.finalCashAmount ?? 0;
      const isOpen = row.status === 0 || row.status === 'Open';

      return {
        'ID Turno': row.shiftId,
        'Usuario (Operador)': row.operatorName,
        'Fecha Apertura': start ? new Date(start).toLocaleString() : '--',
        'Fecha Cierre': end ? new Date(end).toLocaleString() : 'En curso',
        'Base Inicial (COP)': base,
        'Efectivo Recaudado (COP)': collected,
        'Efectivo Contado (COP)': counted,
        'Estado': isOpen ? 'Abierta' : 'Cerrada',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico Cajas');
    XLSX.writeFile(workbook, `Historico_Cajas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="caja-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div className="caja-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Monitoreo y Control de Caja</h1>
            <span className="badge badge-success" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary-color)', fontSize: '0.82rem', padding: '4px 8px' }}>
              <Building size={12} style={{ marginRight: 4 }} />
              {selectedParqueadero ? selectedParqueadero.name : '🌐 Todos los Parqueaderos'}
            </span>
          </div>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Gestión en tiempo real de apertura, turnos y recaudación del sistema POS.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {!activeShift && authService.hasPermission('shift.open') && (
            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setIsOpenShiftModalOpen(true)}>
              <Plus size={16} /> Abrir Turno de Caja
            </button>
          )}
          {activeShift && authService.hasPermission('shift.close') && (
            <button className="btn-primary" style={{ width: 'auto', background: 'var(--danger-color)' }} onClick={() => {
              setActualCashCounted(totalEnCajaTurno);
              setIsCloseShiftModalOpen(true);
            }}>
              <LogOut size={16} /> Cerrar Turno Actual
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-color)', borderRadius: '8px', color: 'var(--danger-color)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Tarjetas Superiores */}
      <div className="caja-stats-grid">
        <div className="caja-stat-card">
          <div className="caja-stat-icon blue">
            <Users size={24} />
          </div>
          <div className="caja-stat-info">
            <h3>Estado Turno Operador</h3>
            <p className="value" style={{ fontSize: '1.15rem' }}>
              {activeShift ? (
                <span style={{ color: 'var(--success-color)' }}>Abierto ({activeShift.operatorName})</span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>Sin Turno Activo</span>
              )}
            </p>
          </div>
        </div>

        <div className="caja-stat-card">
          <div className="caja-stat-icon green">
            <ArrowUpRight size={24} />
          </div>
          <div className="caja-stat-info">
            <h3>Ingresos Recaudados (Turno)</h3>
            <p className="value">$ {totalRecaudadoTurno.toLocaleString()} COP</p>
          </div>
        </div>

        <div className="caja-stat-card">
          <div className="caja-stat-icon purple">
            <Wallet size={24} />
          </div>
          <div className="caja-stat-info">
            <h3>Total Esperado en Caja</h3>
            <p className="value">$ {totalEnCajaTurno.toLocaleString()} COP</p>
          </div>
        </div>
      </div>

      {/* Tabla de Caja Activa */}
      <div className="table-card">
        <div className="section-header" style={{ padding: '24px 24px 0 24px' }}>
          <h2>Turno de Caja Activo</h2>
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
            {activeShift ? (
              <tr>
                <td className="font-bold">{activeShift.operatorName}</td>
                <td>
                  <span className="caja-status-badge status-open" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                    <CheckCircle size={12} /> Abierta
                  </span>
                </td>
                <td className="text-muted">
                  {activeShift.startTimeUtc || activeShift.openedAtUtc
                    ? new Date(activeShift.startTimeUtc || activeShift.openedAtUtc!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--'}
                </td>
                <td className="text-right text-muted">$ {(activeShift.baseAmount ?? activeShift.initialCashAmount ?? 0).toLocaleString()}</td>
                <td className="text-right text-muted">$ {(activeShift.totalCashCollected ?? activeShift.totalCollected ?? 0).toLocaleString()}</td>
                <td className="text-right font-bold text-primary">
                  $ {totalEnCajaTurno.toLocaleString()} COP
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                  No tienes un turno de caja abierto en este momento. Haz clic en "Abrir Turno de Caja" para comenzar a operar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sección Histórico y Exportación */}
      <div className="table-card">
        <div className="section-header" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Historial Consolidado de Cajas</h2>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filtros */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-body, var(--bg-main))', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <User size={16} className="text-muted" />
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              >
                <option value="Todos">Todos los operadores</option>
                {uniqueOperators.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-body, var(--bg-main))', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Calendar size={16} className="text-muted" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              />
            </div>

            {/* Botón Exportar */}
            {authService.hasPermission('shift.history') && (
              <button className="btn-action primary" onClick={exportToExcel} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Exportar Excel
              </button>
            )}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>FECHA APERTURA</th>
              <th>OPERADOR</th>
              <th>HORARIO</th>
              <th className="text-right">BASE INICIAL</th>
              <th className="text-right">TOTAL RECAUDADO</th>
              <th className="text-right">ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistorico.length > 0 ? (
              filteredHistorico.map((h) => {
                const start = h.startTimeUtc || h.openedAtUtc || h.createdAtUtc;
                const end = h.endTimeUtc || h.closedAtUtc;
                const base = h.baseAmount ?? h.initialCashAmount ?? 0;
                const collected = h.totalCashCollected ?? h.totalCollected ?? 0;
                const isClosed = Boolean(end) || h.status === 1 || h.status === 'Closed';

                return (
                  <tr key={h.shiftId}>
                    <td className="font-bold text-muted">
                      {start ? new Date(start).toLocaleDateString() : '--'}
                    </td>
                    <td className="font-bold">{h.operatorName}</td>
                    <td className="text-muted">
                      {start ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} -{' '}
                      {end ? new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Abierto'}
                    </td>
                    <td className="text-right text-muted">$ {base.toLocaleString()}</td>
                    <td className="text-right font-bold text-primary">$ {collected.toLocaleString()} COP</td>
                    <td>
                      <span className={`caja-status-badge ${isClosed ? 'status-closed' : 'status-open'}`} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        {isClosed ? <XCircle size={12} /> : <CheckCircle size={12} />} {isClosed ? 'Cerrado' : 'Abierto'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  {isLoading ? 'Cargando historial...' : 'No hay registros históricos para los filtros seleccionados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Abrir Turno */}
      {isOpenShiftModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Apertura de Turno de Caja</h3>
              <button className="btn-close-modal" onClick={() => setIsOpenShiftModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleOpenShift}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Base Inicial en Efectivo ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="input-field"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Notas u Observaciones (Opcional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Billetes de 10k y 20k para cambio"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsOpenShiftModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cerrar Turno */}
      {isCloseShiftModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Cierre y Liquidación de Turno</h3>
              <button className="btn-close-modal" onClick={() => setIsCloseShiftModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCloseShift}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: 'var(--bg-body, var(--bg-main))', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 4px 0' }}>Base Inicial: <strong>${baseInicialTurno.toLocaleString()} COP</strong></p>
                  <p style={{ margin: '0 0 4px 0' }}>Total Recaudado: <strong>${totalRecaudadoTurno.toLocaleString()} COP</strong></p>
                  <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 'bold' }}>Esperado en Caja: ${totalEnCajaTurno.toLocaleString()} COP</p>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Efectivo Físico Contado ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={actualCashCounted}
                    onChange={(e) => setActualCashCounted(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Notas de Cierre / Novedades</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Cuadre exacto"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCloseShiftModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', background: 'var(--danger-color)' }}>
                  Cerrar y Liquidar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
