import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Shield, Trash2, IdCard, Search, Loader2, AlertTriangle } from 'lucide-react';
import type { UserDto, SaveUserDto, GetIdentificationTypeDto, GetUserRoleDto } from '../model/UsuariosContracts';
import type { BranchDto } from '../model/BranchesContracts';
import { usuariosService } from '../data/usuariosService';
import { branchesService } from '../data/branchesService';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';

const getDocTypeLabel = (identification?: string, name?: string) => {
  const code = (identification || '').trim().toUpperCase();
  if (name && name.trim().toUpperCase() !== code && name.trim() !== '') {
    return `${code} - ${name}`;
  }
  switch (code) {
    case 'CC':
      return 'CC - Cédula de Ciudadanía';
    case 'CE':
      return 'CE - Cédula de Extranjería';
    case 'NIT':
      return 'NIT - Número de Identificación Tributaria';
    case 'PAS':
      return 'PAS - Pasaporte';
    case 'PEP':
      return 'PEP - Permiso Especial de Permanencia';
    case 'TI':
      return 'TI - Tarjeta de Identidad';
    default:
      return code || 'Documento';
  }
};

export const UsuariosTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [identTypes, setIdentTypes] = useState<GetIdentificationTypeDto[]>([]);
  const [allUserRoles, setAllUserRoles] = useState<GetUserRoleDto[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<GetUserRoleDto[]>([]);
  const [allBranches, setAllBranches] = useState<BranchDto[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [initialAssignedBranchIds, setInitialAssignedBranchIds] = useState<number[]>([]);
  const [branchSearch, setBranchSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<SaveUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Estado para el modal de confirmación de eliminación con loader
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, typesData, rolesData, branchesData] = await Promise.all([
        usuariosService.getUsers(),
        usuariosService.getIdentificationTypes(),
        usuariosService.getUserRoles(),
        branchesService.getAll(),
      ]);
      setUsuarios(usersData || []);
      setIdentTypes(typesData || []);

      const currentUser = authService.getCurrentUser();
      const isUserSuperAdmin = currentUser?.isSuperAdmin === true;

      const filteredRoles = (rolesData || []).filter((r) => {
        const name = (r.roleName || r.role || r.name || '').trim().toLowerCase();
        const isSuperAdmin = name === 'super administrador' || name === 'super admin' || name === 'superadmin';
        return !isSuperAdmin || isUserSuperAdmin;
      });

      setAllUserRoles(filteredRoles);
      setAssignableRoles(filteredRoles);
      setAllBranches(branchesData || []);
    } catch (err) {
      console.error('Error al cargar datos de usuarios y sedes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const currentUser = authService.getCurrentUser();
    const defaultTypeId = identTypes.length > 0 ? (identTypes[0].id || 1) : 1;
    const defaultRoleId = allUserRoles.length > 0 ? (allUserRoles[0].idUserRol ?? allUserRoles[0].id ?? 2) : 2;

    setEditingUsuario({
      companyId: currentUser?.companyId,
      identificationTypeId: defaultTypeId,
      identificationNumber: '',
      firstName: '',
      middleName: '',
      firstSurname: '',
      secondLastName: '',
      fullName: '',
      username: '',
      email: '',
      password: '',
      userRoleId: defaultRoleId,
      isActive: true,
    });
    setSelectedBranchIds([]);
    setInitialAssignedBranchIds([]);
    setBranchSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (u: UserDto) => {
    const currentUser = authService.getCurrentUser();
    const isUserActive = u.isActive ?? (u.status === true || u.status === 'Activo' || u.status === 'Active');
    const roleId = u.userRoleId || u.userRoleDto?.idUserRol || u.userRoleDto?.id || 2;
    setEditingUsuario({
      id: u.id,
      companyId: u.companyId || currentUser?.companyId,
      identificationTypeId: u.identificationTypeId || 1,
      identificationNumber: u.identificationNumber || '',
      firstName: u.firstName || '',
      middleName: u.middleName || '',
      firstSurname: u.firstSurname || '',
      secondLastName: u.secondLastName || '',
      fullName: u.fullName || u.name || `${u.firstName || ''} ${u.firstSurname || ''}`.trim(),
      username: u.username || u.email || '',
      email: u.email || '',
      password: '', // Dejar vacío para no sobreescribir si no se cambia
      userRoleId: roleId,
      isActive: isUserActive,
    });
    setBranchSearch('');

    // Cargar sedes asignadas al usuario
    try {
      const userBranches = await branchesService.getByUser(u.id);
      const branchIds = (userBranches || []).map((b) => b.id);
      setSelectedBranchIds(branchIds);
      setInitialAssignedBranchIds(branchIds);
    } catch {
      setSelectedBranchIds([]);
      setInitialAssignedBranchIds([]);
    }

    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;

    const currentUser = authService.getCurrentUser();
    const computedFullName = editingUsuario.fullName.trim() ||
      `${editingUsuario.firstName} ${editingUsuario.middleName || ''} ${editingUsuario.firstSurname} ${editingUsuario.secondLastName || ''}`.replace(/\s+/g, ' ').trim();

    setIsSavingUser(true);
    try {
      const payload: SaveUserDto = {
        ...editingUsuario,
        companyId: editingUsuario.companyId || currentUser?.companyId,
        fullName: computedFullName,
        username: editingUsuario.username.trim() || editingUsuario.email.trim(),
      };

      const savedUser = await usuariosService.saveOrEditUser(payload);
      const targetUserId = savedUser?.id || editingUsuario.id;

      const selectedRole = allUserRoles.find((r) => (r.idUserRol ?? r.id) === editingUsuario.userRoleId);
      const isRoleAdmin = selectedRole?.roleName?.toLowerCase().includes('admin') || editingUsuario.userRoleId === 1;

      // Si el rol NO es Administrador, sincronizar asignaciones de sedes
      if (targetUserId && !isRoleAdmin) {
        // Sedes a asignar
        const toAssign = selectedBranchIds.filter((bId) => !initialAssignedBranchIds.includes(bId));
        // Sedes a desasignar
        const toUnassign = initialAssignedBranchIds.filter((bId) => !selectedBranchIds.includes(bId));

        await Promise.all([
          ...toAssign.map((branchId, idx) =>
            branchesService.assignUser({ branchId, userId: targetUserId, isDefault: idx === 0 })
          ),
          ...toUnassign.map((branchId) =>
            branchesService.unassignUser({ branchId, userId: targetUserId })
          ),
        ]);
      }

      setIsModalOpen(false);
      setEditingUsuario(null);
      const freshUsers = await usuariosService.getUsers();
      setUsuarios(freshUsers || []);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el usuario en la base de datos.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    const targetId = userToDelete.id;

    // 1. Eliminación reactiva instantánea en la UI
    setUsuarios((prev) => prev.filter((u) => u.id !== targetId));

    try {
      await usuariosService.deleteUser(targetId);
      const freshUsers = await usuariosService.getUsers();
      setUsuarios(freshUsers || []);
      setUserToDelete(null);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el usuario de la base de datos.');
      await loadData();
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Usuarios</h2>
          <p>Administra los operadores, supervisores y administradores con acceso al sistema.</p>
        </div>
        {authService.hasPermission('users.create') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Usuario
          </button>
        )}
      </div>

      <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th>NOMBRE COMPLETO</th>
              <th>DOCUMENTO</th>
              <th>USUARIO / CORREO</th>
              <th>ROL</th>
              <th>ESTADO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map((u) => {
                const docTypeName = u.identificationTypeDto?.name || u.identificationTypeDto?.identification || 'CC';
                const roleTitle = u.userRoleDto?.roleName || u.roleName || u.role || (u.userRoleId === 1 ? 'Administrador' : 'Operador');
                const isActive = u.isActive ?? (u.status === true || u.status === 'Activo' || u.status === 'Active');

                return (
                  <tr key={u.id}>
                    <td className="font-bold">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                        <IdCard size={16} color="#07665e" />
                        <span>{u.fullName || `${u.firstName || ''} ${u.firstSurname || ''}`.trim() || u.username}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        <strong>{docTypeName}:</strong> {u.identificationNumber || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>@{u.username}</span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge ${u.userRoleId === 1 || roleTitle.toLowerCase().includes('admin') ? 'badge-primary' : 'badge-info'}`}>
                        <Shield size={12} style={{ marginRight: '4px' }} />
                        {roleTitle}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {authService.hasPermission('users.edit') && (
                          <button className="btn-icon" onClick={() => handleOpenEdit(u)} title="Editar Usuario">
                            <Edit2 size={16} />
                          </button>
                        )}
                        {authService.hasPermission('users.edit') && (
                          <button className="btn-icon danger" onClick={() => setUserToDelete(u)} title="Eliminar Usuario de la BD">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-muted">
                  {isLoading ? 'Cargando usuarios...' : 'No hay usuarios registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Usuario */}
      {isModalOpen && editingUsuario && (
        <ModalPortal>
          <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingUsuario.id ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
              <button className="btn-close" onClick={() => !isSavingUser && setIsModalOpen(false)} disabled={isSavingUser}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
              <div className="modal-body">
                {/* 1. DOCUMENTO DE IDENTIDAD */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo Doc.</label>
                    <select
                      className="input-field"
                      value={editingUsuario.identificationTypeId}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, identificationTypeId: Number(e.target.value) })}
                      required
                      disabled={isSavingUser}
                    >
                      {identTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {getDocTypeLabel(t.identification, t.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Número de Identificación</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: 1020304050"
                      value={editingUsuario.identificationNumber}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, identificationNumber: e.target.value })}
                      required
                      disabled={isSavingUser}
                    />
                  </div>
                </div>

                {/* 2. DATOS PERSONALES */}
                <h4 style={{ fontSize: '0.82rem', color: '#07665e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  2. Datos Personales
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Primer Nombre *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: Carlos"
                      value={editingUsuario.firstName}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, firstName: e.target.value })}
                      required
                      disabled={isSavingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>Segundo Nombre</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Opcional"
                      value={editingUsuario.middleName || ''}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, middleName: e.target.value })}
                      disabled={isSavingUser}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Primer Apellido *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: Gómez"
                      value={editingUsuario.firstSurname}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, firstSurname: e.target.value })}
                      required
                      disabled={isSavingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>Segundo Apellido</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Opcional"
                      value={editingUsuario.secondLastName || ''}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, secondLastName: e.target.value })}
                      disabled={isSavingUser}
                    />
                  </div>
                </div>

                {/* 3. CREDENCIALES Y PERMISOS */}
                <h4 style={{ fontSize: '0.82rem', color: '#07665e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  3. Credenciales y Permisos
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre de Usuario *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: cgomez"
                      value={editingUsuario.username}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, username: e.target.value })}
                      required
                      disabled={isSavingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico *</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="cgomez@parqueadero.com"
                      value={editingUsuario.email}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, email: e.target.value })}
                      required
                      disabled={isSavingUser}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{editingUsuario.id ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial *'}</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••••••"
                      value={editingUsuario.password || ''}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, password: e.target.value })}
                      required={!editingUsuario.id}
                      disabled={isSavingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rol del Sistema *</label>
                    <select
                      className="input-field"
                      value={editingUsuario.userRoleId}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, userRoleId: Number(e.target.value) })}
                      required
                      disabled={isSavingUser}
                    >
                      {(() => {
                        const isEditingAdmin = editingUsuario.userRoleId === 1;
                        const roleOptions = isEditingAdmin ? allUserRoles : assignableRoles;
                        return roleOptions.map((r) => {
                          const roleId = r.idUserRol ?? r.id ?? 2;
                          const roleTitle = r.roleName || r.role || r.name || 'Operador';
                          return (
                            <option key={roleId} value={roleId}>
                              {roleTitle}
                            </option>
                          );
                        });
                      })()}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label>Estado de Cuenta</label>
                  <select
                    className="input-field"
                    value={editingUsuario.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingUsuario({ ...editingUsuario, isActive: e.target.value === 'true' })}
                    disabled={isSavingUser}
                  >
                    <option value="true">Activo (Habilitado para operar)</option>
                    <option value="false">Inactivo (Acceso bloqueado)</option>
                  </select>
                </div>

                {/* 4. ASIGNACIÓN DE SEDES (PARQUEADEROS) */}
                <h4 style={{ fontSize: '0.82rem', color: '#07665e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  4. Sedes Autorizadas (Parqueaderos)
                </h4>

                {(() => {
                  const selectedRole = allUserRoles.find((r) => (r.idUserRol ?? r.id) === editingUsuario.userRoleId);
                  const isRoleAdmin = selectedRole?.roleName?.toLowerCase().includes('admin') || editingUsuario.userRoleId === 1;
                  return isRoleAdmin ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.84rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={16} color="#16a34a" />
                      <span>
                        <strong>Acceso Global a la Empresa:</strong> Los usuarios con rol <strong>Administrador</strong> tienen acceso automático a todas las sedes de la empresa.
                      </span>
                    </div>
                  ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                        Selecciona las sedes físicas donde este operador podrá operar:
                      </p>
                      <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                        {selectedBranchIds.length} de {allBranches.length} seleccionada(s)
                      </span>
                    </div>

                    {allBranches.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Buscar sede por nombre, código o ciudad..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            style={{ paddingLeft: '32px', height: '36px', fontSize: '0.84rem' }}
                            disabled={isSavingUser}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            if (selectedBranchIds.length === allBranches.length) {
                              setSelectedBranchIds([]);
                            } else {
                              setSelectedBranchIds(allBranches.map((b) => b.id));
                            }
                          }}
                          style={{ padding: '0 12px', fontSize: '0.78rem', height: '36px', whiteSpace: 'nowrap' }}
                          disabled={isSavingUser}
                        >
                          {selectedBranchIds.length === allBranches.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        </button>
                      </div>
                    )}

                    {(() => {
                      const filteredBranches = allBranches.filter((b) => {
                        const query = branchSearch.trim().toLowerCase();
                        if (!query) return true;
                        return (
                          (b.name || '').toLowerCase().includes(query) ||
                          (b.code || '').toLowerCase().includes(query) ||
                          (b.city || '').toLowerCase().includes(query) ||
                          (b.address || '').toLowerCase().includes(query)
                        );
                      });

                      return filteredBranches.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', maxHeight: '170px', overflowY: 'auto', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                          {filteredBranches.map((b) => {
                            const isChecked = selectedBranchIds.includes(b.id);
                            return (
                              <label
                                key={b.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  background: isChecked ? 'rgba(7, 102, 94, 0.08)' : '#ffffff',
                                  border: isChecked ? '1px solid #07665e' : '1px solid #e2e8f0',
                                  cursor: isSavingUser ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s',
                                  userSelect: 'none',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBranchIds((prev) => [...prev, b.id]);
                                      } else {
                                        setSelectedBranchIds((prev) => prev.filter((id) => id !== b.id));
                                      }
                                    }}
                                    disabled={isSavingUser}
                                    style={{ width: '16px', height: '16px', accentColor: '#07665e' }}
                                  />
                                  <div>
                                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                                      📍 {b.code} — {b.name}
                                    </div>
                                    {b.city && (
                                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                        {b.city} {b.address ? `• ${b.address}` : ''}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                  {b.totalCapacity} plazas
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : allBranches.length > 0 ? (
                        <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                          No se encontraron sedes con el término "{branchSearch}".
                        </div>
                      ) : (
                        <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                          No hay sedes registradas en el sistema.
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSavingUser}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={isSavingUser}>
                  {isSavingUser ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      {editingUsuario.id ? 'Guardando...' : 'Creando...'}
                    </>
                  ) : (
                    editingUsuario.id ? 'Guardar Cambios' : 'Crear Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal / Dialog de Confirmación de Eliminación al estilo PWA */}
      {userToDelete && (
        <ModalPortal>
          <div className="confirm-dialog-overlay">
          <div className="confirm-dialog-card">
            <div style={{ margin: '0 auto 14px auto', width: '52px', height: '52px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              ¿Eliminar Usuario?
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Estás a punto de eliminar a <strong style={{ color: '#0f172a' }}>{userToDelete.fullName || `${userToDelete.firstName || ''} ${userToDelete.firstSurname || ''}`.trim() || userToDelete.username}</strong> (<span style={{ color: '#07665e', fontWeight: 600 }}>@{userToDelete.username}</span>) de la base de datos.
            </p>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: '#991b1b', textAlign: 'left', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.95rem' }}>⚠️</span>
              <span>Esta acción es irreversible y eliminará todos los permisos y asignaciones a sedes de este usuario.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeletingUser}
                style={{ flex: 1 }}
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Sí, Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
