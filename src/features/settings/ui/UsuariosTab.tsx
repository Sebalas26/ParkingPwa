import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Shield } from 'lucide-react';
import type { UserDto, SaveUserDto } from '../model/UsuariosContracts';
import { usuariosService } from '../data/usuariosService';

export const UsuariosTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Partial<SaveUserDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setIsLoading(true);
    try {
      const data = await usuariosService.getUsers();
      setUsuarios(data || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUsuario({
      fullName: '',
      email: '',
      username: '',
      password: '',
      role: 'Operador',
      isActive: true,
      status: 'Activo',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserDto) => {
    const isUserActive = u.isActive ?? (u.status === true || u.status === 'Activo' || u.status === 'Active');
    setEditingUsuario({
      id: u.id,
      fullName: u.fullName || u.name || '',
      email: u.email,
      username: u.username || u.email,
      role: u.userRoleDto?.name || u.role || 'Operador',
      isActive: isUserActive,
      status: isUserActive ? 'Activo' : 'Inactivo',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;

    try {
      const isAct = editingUsuario.isActive ?? (editingUsuario.status === 'Activo' || editingUsuario.status === true);
      await usuariosService.saveOrEditUser({
        id: editingUsuario.id,
        name: editingUsuario.fullName || editingUsuario.name || '',
        fullName: editingUsuario.fullName || editingUsuario.name || '',
        email: editingUsuario.email || '',
        username: editingUsuario.username || editingUsuario.email || '',
        password: editingUsuario.password || undefined,
        role: editingUsuario.role || 'Operador',
        isActive: isAct,
        status: isAct ? 'Activo' : 'Inactivo',
      });
      setIsModalOpen(false);
      setEditingUsuario(null);
      await loadUsuarios();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el usuario.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Usuarios y Permisos</h2>
          <p>Administra los accesos del personal, roles de operador/supervisor y cuentas registradas en el sistema.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
          <Plus size={16} /> Crear Usuario
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>NOMBRE COMPLETO</th>
            <th>CORREO / USUARIO</th>
            <th>ROL</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length > 0 ? (
            usuarios.map((u) => {
              const displayName = u.fullName || u.name || u.username || 'Usuario';
              const displayRole = u.userRoleDto?.name || u.role || 'Operador';
              const isUserActive = u.isActive ?? (u.status === 'Activo' || u.status === true || u.status === 'Active');

              return (
                <tr key={u.id}>
                  <td className="font-bold text-muted">#{u.id}</td>
                  <td className="font-bold">{displayName}</td>
                  <td className="text-muted">{u.email || u.username}</td>
                  <td>
                    <span className="badge badge-success" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary-color)' }}>
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
                      <button className="btn-action primary" onClick={() => handleOpenEdit(u)}>
                        <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando usuarios...' : 'No se encontraron usuarios registrados.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Usuario */}
      {isModalOpen && editingUsuario && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingUsuario.id ? `Editar Usuario (#${editingUsuario.id})` : 'Crear Nuevo Usuario'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Sofía Ramírez"
                    value={editingUsuario.fullName || editingUsuario.name || ''}
                    onChange={(e) => setEditingUsuario({ ...editingUsuario, fullName: e.target.value, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="usuario@parkcontrol.cl"
                    value={editingUsuario.email || ''}
                    onChange={(e) => setEditingUsuario({ ...editingUsuario, email: e.target.value })}
                    required
                  />
                </div>

                {!editingUsuario.id && (
                  <div className="form-group">
                    <label>Contraseña Inicial</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••••••"
                      value={editingUsuario.password || ''}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, password: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Rol en Sistema</label>
                    <select
                      className="input-field"
                      value={editingUsuario.role || 'Operador'}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, role: e.target.value })}
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Operador">Operador</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      className="input-field"
                      value={editingUsuario.isActive ? 'Activo' : 'Inactivo'}
                      onChange={(e) => {
                        const isA = e.target.value === 'Activo';
                        setEditingUsuario({ ...editingUsuario, isActive: isA, status: e.target.value });
                      }}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
