import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { resolucionesService } from '../data/resolucionesService';
import type { BillingResolutionDto, SaveBillingResolutionDto } from '../model/ResolucionesContracts';
import { authService } from '../../../features/auth/data/authService';

const COMMON_DOCUMENT_TYPES = [
  'Documento equivalente electrónico del tiquete de máquina registradora con sistema P.O.S.',
  'Factura de Venta Nacional',
  'Factura Electrónica de Venta',
  'Documento Soporte en Adquisiciones Efectuadas a No Obligados a Facturar',
  'Nota Crédito Electrónica',
  'Nota Débito Electrónica',
];

export const ResolucionesTab: React.FC = () => {
  const [resolutions, setResolutions] = useState<BillingResolutionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResolution, setEditingResolution] = useState<SaveBillingResolutionDto | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCustomDocType, setIsCustomDocType] = useState(false);

  const loadResolutions = async () => {
    setIsLoading(true);
    try {
      const data = await resolucionesService.getAllResolutions();
      setResolutions(data);
    } catch (err) {
      console.error('Error al cargar resoluciones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResolutions();
  }, []);

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    setEditingResolution({
      name: '',
      documentType: COMMON_DOCUMENT_TYPES[0],
      prefix: '',
      resolutionNumber: '',
      fromNumber: 1,
      toNumber: 10000,
      currentNumber: 1,
      validFrom: today,
      validTo: nextYearStr,
      technicalKey: '',
      isActive: true,
    });
    setCurrentId(null);
    setIsCustomDocType(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: BillingResolutionDto) => {
    const isCustom = !COMMON_DOCUMENT_TYPES.includes(res.documentType);
    setIsCustomDocType(isCustom);
    setEditingResolution({
      resolutionId: res.resolutionId,
      branchId: res.branchId,
      name: res.name,
      documentType: res.documentType,
      prefix: res.prefix,
      resolutionNumber: res.resolutionNumber,
      fromNumber: res.fromNumber,
      toNumber: res.toNumber,
      currentNumber: res.currentNumber,
      validFrom: res.validFrom ? res.validFrom.split('T')[0] : '',
      validTo: res.validTo ? res.validTo.split('T')[0] : '',
      technicalKey: res.technicalKey || '',
      isActive: res.isActive,
    });
    setCurrentId(res.resolutionId);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResolution) return;

    if (!editingResolution.name.trim() || !editingResolution.prefix.trim() || !editingResolution.resolutionNumber.trim()) {
      setErrorMsg('El nombre, prefijo y número de resolución son obligatorios.');
      return;
    }

    if (Number(editingResolution.fromNumber) > Number(editingResolution.toNumber)) {
      setErrorMsg('El rango inicial (Desde) no puede ser superior al rango final (Hasta).');
      return;
    }

    try {
      if (currentId) {
        await resolucionesService.updateResolution(currentId, editingResolution);
      } else {
        await resolucionesService.createResolution(editingResolution);
      }
      setIsModalOpen(false);
      setEditingResolution(null);
      setCurrentId(null);
      loadResolutions();
    } catch (err: any) {
      console.error('Error al guardar resolución:', err);
      setErrorMsg(err.message || 'Error al guardar los datos de la resolución.');
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de desactivar la resolución "${name}"?`)) {
      return;
    }

    try {
      await resolucionesService.deactivateResolution(id);
      loadResolutions();
    } catch (err) {
      console.error('Error al desactivar resolución:', err);
    }
  };

  const filteredResolutions = resolutions.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.prefix.toLowerCase().includes(term) ||
      r.resolutionNumber.toLowerCase().includes(term) ||
      r.documentType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="settings-section-card">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="section-header-titles">
          <h2>Resoluciones</h2>
          <p>Parametrización de autorizaciones DIAN para numeración consecutiva de tiquetes POS y facturación electrónica.</p>
        </div>
        {authService.hasPermission('settings.roles.manage') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Agregar nuevo
          </button>
        )}
      </div>

      {/* Barra de Búsqueda */}
      <div style={{ margin: '14px 0 18px 0', maxWidth: '380px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          className="input-field"
          style={{ paddingLeft: '36px', height: '40px', fontSize: '0.88rem' }}
          placeholder="Buscar resolución, prefijo o número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de Resoluciones */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>NOMBRE RESOLUCIÓN</th>
              <th>TIPO DE DOCUMENTO</th>
              <th>PREFIJO</th>
              <th>NÚMERO</th>
              <th className="text-right">DESDE</th>
              <th className="text-right">HASTA</th>
              <th>FECHA DESDE</th>
              <th>FECHA HASTA</th>
              <th>ESTADO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredResolutions.length > 0 ? (
              filteredResolutions.map((res) => (
                <tr key={res.resolutionId}>
                  <td className="font-bold text-primary">{res.name}</td>
                  <td style={{ maxWidth: '280px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {res.documentType}
                  </td>
                  <td>
                    <span
                      style={{
                        background: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {res.prefix}
                    </span>
                  </td>
                  <td className="font-bold">{res.resolutionNumber}</td>
                  <td className="text-right font-bold text-muted">{res.fromNumber.toLocaleString()}</td>
                  <td className="text-right font-bold text-muted">{res.toNumber.toLocaleString()}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {res.validFrom ? res.validFrom.split('T')[0] : '--'}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {res.validTo ? res.validTo.split('T')[0] : '--'}
                  </td>
                  <td>
                    <span className={`badge ${res.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {res.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button className="btn-action primary" onClick={() => handleOpenEdit(res)} title="Editar Resolución">
                        <Edit2 size={14} />
                      </button>
                      {res.isActive && (
                        <button
                          className="btn-action danger"
                          onClick={() => handleDeactivate(res.resolutionId, res.name)}
                          title="Desactivar Resolución"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                  {isLoading ? 'Cargando resoluciones de facturación...' : 'No se encontraron resoluciones registradas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Resolución */}
      {isModalOpen && editingResolution && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(7, 102, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="#07665e" />
                </div>
                <h3>{currentId ? `Editar Resolución (${editingResolution.name})` : 'Nueva Resolución de Facturación'}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Nombre de la Resolución *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. FACTURA POS, FV, FACTURACIÓN ELECTRÓNICA..."
                    value={editingResolution.name}
                    onChange={(e) => setEditingResolution({ ...editingResolution, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Tipo de Documento *</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setIsCustomDocType(!isCustomDocType)}
                    >
                      {isCustomDocType ? '← Seleccionar de la lista' : '✎ Escribir personalizado'}
                    </button>
                  </div>
                  {isCustomDocType ? (
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Escribe el tipo de documento oficial..."
                      value={editingResolution.documentType}
                      onChange={(e) => setEditingResolution({ ...editingResolution, documentType: e.target.value })}
                      required
                    />
                  ) : (
                    <select
                      className="input-field"
                      value={editingResolution.documentType}
                      onChange={(e) => setEditingResolution({ ...editingResolution, documentType: e.target.value })}
                      required
                    >
                      {COMMON_DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Prefijo *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej. POS, FV, FVM"
                      value={editingResolution.prefix}
                      onChange={(e) => setEditingResolution({ ...editingResolution, prefix: e.target.value.toUpperCase() })}
                      required
                      maxLength={10}
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Autorización DIAN *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej. 18764113848904"
                      value={editingResolution.resolutionNumber}
                      onChange={(e) => setEditingResolution({ ...editingResolution, resolutionNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Rango Inicial (Desde) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="1"
                      min={1}
                      value={editingResolution.fromNumber}
                      onChange={(e) => setEditingResolution({ ...editingResolution, fromNumber: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Rango Final (Hasta) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="10000"
                      min={1}
                      value={editingResolution.toNumber}
                      onChange={(e) => setEditingResolution({ ...editingResolution, toNumber: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Fecha de Vigencia Desde *</label>
                    <input
                      type="date"
                      className="input-field"
                      value={editingResolution.validFrom}
                      onChange={(e) => setEditingResolution({ ...editingResolution, validFrom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Vigencia Hasta *</label>
                    <input
                      type="date"
                      className="input-field"
                      value={editingResolution.validTo}
                      onChange={(e) => setEditingResolution({ ...editingResolution, validTo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Clave Técnica DIAN (Opcional - Factura Electrónica)</label>
                  <textarea
                    className="input-field"
                    style={{ minHeight: '60px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                    placeholder="Pega la clave técnica provista en el portal de la DIAN para generación de CUFE..."
                    value={editingResolution.technicalKey || ''}
                    onChange={(e) => setEditingResolution({ ...editingResolution, technicalKey: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingResolution.isActive}
                      onChange={(e) => setEditingResolution({ ...editingResolution, isActive: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Resolución activa y disponible para emisión</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  <CheckCircle size={16} /> {currentId ? 'Actualizar Resolución' : 'Guardar Resolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
