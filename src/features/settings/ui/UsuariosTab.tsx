import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Shield, Trash2, IdCard } from 'lucide-react';
import type { UserDto, SaveUserDto, GetIdentificationTypeDto, GetUserRoleDto } from '../model/UsuariosContracts';
import { usuariosService } from '../data/usuariosService';
import { authService } from '../../auth/data/authService';

export const UsuariosTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [identTypes, setIdentTypes] = useState<GetIdentificationTypeDto[]>([]);
  const [userRoles, setUserRoles] = useState<GetUserRoleDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<SaveUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, typesData, rolesData] = await Promise.all([
        usuariosService.getUsers(),
        usuariosService.getIdentificationTypes(),
        usuariosService.getUserRoles(),
      ]);
      setUsuarios(usersData || []);
      setIdentTypes(typesData || []);
      setUserRoles(rolesData || []);
    } catch (err) {
      console.error('Error al cargar datos de usuarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const defaultTypeId = identTypes.length > 0 ? (identTypes[0].id || 1) : 1;
    const defaultRoleId = userRoles.length > 0 ? (userRoles.find(r => (r.roleName || r.role) === 'Operador')?.idUserRol || userRoles[0].idUserRol || userRoles[0].id || 2) : 2;

    setEditingUsuario({
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserDto) => {
    const isUserActive = u.isActive ?? (u.status === true || u.status === 'Activo' || u.status === 'Active');
    setEditingUsuario({
      id: u.id,
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
      userRoleId: u.userRoleId || u.userRoleDto?.id || 2,
      isActive: isUserActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;

    // Calcular fullName si está vacío
    const computedFullName = editingUsuario.fullName.trim() ||
      `${editingUsuario.firstName} ${editingUsuario.middleName || ''} ${editingUsuario.firstSurname} ${editingUsuario.secondLastName || ''}`.replace(/\s+/g, ' ').trim();

    try {
      const payload: SaveUserDto = {
        ...editingUsuario,
        fullName: computedFullName,
        username: editingUsuario.username.trim() || editingUsuario.email.trim(),
      };

      await usuariosService.saveOrEditUser(payload);
      setIsModalOpen(false);
      setEditingUsuario(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el usuario en la base de datos.');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (confirm('¿Estás seguro de desactivar este usuario?')) {
      await usuariosService.deactivateUser(id);
      await loadData();
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Usuarios y Accesos</h2>
          <p>Administra las cuentas de usuario, tipos de documento, datos personales y asignación de roles operativos en la BD.</p>
        </div>
        {(authService.hasPermission('settings.usuarios.manage') || authService.hasPermission('users.manage')) && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Usuario
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>DOCUMENTO</th>
            <th>NOMBRE COMPLETO</th>
            <th>USUARIO / CORREO</th>
            <th>ROL ASIGNADO</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length > 0 ? (
            usuarios.map((u) => {
              const displayName = u.fullName || u.name || `${u.firstName || ''} ${u.firstSurname || ''}`.trim() || u.username;
              const typeCode = u.identificationTypeDto?.identification || (identTypes.find(t => t.id === u.identificationTypeId)?.identification) || 'CC';
              const docNumber = u.identificationNumber || '--';
              const displayRole = u.userRoleDto?.role || (userRoles.find(r => r.id === u.userRoleId)?.role) || u.role || 'Operador';
              const isUserActive = u.isActive ?? (u.status === 'Activo' || u.status === true || u.status === 'Active');

              return (
                <tr key={u.id}>
                  <td className="font-bold text-muted">#{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IdCard size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span className="font-bold">{typeCode}</span> {docNumber}
                    </div>
                  </td>
                  <td className="font-bold">{displayName}</td>
                  <td className="text-muted">
                    <div>{u.username}</div>
                    <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</small>
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ background: 'rgba(7, 102, 94, 0.1)', color: 'var(--primary-color)' }}>
                      <Shield size={12} style={{ marginRight: 4 }} /> {displayRole}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${isUserActive ? 'badge-success' : 'badge-danger'}`}>
                      {isUserActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {(authService.hasPermission('settings.usuarios.manage') || authService.hasPermission('users.manage')) && (
                        <>
                          <button className="btn-action primary" onClick={() => handleOpenEdit(u)}>
                            <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                          </button>
                          {isUserActive && (
                            <button className="btn-action danger" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }} onClick={() => handleDeactivate(u.id)}>
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
              <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando usuarios desde la API...' : 'No se encontraron usuarios registrados en la base de datos.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Usuario con Campos BD Completos */}
      {isModalOpen && editingUsuario && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>{editingUsuario.id ? `Editar Usuario (#${editingUsuario.id})` : 'Crear Nuevo Usuario en BD'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Sección Identificación */}
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  1. Documento de Identidad
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Tipo Doc.</label>
                    <select
                      className="input-field"
                      value={editingUsuario.identificationTypeId}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, identificationTypeId: Number(e.target.value) })}
                      required
                    >
                      {identTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.identification} - {t.name || t.identification}</option>
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
                    />
                  </div>
                </div>

                {/* Sección Nombres y Apellidos */}
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-color)', margin: '14px 0 8px 0', textTransform: 'uppercase' }}>
                  2. Datos Personales
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Primer Nombre *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: Carlos"
                      value={editingUsuario.firstName}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, firstName: e.target.value })}
                      required
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
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Primer Apellido *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: Gómez"
                      value={editingUsuario.firstSurname}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, firstSurname: e.target.value })}
                      required
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
                    />
                  </div>
                </div>

                {/* Sección Credenciales y Rol */}
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-color)', margin: '14px 0 8px 0', textTransform: 'uppercase' }}>
                  3. Credenciales y Permisos
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Nombre de Usuario *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: cgomez"
                      value={editingUsuario.username}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, username: e.target.value })}
                      required
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
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>{editingUsuario.id ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial *'}</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••••••"
                      value={editingUsuario.password || ''}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, password: e.target.value })}
                      required={!editingUsuario.id}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rol del Sistema *</label>
                    <select
                      className="input-field"
                      value={editingUsuario.userRoleId}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, userRoleId: Number(e.target.value) })}
                      required
                    >
                      {userRoles.map((r) => {
                        const roleId = r.idUserRol ?? r.id ?? 2;
                        const roleTitle = r.roleName || r.role || r.name || 'Operador';
                        return (
                          <option key={roleId} value={roleId}>
                            {roleTitle}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label>Estado de Cuenta</label>
                  <select
                    className="input-field"
                    value={editingUsuario.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingUsuario({ ...editingUsuario, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Activo (Habilitado para operar)</option>
                    <option value="false">Inactivo (Acceso bloqueado)</option>
                  </select>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Usuario en BD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
