import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Star, Image as ImageIcon, Trash2, Building, Key, CheckSquare, Square, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import type { ParqueaderoDto, SaveParqueaderoDto, ItemizedPermissionsDto } from '../model/ParqueaderosContracts';
import { parqueaderosService } from '../data/parqueaderosService';
import { tarifasService } from '../data/tarifasService';
import { usuariosService } from '../data/usuariosService';
import { conveniosService } from '../data/conveniosService';
import { vehiculosConfigService } from '../data/vehiculosConfigService';
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

  // Modal Asignar Permisos
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [targetParqueadero, setTargetParqueadero] = useState<ParqueaderoDto | null>(null);
  const [inheritedFromId, setInheritedFromId] = useState<number | ''>('');

  // Listas Reales de los 5 Módulos
  const [tarifasItems, setTarifasItems] = useState<ModuleItem[]>([]);
  const [usuariosItems, setUsuariosItems] = useState<ModuleItem[]>([]);
  const [conveniosItems, setConveniosItems] = useState<ModuleItem[]>([]);
  const [vehiculosItems, setVehiculosItems] = useState<ModuleItem[]>([]);
  const [mediosPagoItems, setMediosPagoItems] = useState<ModuleItem[]>([]);
  const [isLoadingModuleItems, setIsLoadingModuleItems] = useState(false);

  // Estado de ítems seleccionados por módulo
  const [selectedItemized, setSelectedItemized] = useState<ItemizedPermissionsDto>({
    tarifas: [],
    usuarios: [],
    convenios: [],
    vehiculos: [],
    mediosPago: [],
  });

  // Módulos expandidos en el modal
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    tarifas: true,
    usuarios: true,
    convenios: true,
    vehiculos: true,
    mediosPago: true,
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

  // Carga de ítems reales de los 5 módulos para el modal "Asignar Permisos"
  const handleOpenPermissionsModal = async (p: ParqueaderoDto) => {
    setTargetParqueadero(p);
    setInheritedFromId(p.inheritedFromId || '');
    setIsLoadingModuleItems(true);
    setIsPermissionsModalOpen(true);

    try {
      const [tList, uList, cList, vList, mList] = await Promise.all([
        tarifasService.getAllRates(),
        usuariosService.getUsers(),
        conveniosService.getAllAgreements(),
        vehiculosConfigService.getConfigs(),
        mediosPagoService.getPaymentMethods(),
      ]);

      // Normalización Tarifas
      const mappedTarifas: ModuleItem[] = tList.length > 0
        ? tList.map((r) => ({ id: r.rateId || r.vehicleType, name: (r as any).displayName || `Tarifa ${r.vehicleType}`, detail: `$${r.hourRate || r.minuteRate}/hr` }))
        : [
            { id: 'T-01', name: 'Tarifa Automóvil / Sedán', detail: '$3.000 / hora' },
            { id: 'T-02', name: 'Tarifa Motocicleta', detail: '$1.500 / hora' },
            { id: 'T-03', name: 'Tarifa Camioneta / SUV', detail: '$3.500 / hora' },
            { id: 'T-04', name: 'Tarifa Furgón / Minibús', detail: '$4.500 / hora' },
            { id: 'T-05', name: 'Tarifa Vehículo Pesado', detail: '$6.000 / hora' },
          ];

      // Normalización Usuarios
      const mappedUsuarios: ModuleItem[] = uList.length > 0
        ? uList.map((u) => ({ id: u.id, name: u.fullName || u.name || u.username || `Usuario #${u.id}`, detail: `${u.email} (${u.userRoleDto?.name || u.role || 'Operador'})` }))
        : [
            { id: 1, name: 'Sofía Ramírez', detail: 'sofia@parkcontrol.cl (Supervisor)' },
            { id: 2, name: 'Carlos Mendoza', detail: 'carlos@parkcontrol.cl (Operador)' },
          ];

      // Normalización Convenios
      const mappedConvenios: ModuleItem[] = cList.length > 0
        ? cList.map((c, idx) => ({ id: c.agreementId || `CONV-${idx}`, name: c.name, detail: (c as any).description || `${c.discountPercentage || 0}% Descuento` }))
        : [
            { id: 'C-01', name: 'Convenio Centro Comercial Plaza', detail: '50% Descuento en Parqueo' },
            { id: 'C-02', name: 'Convenio Gimnasio SmartFit', detail: '2 Horas Gratis de Parqueo' },
            { id: 'C-03', name: 'Convenio CineMark', detail: '3 Horas Gratis con Boleta' },
            { id: 'C-04', name: 'Convenio Supermercado Éxito', detail: '30% Descuento por Compras' },
          ];

      // Normalización Vehículos
      const mappedVehiculos: ModuleItem[] = vList.length > 0
        ? vList.map((v) => ({ id: v.id || v.category, name: v.category, detail: `Zonas: ${v.allowedZones.join(', ')}` }))
        : [
            { id: 'VCFG-01', name: 'Automóvil / Sedán', detail: 'Zona A, Zona B' },
            { id: 'VCFG-02', name: 'Motocicleta', detail: 'Zona D (Moto)' },
            { id: 'VCFG-03', name: 'Camioneta / SUV', detail: 'Zona A, Zona B' },
            { id: 'VCFG-04', name: 'Furgón / Minibús', detail: 'Zona B, Zona C' },
            { id: 'VCFG-05', name: 'Vehículo Pesado / Camión', detail: 'Zona C (Carga)' },
          ];

      // Normalización Medios de Pago
      const mappedMediosPago: ModuleItem[] = mList.length > 0
        ? mList.map((m, idx) => ({ id: m.id || `MP-${idx}`, name: m.name, detail: (m as any).description || (m.status ? 'Habilitado' : 'Inactivo') }))
        : [
            { id: 'MP-01', name: 'Efectivo (Cash)', detail: 'Pago en caja física' },
            { id: 'MP-02', name: 'Tarjeta de Crédito', detail: 'Visa / Mastercard Datáfono' },
            { id: 'MP-03', name: 'Tarjeta de Débito', detail: 'Redbanc / Débito' },
            { id: 'MP-04', name: 'Transferencia / PSE / Nequi', detail: 'Cobro digital QR' },
          ];

      setTarifasItems(mappedTarifas);
      setUsuariosItems(mappedUsuarios);
      setConveniosItems(mappedConvenios);
      setVehiculosItems(mappedVehiculos);
      setMediosPagoItems(mappedMediosPago);

      // Cargar ítems ya guardados o seleccionar todos por defecto
      if (p.permissions?.itemized) {
        setSelectedItemized(p.permissions.itemized);
      } else {
        setSelectedItemized({
          tarifas: mappedTarifas.map((i) => i.id),
          usuarios: mappedUsuarios.map((i) => Number(i.id)),
          convenios: mappedConvenios.map((i) => i.id),
          vehiculos: mappedVehiculos.map((i) => String(i.id)),
          mediosPago: mappedMediosPago.map((i) => i.id),
        });
      }
    } catch (err) {
      console.error('Error cargando ítems de módulos:', err);
    } finally {
      setIsLoadingModuleItems(false);
    }
  };

  const handleToggleItem = (moduleKey: keyof ItemizedPermissionsDto, itemId: string | number) => {
    setSelectedItemized((prev) => {
      const currentList = prev[moduleKey] as any[];
      const exists = currentList.includes(itemId);
      const updatedList = exists
        ? currentList.filter((id) => id !== itemId)
        : [...currentList, itemId];
      return { ...prev, [moduleKey]: updatedList };
    });
  };

  const handleToggleModuleAll = (moduleKey: keyof ItemizedPermissionsDto, itemsList: ModuleItem[]) => {
    setSelectedItemized((prev) => {
      const currentList = prev[moduleKey] as any[];
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
        vehiculos: vehiculosItems.map((i) => String(i.id)),
        mediosPago: mediosPagoItems.map((i) => i.id),
      });
    } else {
      setSelectedItemized({
        tarifas: [],
        usuarios: [],
        convenios: [],
        vehiculos: [],
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
          tarifas: selectedItemized.tarifas.length > 0,
          usuarios: selectedItemized.usuarios.length > 0,
          convenios: selectedItemized.convenios.length > 0,
          vehiculos: selectedItemized.vehiculos.length > 0,
          mediosPago: selectedItemized.mediosPago.length > 0,
          itemized: selectedItemized,
        },
        inheritedFromId: inheritedFromId !== '' ? Number(inheritedFromId) : null,
      });
      setIsPermissionsModalOpen(false);
      setTargetParqueadero(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar los permisos del parqueadero.');
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
          <p>Administra los parqueaderos del sistema, establece la imagen principal y asigna los permisos por ítems de cada módulo.</p>
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
            <th>PERMISOS ACTIVOS</th>
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
                  (itemized.vehiculos?.length || 0) +
                  (itemized.mediosPago?.length || 0)
                : 5;

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
                      <Key size={12} style={{ marginRight: 4 }} /> {totalItemsSelected} Ítems Asignados
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {authService.hasPermission('settings.parqueaderos.assign_permissions') && (
                        <button
                          className="btn-action primary"
                          style={{ background: 'var(--primary-color, #07665e)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                          onClick={() => handleOpenPermissionsModal(p)}
                        >
                          <Key size={13} style={{ marginRight: 4 }} /> Asignar Permisos
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

      {/* Modal Crear / Editar Parqueadero (Sin usuarios enrolados) */}
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

      {/* Modal Asignar Permisos con Ítems Seleccionables por Módulo */}
      {isPermissionsModalOpen && targetParqueadero && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '88vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} style={{ color: 'var(--primary-color, #07665e)' }} />
                <h3>Asignar Permisos: {targetParqueadero.name}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsPermissionsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', gap: '1.25rem' }}>
                {/* Opción Superior: Heredar Permisos De */}
                <div className="form-group" style={{ background: 'rgba(7, 102, 94, 0.05)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(7, 102, 94, 0.2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#07665e', fontWeight: 700 }}>
                    <Copy size={15} /> Heredar permisos de:
                  </label>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 8px 0' }}>
                    Seleccione un parqueadero existente para copiar automáticamente todas sus opciones e ítems seleccionados:
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
                    Lista de Módulos y Opciones Seleccionables
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
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Cargando lista de opciones...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Renderizador de Secciones de Módulos con Lista de Ítems */}
                    {[
                      { key: 'tarifas' as const, title: '💲 Módulo 1: Tarifas y Precios', items: tarifasItems },
                      { key: 'usuarios' as const, title: '👥 Módulo 2: Usuarios y Operadores', items: usuariosItems },
                      { key: 'convenios' as const, title: '📄 Módulo 3: Convenios Comerciales', items: conveniosItems },
                      { key: 'vehiculos' as const, title: '🚗 Módulo 4: Tipos de Vehículo', items: vehiculosItems },
                      { key: 'mediosPago' as const, title: '💳 Módulo 5: Medios de Pago', items: mediosPagoItems },
                    ].map((mod) => {
                      const selectedCount = (selectedItemized[mod.key] || []).length;
                      const isExpanded = expandedModules[mod.key] ?? true;
                      const allSelected = mod.items.length > 0 && mod.items.every((i) => selectedItemized[mod.key].includes(i.id as never));

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
                          {/* Cabecera del Módulo */}
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
                                {selectedCount} / {mod.items.length} Seleccionados
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
                              {allSelected ? 'Desmarcar Módulo' : 'Marcar Módulo'}
                            </button>
                          </div>

                          {/* Lista Seleccionable del Módulo */}
                          {isExpanded && (
                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-card, #ffffff)' }}>
                              {mod.items.length > 0 ? (
                                mod.items.map((item) => {
                                  const isChecked = selectedItemized[mod.key].includes(item.id as never);
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => handleToggleItem(mod.key, item.id)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        background: isChecked ? 'rgba(7, 102, 94, 0.06)' : 'transparent',
                                        border: isChecked ? '1px solid rgba(7, 102, 94, 0.25)' : '1px solid transparent',
                                        transition: 'all 0.12s ease',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
                                        />
                                        <div>
                                          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                            {item.name}
                                          </span>
                                          {item.detail && (
                                            <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '8px' }}>
                                              ({item.detail})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div style={{ fontSize: '0.82rem', color: '#94a3b8', padding: '8px', textAlign: 'center' }}>
                                  No hay ítems registrados en este módulo.
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
                  Guardar Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
