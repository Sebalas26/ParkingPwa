import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Shield, Key, CheckSquare, Square, Search, ChevronDown, ChevronRight, Check } from 'lucide-react';
import type { RoleDto, SaveRoleDto, ActionDto, ModuleDto } from '../model/RolesContracts';
import { rolesService } from '../data/rolesService';
import { authService } from '../../auth/data/authService';

export const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allModules, setAllModules] = useState<ModuleDto[]>([]);
  const [allActions, setAllActions] = useState<ActionDto[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<number, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal Crear / Editar Rol
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<SaveRoleDto> | null>(null);

  // Modal Configuración de Permisos
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<RoleDto | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesData, modulesData, actionsData] = await Promise.all([
        rolesService.getRoles(),
        rolesService.getModules(),
        rolesService.getActions(),
      ]);

      setRoles(rolesData || []);
      setAllModules(modulesData || []);
      setAllActions(actionsData || []);

      // Cargar permisos asignados a cada rol
      const permsMap: Record<number, number[]> = {};
      await Promise.all(
        (rolesData || []).map(async (r) => {
          const roleId = r.idUserRol ?? r.id ?? 1;
          const perms = await rolesService.getRolePermissions(roleId);
          permsMap[roleId] = perms.map((p) => p.actionId);
        })
      );
      setRolePermissionsMap(permsMap);
    } catch (err) {
      console.error('Error al cargar datos de roles y permisos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateRole = () => {
    setEditingRole({
      roleName: '',
      isActive: true,
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RoleDto) => {
    setEditingRole({
      idUserRol: role.idUserRol ?? role.id,
      roleName: role.roleName || role.role || '',
      isActive: role.isActive,
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.roleName?.trim()) return;

    try {
      await rolesService.saveOrEditRole({
        idUserRol: editingRole.idUserRol,
        roleName: editingRole.roleName.trim(),
        isActive: editingRole.isActive ?? true,
      });
      setIsRoleModalOpen(false);
      setEditingRole(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el rol.');
    }
  };

  const handleOpenPermissionsModal = (role: RoleDto) => {
    const roleId = role.idUserRol ?? role.id ?? 1;
    setTargetRole(role);
    setSelectedActionIds(rolePermissionsMap[roleId] || []);
    setSearchTerm('');

    // Abrir todos los módulos con acciones por defecto
    const initialExpanded: Record<number, boolean> = {};
    allModules.forEach((m) => {
      initialExpanded[m.id] = true;
    });
    setExpandedModules(initialExpanded);
    setIsPermissionsModalOpen(true);
  };

  const handleToggleAction = (actionId: number) => {
    setSelectedActionIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleToggleModuleAll = (moduleActionIds: number[]) => {
    const allSelected = moduleActionIds.length > 0 && moduleActionIds.every((id) => selectedActionIds.includes(id));
    if (allSelected) {
      setSelectedActionIds((prev) => prev.filter((id) => !moduleActionIds.includes(id)));
    } else {
      setSelectedActionIds((prev) => Array.from(new Set([...prev, ...moduleActionIds])));
    }
  };

  const handleGlobalSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedActionIds(allActions.map((a) => a.id));
    } else {
      setSelectedActionIds([]);
    }
  };

  const toggleModuleAccordion = (moduleId: number) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleSavePermissions = async () => {
    if (!targetRole) return;
    const roleId = targetRole.idUserRol ?? targetRole.id ?? 1;

    setIsSavingPermissions(true);
    try {
      await rolesService.assignRolePermissions(roleId, selectedActionIds);
      setRolePermissionsMap((prev) => ({ ...prev, [roleId]: selectedActionIds }));
      setIsPermissionsModalOpen(false);
      setTargetRole(null);
      alert('Permisos del rol actualizados correctamente.');
    } catch (err: any) {
      alert(err?.message || 'Error al guardar los permisos del rol.');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Agrupación de acciones por módulo
  const filteredActions = allActions.filter((a) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      a.slug.toLowerCase().includes(term) ||
      (a.module?.name || '').toLowerCase().includes(term)
    );
  });

  // Módulos con sus acciones correspondientes
  const groupedModules = allModules
    .map((mod) => {
      const actions = filteredActions.filter((a) => (a.moduleId ?? a.module?.id) === mod.id);
      return {
        module: mod,
        actions,
      };
    })
    .filter((g) => g.actions.length > 0);

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Roles y Matriz de Permisos</h2>
          <p>Administra los roles del sistema y configura detalladamente los permisos operativos y de acceso a cada módulo.</p>
        </div>
        {(authService.hasPermission('settings.roles.manage') || authService.hasPermission('roles.manage') || authService.hasPermission('settings.usuarios.manage')) && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreateRole}>
            <Plus size={16} /> Crear Rol
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>NOMBRE DEL ROL</th>
            <th>PERMISOS ASIGNADOS</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {roles.length > 0 ? (
            roles.map((r) => {
              const roleId = r.idUserRol ?? r.id ?? 1;
              const assignedCount = rolePermissionsMap[roleId]?.length || 0;
              const roleTitle = r.roleName || r.role || r.name || `Rol #${roleId}`;

              return (
                <tr key={roleId}>
                  <td className="font-bold text-muted">#{roleId}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(7, 102, 94, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary-color, #07665e)',
                        }}
                      >
                        <Shield size={16} />
                      </div>
                      <span className="font-bold">{roleTitle}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: assignedCount > 0 ? 'rgba(7, 102, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: assignedCount > 0 ? '#07665e' : '#64748b',
                        fontWeight: 600,
                      }}
                    >
                      <Key size={12} style={{ marginRight: 4 }} />
                      {assignedCount} / {allActions.length} Permisos Asignados
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {r.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        className="btn-action primary"
                        style={{ background: 'var(--primary-color, #07665e)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        onClick={() => handleOpenPermissionsModal(r)}
                      >
                        <Key size={13} style={{ marginRight: 4 }} /> Configurar Permisos
                      </button>
                      <button className="btn-action primary" onClick={() => handleOpenEditRole(r)}>
                        <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando roles desde la API...' : 'No se encontraron roles registrados en el sistema.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Rol */}
      {isRoleModalOpen && editingRole && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{editingRole.idUserRol ? `Editar Rol (#${editingRole.idUserRol})` : 'Crear Nuevo Rol'}</h3>
              <button className="btn-close-modal" onClick={() => setIsRoleModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Rol</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Auditor / Supervisor de Patio"
                    value={editingRole.roleName || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, roleName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    className="input-field"
                    value={editingRole.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingRole({ ...editingRole, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsRoleModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Matriz de Permisos por Rol */}
      {isPermissionsModalOpen && targetRole && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card" style={{ maxWidth: '780px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} style={{ color: 'var(--primary-color, #07665e)' }} />
                <h3>Configurar Permisos: {targetRole.roleName || targetRole.role}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsPermissionsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', gap: '1rem', paddingBottom: '1.5rem' }}>
              {/* Barra de Búsqueda y Filtro */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar permiso, acción o slug (ej: checkin, shift, print)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleGlobalSelectAll(true)}
                    style={{
                      background: '#07665e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckSquare size={13} /> Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGlobalSelectAll(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '6px',
                      padding: '7px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Square size={13} /> Desmarcar Todos
                  </button>
                </div>
              </div>

              {/* Contador de Permisos Seleccionados */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary, #f8fafc)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total de permisos activos para este rol:
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {selectedActionIds.length} / {allActions.length} Permisos Seleccionados
                </span>
              </div>

              {/* Lista de Módulos y Acciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedModules.length > 0 ? (
                  groupedModules.map(({ module: mod, actions }) => {
                    const moduleActionIds = actions.map((a) => a.id);
                    const selectedInModuleCount = actions.filter((a) => selectedActionIds.includes(a.id)).length;
                    const isAllModuleSelected = actions.length > 0 && selectedInModuleCount === actions.length;
                    const isExpanded = expandedModules[mod.id] ?? true;

                    return (
                      <div
                        key={mod.id}
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
                            onClick={() => toggleModuleAccordion(mod.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              📁 {mod.name}
                            </span>
                            <span
                              className="badge badge-success"
                              style={{
                                fontSize: '0.72rem',
                                background: selectedInModuleCount > 0 ? 'rgba(7, 102, 94, 0.12)' : 'rgba(100,116,139,0.1)',
                                color: selectedInModuleCount > 0 ? '#07665e' : '#64748b',
                              }}
                            >
                              {selectedInModuleCount} / {actions.length} Habilitados
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleModuleAll(moduleActionIds);
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: isAllModuleSelected ? '#ef4444' : '#07665e',
                            }}
                          >
                            {isAllModuleSelected ? 'Desmarcar Módulo' : 'Marcar Módulo'}
                          </button>
                        </div>

                        {/* Lista de Acciones del Módulo */}
                        {isExpanded && (
                          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-card, #ffffff)' }}>
                            {actions.map((action) => {
                              const isChecked = selectedActionIds.includes(action.id);

                              return (
                                <div
                                  key={action.id}
                                  onClick={() => handleToggleAction(action.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: isChecked ? 'rgba(7, 102, 94, 0.06)' : 'transparent',
                                    border: isChecked ? '1px solid rgba(7, 102, 94, 0.25)' : '1px solid transparent',
                                    transition: 'all 0.12s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
                                    />
                                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                      {action.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No se encontraron acciones que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setIsPermissionsModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleSavePermissions}
                disabled={isSavingPermissions}
              >
                <Check size={16} /> {isSavingPermissions ? 'Guardando...' : 'Guardar Permisos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
