import React, { useState, useEffect } from 'react';
import { Wallet, Users, ArrowUpRight, CheckCircle, XCircle, Download, Calendar, User, Plus, LogOut, X, Building } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cajaService } from '../data/cajaService';
import type { WorkShiftDto } from '../model/CajaContracts';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
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
  const [shiftToClose, setShiftToClose] = useState<WorkShiftDto | null>(null);
  const [baseAmount, setBaseAmount] = useState<number | string>(50000);
  const [actualCashCounted, setActualCashCounted] = useState<number | string>(50000);
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
      const newShift = await cajaService.openShift({ baseAmount: Number(baseAmount) || 0, notes });
      setActiveShift(newShift);
      setIsOpenShiftModalOpen(false);
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'No se pudo abrir el turno.');
    }
  };

  // Cálculos estadísticos con fallback de propiedades C# y TS
  const totalRecaudadoTurno = activeShift?.totalCashCollected ?? activeShift?.totalCollected ?? 0;
  const baseInicialTurno = activeShift?.baseAmount ?? activeShift?.initialCashAmount ?? 0;
  const totalEnCajaTurno = (activeShift?.expectedCash && activeShift.expectedCash > 0)
    ? activeShift.expectedCash
    : (baseInicialTurno + totalRecaudadoTurno);

  const handleOpenCloseShift = (shift: WorkShiftDto) => {
    const base = shift.baseAmount ?? shift.initialCashAmount ?? 0;
    const collected = shift.totalCashCollected ?? shift.totalCollected ?? 0;
    const expected = (shift.expectedCash && shift.expectedCash > 0) ? shift.expectedCash : (base + collected);

    setShiftToClose(shift);
    setActualCashCounted(expected);
    setNotes('');
    setIsCloseShiftModalOpen(true);
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = shiftToClose || activeShift;
    if (!target) return;
    const countedNumber = typeof actualCashCounted === 'string' ? (parseFloat(actualCashCounted) || 0) : (actualCashCounted || 0);
    try {
      await cajaService.closeShift({
        shiftId: target.shiftId,
        actualCashCounted: countedNumber,
        notes,
      });
      if (activeShift?.shiftId === target.shiftId) {
        setActiveShift(null);
      }
      setIsCloseShiftModalOpen(false);
      setShiftToClose(null);
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'No se pudo cerrar el turno.');
    }
  };

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
        'Base Inicial': base,
        'Efectivo Recaudado': collected,
        'Efectivo Contado': counted,
        'Estado': isOpen ? 'Abierta' : 'Cerrada',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico Cajas');
    XLSX.writeFile(workbook, `Historico_Cajas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="caja-container">
      <div className="caja-header">
        <div className="caja-header-info">
          <div className="caja-header-title-row">
            <h1>Monitoreo y Control de Caja</h1>
            <span className="caja-branch-badge">
              <Building size={14} />
              {selectedParqueadero ? selectedParqueadero.name : '🌐 Todos los Parqueaderos'}
            </span>
          </div>
          <p className="caja-subtitle">Gestión en tiempo real de apertura, turnos y recaudación del sistema POS.</p>
        </div>

        <div className="caja-header-actions">
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

      {/* Tarjetas Superiores Elásticas */}
      <div className="caja-stats-grid">
        <div className="caja-stat-card">
          <div className="caja-stat-icon blue">
            <Users size={22} />
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
            <ArrowUpRight size={22} />
          </div>
          <div className="caja-stat-info">
            <h3>Ingresos Recaudados (Turno)</h3>
            <p className="value">$ {totalRecaudadoTurno.toLocaleString()}</p>
          </div>
        </div>

        <div className="caja-stat-card">
          <div className="caja-stat-icon purple">
            <Wallet size={22} />
          </div>
          <div className="caja-stat-info">
            <h3>Total Esperado en Caja</h3>
            <p className="value">$ {totalEnCajaTurno.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabla de Caja Activa con Scroll Protegido */}
      <div className="caja-table-card">
        <div className="caja-table-header">
          <h2>Turno de Caja Activo</h2>
        </div>
        <div className="caja-table-wrapper">
          <table className="caja-table">
            <thead>
              <tr>
                <th>USUARIO (OPERADOR)</th>
                <th className="text-center">ESTADO</th>
                <th>HORA APERTURA</th>
                <th className="text-right">BASE INICIAL</th>
                <th className="text-right">INGRESOS POS</th>
                <th className="text-right">TOTAL EN CAJA</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {activeShift ? (
                <tr>
                  <td style={{ fontWeight: 700 }}>{activeShift.operatorName}</td>
                  <td className="text-center">
                    <span className="caja-status-badge status-open">
                      <CheckCircle size={12} /> Abierta
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {activeShift.startTimeUtc || activeShift.openedAtUtc
                      ? new Date(activeShift.startTimeUtc || activeShift.openedAtUtc!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </td>
                  <td className="text-right" style={{ color: 'var(--text-secondary)' }}>$ {(activeShift.baseAmount ?? activeShift.initialCashAmount ?? 0).toLocaleString()}</td>
                  <td className="text-right" style={{ color: 'var(--text-secondary)' }}>$ {(activeShift.totalCashCollected ?? activeShift.totalCollected ?? 0).toLocaleString()}</td>
                  <td className="text-right" style={{ fontWeight: 800, color: 'var(--primary-color)' }}>
                    $ {totalEnCajaTurno.toLocaleString()}
                  </td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                    {(authService.hasPermission('shift.close') || authService.hasPermission('shifts.close')) && (
                      <button
                        type="button"
                        className="btn-action"
                        style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onClick={() => handleOpenCloseShift(activeShift)}
                        title="Cerrar este turno"
                      >
                        <LogOut size={13} /> Cerrar Caja
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No tienes un turno de caja abierto en este momento. Haz clic en "Abrir Turno de Caja" para comenzar a operar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección Histórico y Exportación con Scroll Protegido */}
      <div className="caja-table-card">
        <div className="caja-table-header">
          <h2>Historial Consolidado de Cajas</h2>

          <div className="caja-filters-group">
            {/* Filtros */}
            <div className="caja-filter-box">
              <User size={15} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                aria-label="Filtrar por operador"
              >
                <option value="Todos">Todos los operadores</option>
                {uniqueOperators.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div className="caja-filter-box">
              <Calendar size={15} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Filtrar por fecha"
              />
            </div>

            {/* Botón Exportar */}
            {authService.hasPermission('shift.history') && (
              <button className="btn-action primary" onClick={exportToExcel} style={{ padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Download size={15} /> Exportar Excel
              </button>
            )}
          </div>
        </div>

        <div className="caja-table-wrapper">
          <table className="caja-table">
            <thead>
              <tr>
                <th>FECHA APERTURA</th>
                <th>OPERADOR</th>
                <th>HORARIO</th>
                <th className="text-right">BASE INICIAL</th>
                <th className="text-right">TOTAL RECAUDADO</th>
                <th className="text-center">ESTADO</th>
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
                      <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {start ? new Date(start).toLocaleDateString() : '--'}
                      </td>
                      <td style={{ fontWeight: 700 }}>{h.operatorName}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {start ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} -{' '}
                        {end ? new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Abierto'}
                      </td>
                      <td className="text-right" style={{ color: 'var(--text-secondary)' }}>$ {base.toLocaleString()}</td>
                      <td className="text-right" style={{ fontWeight: 800, color: 'var(--primary-color)' }}>$ {collected.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`caja-status-badge ${isClosed ? 'status-closed' : 'status-open'}`}>
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
      </div>

      {/* Modal Abrir Turno */}
      {isOpenShiftModalOpen && (
        <ModalPortal>
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
                  <label>Base Inicial en Efectivo ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="input-field"
                    placeholder="Ej. 50000"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
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
        </ModalPortal>
      )}

      {/* Modal Cerrar Turno */}
      {isCloseShiftModalOpen && (() => {
        const target = shiftToClose || activeShift;
        const targetBase = target ? (target.baseAmount ?? target.initialCashAmount ?? 0) : baseInicialTurno;
        const targetCollected = target ? (target.totalCashCollected ?? target.totalCollected ?? 0) : totalRecaudadoTurno;
        const targetExpected = (target?.expectedCash && target.expectedCash > 0) ? target.expectedCash : (targetBase + targetCollected);
        const targetOperator = target?.operatorName || 'Operador';
        const countedNumber = typeof actualCashCounted === 'string' ? (parseFloat(actualCashCounted) || 0) : (actualCashCounted || 0);
        const difference = countedNumber - targetExpected;

        return (
          <ModalPortal>
            <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3>Cierre y Liquidación de Turno</h3>
                <button className="btn-close-modal" onClick={() => { setIsCloseShiftModalOpen(false); setShiftToClose(null); }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCloseShift}>
                <div className="modal-body">
                  <div style={{ padding: '14px', background: 'var(--bg-card, #ffffff)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Operador:</span>
                      <strong>{targetOperator}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Base Inicial:</span>
                      <strong>${targetBase.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Recaudado:</span>
                      <strong style={{ color: 'var(--primary-color)' }}>${targetCollected.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Esperado en Caja:</span>
                      <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>${targetExpected.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '14px' }}>
                    <label>Efectivo Físico Contado ($) *</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="input-field"
                      placeholder="Ej. 50000"
                      value={actualCashCounted}
                      onChange={(e) => setActualCashCounted(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Indicador reactivo de Cuadre de Caja */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: difference === 0 ? 'rgba(16, 185, 129, 0.1)' : difference > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${difference === 0 ? 'rgba(16, 185, 129, 0.3)' : difference > 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: difference === 0 ? '#059669' : difference > 0 ? '#2563eb' : '#dc2626' }}>
                      {difference === 0 ? '✓ Cuadre Exacto' : difference > 0 ? '↑ Sobrante en Caja' : '↓ Faltante en Caja'}:
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: difference === 0 ? '#059669' : difference > 0 ? '#2563eb' : '#dc2626' }}>
                      {difference === 0 ? '$0' : `${difference > 0 ? '+' : '-'}$${Math.abs(difference).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
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
                  <button type="button" className="btn-cancel" onClick={() => { setIsCloseShiftModalOpen(false); setShiftToClose(null); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto', background: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
                    Cerrar y Liquidar Turno
                  </button>
                </div>
              </form>
            </div>
          </div>
          </ModalPortal>
        );
      })()}
    </div>
  );
};
