import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Users,
  Layers,
  CheckCircle,
  Edit2,
  Power,
  Phone,
  Mail,
  X,
  Loader2,
  Building
} from 'lucide-react';
import { companyService } from '../data/companyService';
import type { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from '../model/CompanyContracts';
import './CompaniesPage.css';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDto | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form states for creating company
  const [createForm, setCreateForm] = useState<CreateCompanyDto>({
    name: '',
    legalName: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    planType: 'Basic',
    maxBranches: 1,
    adminUsername: '',
    adminPassword: '',
    adminFullName: '',
    adminEmail: '',
    adminIdentificationNumber: '',
    adminIdentificationTypeId: 1,
  });

  // Form states for editing company
  const [editForm, setEditForm] = useState<UpdateCompanyDto>({
    name: '',
    legalName: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    planType: 'Basic',
    maxBranches: 1,
    isActive: true,
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al cargar listado de empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleOpenCreateModal = () => {
    setCreateForm({
      name: '',
      legalName: '',
      nit: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      planType: 'Basic',
      maxBranches: 1,
      adminUsername: '',
      adminPassword: '',
      adminFullName: '',
      adminEmail: '',
      adminIdentificationNumber: '',
      adminIdentificationTypeId: 1,
    });
    setErrorMessage('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (company: CompanyDto) => {
    setSelectedCompany(company);
    setEditForm({
      name: company.name,
      legalName: company.legalName || '',
      nit: company.nit,
      email: company.email,
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      planType: company.planType || 'Basic',
      maxBranches: company.maxBranches || 1,
      isActive: company.isActive,
      subscriptionExpiresAt: company.subscriptionExpiresAt,
    });
    setErrorMessage('');
    setIsEditModalOpen(true);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setErrorMessage('');
      await companyService.create(createForm);
      setIsCreateModalOpen(false);
      await loadCompanies();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Error al registrar empresa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      setActionLoading(true);
      setErrorMessage('');
      await companyService.update(selectedCompany.id, editForm);
      setIsEditModalOpen(false);
      await loadCompanies();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Error al actualizar empresa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (company: CompanyDto) => {
    const actionText = company.isActive ? 'suspender' : 'reactivar';
    if (!window.confirm(`¿Está seguro de que desea ${actionText} la suscripción de la empresa "${company.name}"?`)) {
      return;
    }

    try {
      await companyService.toggleStatus(company.id);
      await loadCompanies();
    } catch (err: any) {
      alert(err?.message || 'Error al alternar estado de la empresa.');
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.nit.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  });

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.isActive).length;
  const totalBranches = companies.reduce((acc, c) => acc + (c.branchesCount || 0), 0);
  const totalUsers = companies.reduce((acc, c) => acc + (c.usersCount || 0), 0);

  return (
    <div className="companies-page">
      {/* Header */}
      <div className="companies-header">
        <div className="companies-title-box">
          <h1>
            <Building2 size={28} color="#10b981" />
            Gestión de Empresas SaaS
          </h1>
          <p>Administración centralizada de clientes, límites de sedes y aprovisionamiento de tenants.</p>
        </div>
        <button type="button" className="btn-primary-gradient" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          Nueva Empresa Cliente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="companies-kpi-grid">
        <div className="company-kpi-card">
          <div className="kpi-icon-box kpi-icon-blue">
            <Building2 size={24} />
          </div>
          <div className="kpi-info-box">
            <span className="kpi-value">{totalCompanies}</span>
            <span className="kpi-label">Empresas Registradas</span>
          </div>
        </div>

        <div className="company-kpi-card">
          <div className="kpi-icon-box kpi-icon-green">
            <CheckCircle size={24} />
          </div>
          <div className="kpi-info-box">
            <span className="kpi-value">{activeCompanies}</span>
            <span className="kpi-label">Suscripciones Activas</span>
          </div>
        </div>

        <div className="company-kpi-card">
          <div className="kpi-icon-box kpi-icon-purple">
            <Layers size={24} />
          </div>
          <div className="kpi-info-box">
            <span className="kpi-value">{totalBranches}</span>
            <span className="kpi-label">Sedes Totales en Red</span>
          </div>
        </div>

        <div className="company-kpi-card">
          <div className="kpi-icon-box kpi-icon-orange">
            <Users size={24} />
          </div>
          <div className="kpi-info-box">
            <span className="kpi-value">{totalUsers}</span>
            <span className="kpi-label">Usuarios en Plataforma</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="companies-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Buscar por nombre, NIT, email o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.813rem', color: '#9ca3af' }}>
          Mostrando {filteredCompanies.length} de {totalCompanies} empresas
        </span>
      </div>

      {/* Table */}
      <div className="companies-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
            <p>Cargando empresas registradas...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <Building size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <p>No se encontraron empresas con el criterio de búsqueda.</p>
          </div>
        ) : (
          <div className="companies-table-responsive">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Empresa / Razón Social</th>
                  <th>NIT / Documento</th>
                  <th>Contacto</th>
                  <th>Plan SaaS</th>
                  <th>Límite Sedes</th>
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="company-name-cell">
                        <span className="company-main-name">{c.name}</span>
                        {c.legalName && <span className="company-legal-name">{c.legalName}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.nit}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.813rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d1d5db' }}>
                          <Mail size={13} color="#9ca3af" /> {c.email}
                        </span>
                        {c.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#9ca3af' }}>
                            <Phone size={13} /> {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`plan-badge plan-badge-${c.planType.toLowerCase()}`}>
                        {c.planType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#f3f4f6' }}>
                        {c.branchesCount} / {c.maxBranches}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${c.isActive ? 'active' : 'inactive'}`}>
                        <span className="status-dot" />
                        {c.isActive ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#9ca3af', fontSize: '0.813rem' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-icon-action"
                          title="Editar información de empresa"
                          onClick={() => handleOpenEditModal(c)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action btn-toggle-suspend"
                          title={c.isActive ? 'Suspender suscripción' : 'Activar suscripción'}
                          onClick={() => handleToggleStatus(c)}
                        >
                          <Power size={16} color={c.isActive ? '#ef4444' : '#10b981'} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => !actionLoading && setIsCreateModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nueva Empresa Cliente</h2>
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={actionLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany}>
              <div className="modal-body">
                {errorMessage && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                    {errorMessage}
                  </div>
                )}

                <div className="modal-section-title">1. Datos de la Empresa (Tenant)</div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Nombre Comercial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Estacionamientos El Cóndor"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Razón Social</label>
                    <input
                      type="text"
                      placeholder="Ej. Inversiones Cóndor S.A.S"
                      value={createForm.legalName}
                      onChange={(e) => setCreateForm({ ...createForm, legalName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>NIT / Documento Fiscal *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 901.234.567-8"
                      value={createForm.nit}
                      onChange={(e) => setCreateForm({ ...createForm, nit: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico Empresa *</label>
                    <input
                      type="email"
                      required
                      placeholder="contacto@elcondor.com"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Teléfono de Contacto</label>
                    <input
                      type="text"
                      placeholder="+57 310 000 0000"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      placeholder="Ej. Medellín"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Plan SaaS Contratado *</label>
                    <select
                      value={createForm.planType}
                      onChange={(e) => setCreateForm({ ...createForm, planType: e.target.value })}
                    >
                      <option value="Basic">Plan Básico (1 Sede)</option>
                      <option value="Pro">Plan Profesional (Hasta 5 Sedes)</option>
                      <option value="Enterprise">Plan Enterprise (Ilimitado / Multi-Sede)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Límite Máximo de Sedes *</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      required
                      value={createForm.maxBranches}
                      onChange={(e) => setCreateForm({ ...createForm, maxBranches: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="modal-section-title" style={{ marginTop: '0.5rem' }}>
                  2. Administrador Inicial de la Empresa
                </div>
                <p style={{ fontSize: '0.813rem', color: '#9ca3af', marginTop: '-0.75rem' }}>
                  Se creará este usuario con rol Administrador para que el cliente ingrese y configure sus sedes y operadores.
                </p>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Nombre Completo Administrador *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mario Restrepo"
                      value={createForm.adminFullName}
                      onChange={(e) => setCreateForm({ ...createForm, adminFullName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Correo del Administrador *</label>
                    <input
                      type="email"
                      required
                      placeholder="carlos.admin@elcondor.com"
                      value={createForm.adminEmail}
                      onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Usuario para Iniciar Sesión *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. admin_condor"
                      value={createForm.adminUsername}
                      onChange={(e) => setCreateForm({ ...createForm, adminUsername: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contraseña Inicial *</label>
                    <input
                      type="password"
                      required
                      placeholder="Contraseña segura"
                      value={createForm.adminPassword}
                      onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-gradient" disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Aprovisionar Empresa y Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedCompany && (
        <div className="modal-overlay" onClick={() => !actionLoading && setIsEditModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Empresa: {selectedCompany.name}</h2>
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => setIsEditModalOpen(false)}
                disabled={actionLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany}>
              <div className="modal-body">
                {errorMessage && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                    {errorMessage}
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Nombre Comercial *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Razón Social</label>
                    <input
                      type="text"
                      value={editForm.legalName}
                      onChange={(e) => setEditForm({ ...editForm, legalName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>NIT / Documento Fiscal *</label>
                    <input
                      type="text"
                      required
                      value={editForm.nit}
                      onChange={(e) => setEditForm({ ...editForm, nit: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Plan SaaS Contratado</label>
                    <select
                      value={editForm.planType}
                      onChange={(e) => setEditForm({ ...editForm, planType: e.target.value })}
                    >
                      <option value="Basic">Plan Básico</option>
                      <option value="Pro">Plan Profesional</option>
                      <option value="Enterprise">Plan Enterprise</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Límite Máximo de Sedes</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      required
                      value={editForm.maxBranches}
                      onChange={(e) => setEditForm({ ...editForm, maxBranches: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Estado de Suscripción</label>
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Activa (Acceso Habilitado)</option>
                    <option value="false">Suspendida (Acceso Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-gradient" disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
