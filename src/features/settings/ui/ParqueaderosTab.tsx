import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Star, Image as ImageIcon, Trash2, Building, SlidersHorizontal, CheckSquare, Square, Copy, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import type { ParqueaderoDto, SaveParqueaderoDto, ItemizedPermissionsDto } from '../model/ParqueaderosContracts';
import type { VehicleRateDto, UpdateVehicleRateDto } from '../model/TarifasContracts';
import { parqueaderosService } from '../data/parqueaderosService';
import { tarifasService } from '../data/tarifasService';
import { usuariosService } from '../data/usuariosService';
import { conveniosService } from '../data/conveniosService';
import { mediosPagoService } from '../data/mediosPagoService';
import { authService } from '../../auth/data/authService';

interface ModuleItem {
  id: string | number;
  name: string;
  detail?: string;
}

export const ParqueaderosTab: React.FC = () => {
  const [parqueaderos, setParqueaderos] = useState<ParqueaderoDto[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParqueadero, setEditingParqueadero] = useState<Partial<SaveParqueaderoDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Parametrización
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [targetParqueadero, setTargetParqueadero] = useState<ParqueaderoDto | null>(null);
  const [inheritedFromId, setInheritedFromId] = useState<number | ''>('');

  // Listas Reales de los 4 Módulos
  const [tarifasItems, setTarifasItems] = useState<ModuleItem[]>([]);
  const [rawRates, setRawRates] = useState<VehicleRateDto[]>([]);
  const [usuariosItems, setUsuariosItems] = useState<ModuleItem[]>([]);
  const [conveniosItems, setConveniosItems] = useState<ModuleItem[]>([]);
  const [mediosPagoItems, setMediosPagoItems] = useState<ModuleItem[]>([]);
  const [isLoadingModuleItems, setIsLoadingModuleItems] = useState(false);

  // Modal para Configurar Tarifa por Categoría de Vehículo
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VehicleRateDto | null>(null);
  const [rateFormData, setRateFormData] = useState<UpdateVehicleRateDto>({
    hourRate: 0,
    minuteRate: 0,
    fullDayRate: 0,
    gracePeriodMinutes: 0,
    displayName: '',
  });

  // Estado de ítems seleccionados por módulo
  const [selectedItemized, setSelectedItemized] = useState<ItemizedPermissionsDto>({
    tarifas: [],
    usuarios: [],
    convenios: [],
    mediosPago: [],
  });

  // Módulos expandidos en el modal (Solo el primero abierto por defecto)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    tarifas: true,
    usuarios: false,
    convenios: false,
    mediosPago: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await parqueaderosService.getParqueaderos();
      setParqueaderos(data || []);
    } catch (err) {
      console.error('Error al cargar parqueaderos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingParqueadero({
      name: '',
      description: '',
      imageUrl: '',
      isMainImage: parqueaderos.length === 0,
      isActive: true,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (p: ParqueaderoDto) => {
    setEditingParqueadero({
      id: p.id,
      name: p.name,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      isMainImage: p.isMainImage,
      isActive: p.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editingParqueadero && typeof reader.result === 'string') {
          setEditingParqueadero({ ...editingParqueadero, imageUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParqueadero) return;

    if (!editingParqueadero.name || !editingParqueadero.name.trim()) {
      alert('Por favor ingrese el nombre del parqueadero.');
      return;
    }

    try {
      await parqueaderosService.saveOrEditParqueadero({
        id: editingParqueadero.id,
        name: editingParqueadero.name.trim(),
        description: editingParqueadero.description || '',
        imageUrl: editingParqueadero.imageUrl || '',
        isMainImage: !!editingParqueadero.isMainImage,
        isActive: editingParqueadero.isActive ?? true,
      });
      setIsEditModalOpen(false);
      setEditingParqueadero(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el parqueadero.');
    }
  };

  // Carga de ítems reales de los 4 módulos para el modal "Parametrización"
  const handleOpenPermissionsModal = async (p: ParqueaderoDto) => {
    setTargetParqueadero(p);
    setInheritedFromId(p.inheritedFromId || '');
    setIsLoadingModuleItems(true);
    setExpandedModules({
      tarifas: true,
      usuarios: false,
      convenios: false,
      mediosPago: false,
    });
    setIsPermissionsModalOpen(true);

    try {
      const [tList, uList, cList, mList] = await Promise.all([
        tarifasService.getAllRates(),
        usuariosService.getUsers(),
        conveniosService.getAllAgreements(),
        mediosPagoService.getPaymentMethods(),
      ]);

      setRawRates(tList || []);

      // Normalización Tarifas por Categoría de Vehículo desde la API
      const mappedTarifas: ModuleItem[] = (tList || []).map((r) => ({
        id: r.rateId || r.vehicleType,
        name: r.displayName || `Categoría ${r.vehicleType}`,
        detail: `$${(r.hourRate || 0).toLocaleString()} / hora (Máx $${(r.fullDayRate || 0).toLocaleString()})`,
      }));

      // Normalización Usuarios desde la API
      const mappedUsuarios: ModuleItem[] = (uList || []).map((u) => ({
        id: u.id,
        name: u.fullName || u.name || u.username || `Usuario #${u.id}`,
        detail: `${u.email} (${u.userRoleDto?.roleName || u.userRoleDto?.role || u.role || 'Operador'})`,
      }));

      // Normalización Convenios desde la API
      const mappedConvenios: ModuleItem[] = (cList || []).map((c, idx) => ({
        id: c.agreementId || `CONV-${idx}`,
        name: c.name,
        detail: c.discountPercentage ? `${c.discountPercentage}% Descuento` : (c.discountFixedAmount ? `$${(c.discountFixedAmount).toLocaleString()} COP Descuento` : 'Convenio Comercial'),
      }));

      // Normalización Medios de Pago desde la API
      const mappedMediosPago: ModuleItem[] = (mList || []).map((m, idx) => ({
        id: m.id || `MP-${idx}`,
        name: m.name,
        detail: (m.isActive ?? (m.status === true || m.status === 'Activo')) ? 'Habilitado en Caja' : 'Inactivo',
      }));

      setTarifasItems(mappedTarifas);
      setUsuariosItems(mappedUsuarios);
      setConveniosItems(mappedConvenios);
      setMediosPagoItems(mappedMediosPago);

      // Cargar ítems ya guardados o seleccionar todos por defecto
      if (p.permissions?.itemized) {
        setSelectedItemized({
          tarifas: p.permissions.itemized.tarifas || [],
          usuarios: p.permissions.itemized.usuarios || [],
          convenios: p.permissions.itemized.convenios || [],
          mediosPago: p.permissions.itemized.mediosPago || [],
        });
      } else {
        setSelectedItemized({
          tarifas: mappedTarifas.map((i) => i.id),
          usuarios: mappedUsuarios.map((i) => Number(i.id)),
          convenios: mappedConvenios.map((i) => i.id),
          mediosPago: mappedMediosPago.map((i) => i.id),
        });
      }
    } catch (err) {
      console.error('Error cargando ítems de módulos:', err);
    } finally {
      setIsLoadingModuleItems(false);
    }
  };

  const handleOpenEditRate = (rate: VehicleRateDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRate(rate);
    setRateFormData({
      hourRate: rate.hourRate || 0,
      minuteRate: rate.minuteRate || 0,
      fullDayRate: rate.fullDayRate || 0,
      gracePeriodMinutes: rate.gracePeriodMinutes || 0,
      displayName: rate.displayName || '',
    });
    setIsRateModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    try {
      await tarifasService.updateRate(editingRate.rateId, rateFormData);
      setIsRateModalOpen(false);
      setEditingRate(null);

      // Recargar lista de tarifas actualizada
      const updatedRates = await tarifasService.getAllRates();
      setRawRates(updatedRates || []);
      const mappedTarifas: ModuleItem[] = (updatedRates || []).map((r) => ({
        id: r.rateId || r.vehicleType,
        name: r.displayName || `Categoría ${r.vehicleType}`,
        detail: `$${(r.hourRate || 0).toLocaleString()} / hora (Máx $${(r.fullDayRate || 0).toLocaleString()})`,
      }));
      setTarifasItems(mappedTarifas);
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar la tarifa.');
    }
  };

  const handleToggleItem = (moduleKey: keyof ItemizedPermissionsDto, itemId: string | number) => {
    setSelectedItemized((prev) => {
      const currentList = (prev[moduleKey] || []) as any[];
      const exists = currentList.includes(itemId);
      const updatedList = exists
        ? currentList.filter((id) => id !== itemId)
        : [...currentList, itemId];
      return { ...prev, [moduleKey]: updatedList };
    });
  };

  const handleToggleModuleAll = (moduleKey: keyof ItemizedPermissionsDto, itemsList: ModuleItem[]) => {
    setSelectedItemized((prev) => {
      const currentList = (prev[moduleKey] || []) as any[];
      const allSelected = itemsList.every((i) => currentList.includes(i.id));
      const updatedList = allSelected ? [] : itemsList.map((i) => i.id);
      return { ...prev, [moduleKey]: updatedList };
    });
  };

  const handleGlobalSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedItemized({
        tarifas: tarifasItems.map((i) => i.id),
        usuarios: usuariosItems.map((i) => Number(i.id)),
        convenios: conveniosItems.map((i) => i.id),
        mediosPago: mediosPagoItems.map((i) => i.id),
      });
    } else {
      setSelectedItemized({
        tarifas: [],
        usuarios: [],
        convenios: [],
        mediosPago: [],
      });
    }
  };

  const handleInheritFromParking = (sourceIdStr: string) => {
    if (!sourceIdStr) {
      setInheritedFromId('');
      return;
    }
    const sourceId = Number(sourceIdStr);
    setInheritedFromId(sourceId);

    const sourceParking = parqueaderos.find((p) => p.id === sourceId);
    if (sourceParking && sourceParking.permissions?.itemized) {
      setSelectedItemized(sourceParking.permissions.itemized);
    } else {
      handleGlobalSelectAll(true);
    }
  };

  const toggleAccordion = (moduleKey: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetParqueadero) return;

    try {
      await parqueaderosService.saveOrEditParqueadero({
        id: targetParqueadero.id,
        name: targetParqueadero.name,
        description: targetParqueadero.description || '',
        imageUrl: targetParqueadero.imageUrl || '',
        isMainImage: targetParqueadero.isMainImage,
        isActive: targetParqueadero.isActive,
        permissions: {
          tarifas: (selectedItemized.tarifas || []).length > 0,
          usuarios: (selectedItemized.usuarios || []).length > 0,
          convenios: (selectedItemized.convenios || []).length > 0,
          mediosPago: (selectedItemized.mediosPago || []).length > 0,
          itemized: selectedItemized,
        },
        inheritedFromId: inheritedFromId !== '' ? Number(inheritedFromId) : null,
      });
      setIsPermissionsModalOpen(false);
      setTargetParqueadero(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar la parametrización del parqueadero.');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (confirm('¿Está seguro de desactivar este parqueadero?')) {
      await parqueaderosService.deactivateParqueadero(id);
      await loadData();
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Parqueaderos</h2>
          <p>Administra los parqueaderos del sistema, establece la imagen principal y parametriza tarifas por tipo de vehículo, usuarios, convenios y medios de pago.</p>
        </div>
        {authService.hasPermission('settings.parqueaderos.manage') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Parqueadero
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>PARQUEADERO</th>
            <th>DESCRIPCIÓN</th>
            <th>IMAGEN PRINCIPAL</th>
            <th>PARAMETRIZACIÓN</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {parqueaderos.length > 0 ? (
            parqueaderos.map((p) => {
              const itemized = p.permissions?.itemized;
              const totalItemsSelected = itemized
                ? (itemized.tarifas?.length || 0) +
                  (itemized.usuarios?.length || 0) +
                  (itemized.convenios?.length || 0) +
                  (itemized.mediosPago?.length || 0)
                : 4;

              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid var(--border-color, #e2e8f0)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            background: 'rgba(7, 102, 94, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-color, #07665e)',
                          }}
                        >
                          <Building size={20} />
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>ID: #{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted" style={{ maxWidth: '240px' }}>
                    {p.description || 'Sin descripción'}
                  </td>
                  <td>
                    {p.isMainImage ? (
                      <span className="badge badge-success" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                        <Star size={12} style={{ marginRight: 4, fill: '#ca8a04' }} /> Principal
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>Secundaria</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ background: 'rgba(7, 102, 94, 0.1)', color: '#07665e' }}>
                      <SlidersHorizontal size={12} style={{ marginRight: 4 }} /> {totalItemsSelected} Parámetros Asignados
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {(authService.hasPermission('settings.parqueaderos.assign_permissions') || authService.hasPermission('settings.parqueaderos.manage')) && (
                        <button
                          className="btn-action primary"
                          style={{ background: 'var(--primary-color, #07665e)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                          onClick={() => handleOpenPermissionsModal(p)}
                        >
                          <SlidersHorizontal size={13} style={{ marginRight: 4 }} /> Parametrización
                        </button>
                      )}
                      {authService.hasPermission('settings.parqueaderos.manage') && (
                        <>
                          <button className="btn-action primary" onClick={() => handleOpenEdit(p)}>
                            <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                          </button>
                          {p.isActive && (
                            <button className="btn-action danger" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }} onClick={() => handleDeactivate(p.id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando parqueaderos...' : 'No se encontraron parqueaderos registrados.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Parqueadero */}
      {isEditModalOpen && editingParqueadero && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>{editingParqueadero.id ? `Editar Parqueadero (#${editingParqueadero.id})` : 'Crear Nuevo Parqueadero'}</h3>
              <button className="btn-close-modal" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Parqueadero</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Parqueadero Centro Histórico"
                    value={editingParqueadero.name || ''}
                    onChange={(e) => setEditingParqueadero({ ...editingParqueadero, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Ingrese detalles del parqueadero, cupos, observaciones..."
                    value={editingParqueadero.description || ''}
                    onChange={(e) => setEditingParqueadero({ ...editingParqueadero, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Imagen del Parqueadero</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {editingParqueadero.imageUrl ? (
                      <img
                        src={editingParqueadero.imageUrl}
                        alt="Vista previa"
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid var(--primary-color, #07665e)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                          border: '2px dashed var(--border-color, #cbd5e1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                        }}
                      >
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ display: 'none' }}
                        id="parking-img-upload"
                      />
                      <label
                        htmlFor="parking-img-upload"
                        className="btn-action primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <ImageIcon size={14} style={{ marginRight: 6 }} /> Subir Imagen
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="O pegue una URL de imagen..."
                        style={{ marginTop: '8px', fontSize: '0.85rem' }}
                        value={editingParqueadero.imageUrl || ''}
                        onChange={(e) => setEditingParqueadero({ ...editingParqueadero, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="isMainImageCheck"
                      checked={!!editingParqueadero.isMainImage}
                      onChange={(e) => setEditingParqueadero({ ...editingParqueadero, isMainImage: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isMainImageCheck" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                      ⭐ Establecer esta imagen como la imagen principal del parqueadero
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Estado del Parqueadero</label>
                  <select
                    className="input-field"
                    value={editingParqueadero.isActive ? 'Activo' : 'Inactivo'}
                    onChange={(e) => setEditingParqueadero({ ...editingParqueadero, isActive: e.target.value === 'Activo' })}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Parqueadero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Parametrización con Ítems Seleccionables y Configuración de Tarifas */}
      {isPermissionsModalOpen && targetParqueadero && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '680px', maxHeight: '88vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} style={{ color: 'var(--primary-color, #07665e)' }} />
                <h3>Parametrización: {targetParqueadero.name}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsPermissionsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', gap: '1.25rem' }}>
                {/* Opción Superior: Heredar Parametrización De */}
                <div className="form-group" style={{ background: 'rgba(7, 102, 94, 0.05)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(7, 102, 94, 0.2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#07665e', fontWeight: 700 }}>
                    <Copy size={15} /> Heredar parametrización de:
                  </label>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 8px 0' }}>
                    Seleccione un parqueadero existente para copiar automáticamente todas sus opciones e ítems parametrizados:
                  </p>
                  <select
                    className="input-field"
                    value={inheritedFromId}
                    onChange={(e) => handleInheritFromParking(e.target.value)}
                  >
                    <option value="">-- Sin herencia (Configuración manual) --</option>
                    {parqueaderos
                      .filter((p) => p.id !== targetParqueadero.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          🏢 {p.name} {p.isMainImage ? '⭐ (Principal)' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Acciones Globales: Marcar Todo / Desmarcar Todo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Opciones y Parámetros Disponibles
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleGlobalSelectAll(true)}
                      style={{
                        background: '#07665e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckSquare size={13} /> Marcar Todo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGlobalSelectAll(false)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Square size={13} /> Desmarcar Todo
                    </button>
                  </div>
                </div>

                {isLoadingModuleItems ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Cargando parámetros desde la API...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Renderizador de Secciones: Tarifas por Categoría de Vehículo, Usuarios, Convenios y Medios de Pago */}
                    {[
                      { key: 'tarifas' as const, title: '💲 Tarifas y Precios por Categoría de Vehículo', items: tarifasItems },
                      { key: 'usuarios' as const, title: '👥 Usuarios y Operadores', items: usuariosItems },
                      { key: 'convenios' as const, title: '📄 Convenios Comerciales', items: conveniosItems },
                      { key: 'mediosPago' as const, title: '💳 Medios de Pago', items: mediosPagoItems },
                    ].map((mod) => {
                      const selectedCount = (selectedItemized[mod.key] || []).length;
                      const isExpanded = expandedModules[mod.key] ?? false;
                      const allSelected = mod.items.length > 0 && mod.items.every((i) => (selectedItemized[mod.key] || []).includes(i.id as never));

                      return (
                        <div
                          key={mod.key}
                          style={{
                            border: '1px solid var(--border-color, #e2e8f0)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: 'var(--bg-card, #ffffff)',
                          }}
                        >
                          {/* Cabecera de la Sección */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--table-header-bg, #f8fafc)',
                              cursor: 'pointer',
                              borderBottom: isExpanded ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                            }}
                          >
                            <div
                              onClick={() => toggleAccordion(mod.key)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                {mod.title}
                              </span>
                              <span className="badge badge-success" style={{ fontSize: '0.72rem', background: selectedCount > 0 ? 'rgba(7, 102, 94, 0.12)' : 'rgba(100,116,139,0.1)', color: selectedCount > 0 ? '#07665e' : '#64748b' }}>
                                {selectedCount} / {mod.items.length} Habilitados
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleModuleAll(mod.key, mod.items);
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                color: allSelected ? '#ef4444' : '#07665e',
                              }}
                            >
                              {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                            </button>
                          </div>

                          {/* Lista Seleccionable de la Sección */}
                          {isExpanded && (
                            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card, #ffffff)' }}>
                              {mod.items.length > 0 ? (
                                mod.items.map((item) => {
                                  const isChecked = (selectedItemized[mod.key] || []).includes(item.id as never);
                                  const rateObj = mod.key === 'tarifas' ? rawRates.find(r => r.rateId === item.id || r.vehicleType === item.id) : null;

                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => handleToggleItem(mod.key, item.id)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: isChecked ? 'rgba(7, 102, 94, 0.06)' : 'var(--bg-card, #ffffff)',
                                        border: isChecked ? '1px solid rgba(7, 102, 94, 0.3)' : '1px solid var(--border-color, #e2e8f0)',
                                        transition: 'all 0.12s ease',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          style={{ width: '18px', height: '18px', pointerEvents: 'none' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {mod.key === 'tarifas' ? '🚗' : mod.key === 'usuarios' ? '👤' : mod.key === 'convenios' ? '📄' : '💳'} {item.name}
                                          </div>
                                          {rateObj ? (
                                            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                              <span><strong>Hora:</strong> ${(rateObj.hourRate || 0).toLocaleString()}</span>
                                              <span>•</span>
                                              <span><strong>Minuto:</strong> ${(rateObj.minuteRate || 0).toLocaleString()}</span>
                                              <span>•</span>
                                              <span><strong>Día Máx:</strong> ${(rateObj.fullDayRate || 0).toLocaleString()}</span>
                                              <span>•</span>
                                              <span><strong>Gracia:</strong> {rateObj.gracePeriodMinutes || 0} min</span>
                                            </div>
                                          ) : (
                                            item.detail && (
                                              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'inline-block' }}>
                                                {item.detail}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {/* Botón para Configurar Tarifas directamente */}
                                      {rateObj && (
                                        <button
                                          type="button"
                                          className="btn-action primary"
                                          onClick={(e) => handleOpenEditRate(rateObj, e)}
                                          style={{
                                            padding: '6px 12px',
                                            fontSize: '0.78rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            background: '#07665e',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            marginLeft: '12px',
                                          }}
                                        >
                                          <Edit2 size={12} /> Configurar Tarifa
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div style={{ fontSize: '0.82rem', color: '#94a3b8', padding: '8px', textAlign: 'center' }}>
                                  No hay parámetros registrados en esta sección.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsPermissionsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Parametrización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Configurar Tarifa por Categoría de Vehículo */}
      {isRateModalOpen && editingRate && (
        <div className="modal-overlay" style={{ zIndex: 10050, background: 'rgba(15, 23, 42, 0.75)' }}>
          <div className="modal-card" style={{ maxWidth: '480px', zIndex: 10051, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} style={{ color: 'var(--primary-color, #07665e)' }} />
                <h3>Configurar Tarifa: {editingRate.displayName || `Vehículo ${editingRate.vehicleType}`}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsRateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Categoría / Tipo de Vehículo</label>
                  <input
                    type="text"
                    className="input-field"
                    value={rateFormData.displayName || ''}
                    onChange={(e) => setRateFormData({ ...rateFormData, displayName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Valor Hora ($ COP)</label>
                    <input
                      type="number"
                      step="50"
                      className="input-field"
                      value={rateFormData.hourRate}
                      onChange={(e) => setRateFormData({ ...rateFormData, hourRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor Minuto ($ COP)</label>
                    <input
                      type="number"
                      step="1"
                      className="input-field"
                      value={rateFormData.minuteRate}
                      onChange={(e) => setRateFormData({ ...rateFormData, minuteRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Tarifa Máxima Día ($)</label>
                    <input
                      type="number"
                      step="100"
                      className="input-field"
                      value={rateFormData.fullDayRate}
                      onChange={(e) => setRateFormData({ ...rateFormData, fullDayRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiempo de Gracia (Minutos)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={rateFormData.gracePeriodMinutes}
                      onChange={(e) => setRateFormData({ ...rateFormData, gracePeriodMinutes: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsRateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
