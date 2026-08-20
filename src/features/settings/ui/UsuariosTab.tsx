import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Shield , Trash2} from 'lucide-react';
import type { Usuario } from '../model/SettingsTypes';
import { settingsService } from '../data/settingsService';

export const UsuariosTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Partial<Usuario> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Usuario | null>(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    const data = await settingsService.getUsuarios();
    setUsuarios(data);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await settingsService.deleteUsuario(itemToDelete.id);
    setItemToDelete(null);
    await loadUsuarios();
  };

  const handleOpenCreate = () => {
    setEditingUsuario({
      name: '',
      email: '',
      role: 'Operador',
      status: 'Activo'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: Usuario) => {
    setEditingUsuario({ ...u });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;
    await settingsService.saveUsuario(editingUsuario);
    setIsModalOpen(false);
    setEditingUsuario(null);
    await loadUsuarios();
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
            <th>CORREO ELECTRÓNICO</th>
            <th>ROL</th>
            <th>ÚLTIMO ACCESO</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td className="font-bold text-muted">{u.id}</td>
              <td className="font-bold">{u.name}</td>
              <td className="text-muted">{u.email}</td>
              <td>
                <span className="badge badge-success" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
                  <Shield size={12} style={{ marginRight: 4 }} /> {u.role}
                </span>
              </td>
              <td className="text-muted">{u.lastLogin || 'Nunca'}</td>
              <td>
                <span className={`badge ${u.status === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                  {u.status}
                </span>
              </td>
              <td className="text-right">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn-action primary" onClick={() => handleOpenEdit(u)}>
                  <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                </button>
                <button className="btn-action danger" style={{ color: '#ef4444' }} onClick={() => setItemToDelete(u)}>
                  <Trash2 size={14} style={{ marginRight: 4 }} /> Eliminar
                </button>
                              </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Crear / Editar Usuario */}
      {isModalOpen && editingUsuario && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingUsuario.id ? `Editar Usuario (${editingUsuario.id})` : 'Crear Nuevo Usuario'}</h3>
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
                    value={editingUsuario.name || ''}
                    onChange={(e) => setEditingUsuario({ ...editingUsuario, name: e.target.value })}
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Rol en Sistema</label>
                    <select 
                      className="input-field" 
                      value={editingUsuario.role || 'Operador'}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, role: e.target.value as any })}
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
                      value={editingUsuario.status || 'Activo'}
                      onChange={(e) => setEditingUsuario({ ...editingUsuario, status: e.target.value as any })}
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

      {/* Modal Confirmar Eliminación */}
      {itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Confirmar Eliminación</h3>
              <button className="btn-close-modal" onClick={() => setItemToDelete(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar el registro <strong>{itemToDelete.id}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setItemToDelete(null)}>Cancelar</button>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={handleDeleteConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};
