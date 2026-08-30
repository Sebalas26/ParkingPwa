import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2,
  Building,
  Sliders,
  Trash2
} from 'lucide-react';
import { companyService } from '../data/companyService';
import { apiClient } from '../../../shared/api/apiClient';
import { useBranchContext } from '../../../shared/context/ParqueaderoContext';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import type { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from '../model/CompanyContracts';
import './CompaniesPage.css';

export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const { startInspectingCompany } = useBranchContext();

  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDto | null>(null);
  const [companyBranches, setCompanyBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
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
      const payload = {
        ...createForm,
        maxBranches: Math.max(1, Number(createForm.maxBranches) || 1),
      };
      await companyService.create(payload);
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
      const payload = {
        ...editForm,
        maxBranches: Math.max(1, Number(editForm.maxBranches) || 1),
      };
      await companyService.update(selectedCompany.id, payload);
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

  const handleDeleteCompany = async (company: CompanyDto) => {
    const firstConfirm = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la empresa "${company.name}"?`);
    if (!firstConfirm) return;
    
    const secondConfirm = window.confirm(`¡ADVERTENCIA CRÍTICA! Esto borrará permanentemente la empresa "${company.name}" y TODOS sus datos asociados (sedes, usuarios, transacciones, tarifas, convenios, etc.). Esta acción es IRREVERSIBLE.\n\n¿Estás absolutamente seguro de continuar?`);
    if (!secondConfirm) return;

    try {
      setActionLoading(true);
      await companyService.delete(company.id);
      await loadCompanies();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error al eliminar la empresa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewBranches = async (company: CompanyDto) => {
    setSelectedCompany(company);
    setIsBranchesModalOpen(true);
    setLoadingBranches(true);
    try {
      const branches = await apiClient.get<any[]>(`/Branches/company/${company.id}`);
      setCompanyBranches(Array.isArray(branches) ? branches : []);
    } catch (err) {
      console.error('Error al cargar sedes de la empresa:', err);
      setCompanyBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleAdministerCompany = async (company: CompanyDto) => {
    try {
      setActionLoading(true);
      await startInspectingCompany(company);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error al iniciar administración del parqueadero:', err);
    } finally {
      setActionLoading(false);
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
            <Building2 size={26} color="var(--primary-color, #07665e)" />
            Parqueaderos SaaS & Empresas
          </h1>
          <p>Supervisa todos los clientes SaaS, asignación de planes y límites de sucursales en tiempo real.</p>
        </div>
        <button
          type="button"
          className="btn-primary-gradient"
          onClick={handleOpenCreateModal}
        >
          <Plus size={18} />
          Registrar Nuevo Parqueadero
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
            <span className="kpi-label">Parqueaderos Registrados</span>
          </div>
        </div>

        <div className="company-kpi-card">
          <div className="kpi-icon-box kpi-icon-green">
            <CheckCircle size={24} />
          </div>
          <div className="kpi-info-box">
            <span className="kpi-value">{activeCompanies}</span>
            <span className="kpi-label">Empresas Activas</span>
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
        <div className="search-input-box">
          <Search size={18} color="var(--primary-color, #07665e)" />
          <input
            type="text"
            placeholder="Buscar por nombre, NIT, email o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>
          Mostrando {filteredCompanies.length} de {totalCompanies} empresas
        </span>
      </div>

      {/* Table */}
      <div className="companies-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary-color, #07665e)' }} />
            <p>Cargando empresas registradas...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
            <Building size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: 'var(--primary-color, #07665e)' }} />
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
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>{c.nit}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.813rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary, #1e293b)' }}>
                          <Mail size={13} color="var(--primary-color, #07665e)" /> {c.email}
                        </span>
                        {c.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary, #64748b)' }}>
                            <Phone size={13} color="var(--text-secondary, #64748b)" /> {c.phone}
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
                      <span style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
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
                      <span style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.813rem', fontWeight: 500 }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-action-administer"
                          title="Entrar a administrar este parqueadero (Sedes, Tarifas, Caja, Reportes)"
                          onClick={() => handleAdministerCompany(c)}
                          disabled={actionLoading}
                        >
                          <Sliders size={14} />
                          <span>Administrar</span>
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action"
                          title="Ver Sedes de este Parqueadero"
                          onClick={() => handleViewBranches(c)}
                        >
                          <Layers size={16} color="var(--primary-color, #07665e)" />
                        </button>
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
                          disabled={actionLoading}
                        >
                          <Power size={16} color={c.isActive ? '#ef4444' : 'var(--primary-color, #07665e)'} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action"
                          title="Eliminar Empresa Permanentemente"
                          onClick={() => handleDeleteCompany(c)}
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} color="#ef4444" />
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
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !actionLoading && setIsCreateModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nueva Empresa Cliente</h2>
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
                      onChange={(e) => {
                        const newPlan = e.target.value;
                        let defaultBranches = createForm.maxBranches;
                        if (newPlan === 'Basic') defaultBranches = 1;
                        else if (newPlan === 'Pro') defaultBranches = 5;
                        else if (newPlan === 'Enterprise') defaultBranches = 20;
                        setCreateForm({ ...createForm, planType: newPlan, maxBranches: defaultBranches });
                      }}
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
                      value={createForm.maxBranches === 0 ? '' : createForm.maxBranches}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const num = raw === '' ? 0 : parseInt(raw, 10);
                        setCreateForm({ ...createForm, maxBranches: isNaN(num) ? 0 : num });
                      }}
                      onBlur={() => {
                        if (!createForm.maxBranches || createForm.maxBranches < 1) {
                          setCreateForm((prev) => ({ ...prev, maxBranches: 1 }));
                        }
                      }}
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
        </ModalPortal>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedCompany && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !actionLoading && setIsEditModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Empresa: {selectedCompany.name}</h2>
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
                      onChange={(e) => {
                        const newPlan = e.target.value;
                        let defaultBranches = editForm.maxBranches;
                        if (newPlan === 'Basic') defaultBranches = 1;
                        else if (newPlan === 'Pro') defaultBranches = 5;
                        else if (newPlan === 'Enterprise') defaultBranches = 20;
                        setEditForm({ ...editForm, planType: newPlan, maxBranches: defaultBranches });
                      }}
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
                      value={editForm.maxBranches === 0 ? '' : editForm.maxBranches}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const num = raw === '' ? 0 : parseInt(raw, 10);
                        setEditForm({ ...editForm, maxBranches: isNaN(num) ? 0 : num });
                      }}
                      onBlur={() => {
                        if (!editForm.maxBranches || editForm.maxBranches < 1) {
                          setEditForm((prev) => ({ ...prev, maxBranches: 1 }));
                        }
                      }}
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
        </ModalPortal>
      )}

      {/* VIEW BRANCHES MODAL */}
      {isBranchesModalOpen && selectedCompany && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setIsBranchesModalOpen(false)}>
          <div className="modal-container" style={{ width: '760px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sedes del Parqueadero: {selectedCompany.name}</h2>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '0.85rem 1.15rem', borderRadius: '10px', fontSize: '0.875rem', color: 'var(--text-primary, #1e293b)' }}>
                <span>NIT: <strong>{selectedCompany.nit}</strong></span>
                <span>Plan: <strong style={{ color: 'var(--primary-color, #07665e)' }}>{selectedCompany.planType}</strong></span>
                <span>Sedes Registradas: <strong>{companyBranches.length} / {selectedCompany.maxBranches}</strong></span>
              </div>

              {loadingBranches ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                  <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary-color, #07665e)' }} />
                  <p>Cargando sedes...</p>
                </div>
              ) : companyBranches.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                  <Building size={40} style={{ opacity: 0.4, margin: '0 auto 0.75rem', color: 'var(--primary-color, #07665e)' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>Este parqueadero aún no tiene sedes creadas.</p>
                  <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.25rem' }}>
                    El administrador del cliente registrará sus sedes al acceder a la plataforma con su usuario.
                  </p>
                </div>
              ) : (
                <div className="companies-table-responsive">
                  <table className="companies-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre Sede</th>
                        <th>Dirección / Ciudad</th>
                        <th>Capacidad</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyBranches.map((b) => (
                        <tr key={b.id}>
                          <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#10b981' }}>{b.code}</span></td>
                          <td><strong>{b.name}</strong></td>
                          <td>{b.address || '—'} {b.city ? `(${b.city})` : ''}</td>
                          <td>{b.totalCapacity} plazas</td>
                          <td>
                            <span className={`status-pill ${b.isActive ? 'active' : 'inactive'}`}>
                              <span className="status-dot" />
                              {b.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsBranchesModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
