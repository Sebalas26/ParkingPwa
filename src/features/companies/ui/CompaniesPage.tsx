import React, { useEffect, useState, useRef } from 'react';
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
  Trash2,
  Eye,
  EyeOff,
  ImagePlus,
  Maximize2,
  X,
  AlertCircle
} from 'lucide-react';
import { companyService } from '../data/companyService';
import { apiClient } from '../../../shared/api/apiClient';
import { useBranchContext } from '../../../shared/context/ParqueaderoContext';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import type { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from '../model/CompanyContracts';
import './CompaniesPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const { startInspectingCompany } = useBranchContext();

  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState<boolean>(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyDto | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDto | null>(null);
  const [companyBranches, setCompanyBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Validation error states
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const fileInputCreateRef = useRef<HTMLInputElement>(null);
  const fileInputEditRef = useRef<HTMLInputElement>(null);

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

  const validateCreateForm = (form: CreateCompanyDto): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.name || !form.name.trim()) {
      errors.name = 'El nombre comercial es obligatorio.';
    } else if (form.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!form.nit || !form.nit.trim()) {
      errors.nit = 'El NIT o documento fiscal es obligatorio.';
    }

    if (!form.email || !form.email.trim()) {
      errors.email = 'El correo electrónico de la empresa es obligatorio.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Ingresa un correo válido (ej: contacto@empresa.com).';
    }

    if (form.maxBranches === undefined || form.maxBranches === null || form.maxBranches < 1) {
      errors.maxBranches = 'El límite de sedes debe ser al menos 1.';
    }

    if (!form.adminFullName || !form.adminFullName.trim()) {
      errors.adminFullName = 'El nombre completo del administrador es obligatorio.';
    } else if (form.adminFullName.trim().length < 3) {
      errors.adminFullName = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!form.adminEmail || !form.adminEmail.trim()) {
      errors.adminEmail = 'El correo del administrador es obligatorio.';
    } else if (!EMAIL_REGEX.test(form.adminEmail.trim())) {
      errors.adminEmail = 'Ingresa un correo electrónico válido para el administrador.';
    }

    if (!form.adminUsername || !form.adminUsername.trim()) {
      errors.adminUsername = 'El usuario para iniciar sesión es obligatorio.';
    } else if (form.adminUsername.trim().length < 3) {
      errors.adminUsername = 'El usuario debe tener al menos 3 caracteres.';
    }

    if (!form.adminPassword) {
      errors.adminPassword = 'La contraseña inicial es obligatoria.';
    } else if (form.adminPassword.length < 4) {
      errors.adminPassword = 'La contraseña debe tener al menos 4 caracteres.';
    }

    return errors;
  };

  const validateEditForm = (form: UpdateCompanyDto): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.name || !form.name.trim()) {
      errors.name = 'El nombre comercial es obligatorio.';
    } else if (form.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!form.nit || !form.nit.trim()) {
      errors.nit = 'El NIT o documento fiscal es obligatorio.';
    }

    if (!form.email || !form.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Ingresa un correo válido (ej: contacto@empresa.com).';
    }

    if (form.maxBranches === undefined || form.maxBranches === null || form.maxBranches < 1) {
      errors.maxBranches = 'El límite de sedes debe ser al menos 1.';
    }

    return errors;
  };

  const handleCreateFieldChange = (field: keyof CreateCompanyDto, value: any) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    if (createErrors[field as string]) {
      setCreateErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleEditFieldChange = (field: keyof UpdateCompanyDto, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (editErrors[field as string]) {
      setEditErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleLogoUpload = (file: File, isEdit: boolean) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('El tamaño del logo no puede exceder los 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isEdit) {
          setEditForm((prev) => ({ ...prev, logo: reader.result as string }));
        } else {
          setCreateForm((prev) => ({ ...prev, logo: reader.result as string }));
        }
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      name: '',
      legalName: '',
      nit: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      logo: undefined,
      planType: 'Basic',
      maxBranches: 1,
      adminUsername: '',
      adminPassword: '',
      adminFullName: '',
      adminEmail: '',
      adminIdentificationNumber: '',
      adminIdentificationTypeId: 1,
    });
    setCreateErrors({});
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
      logo: company.logo,
      planType: company.planType || 'Basic',
      maxBranches: company.maxBranches || 1,
      isActive: company.isActive,
      subscriptionExpiresAt: company.subscriptionExpiresAt,
    });
    setEditErrors({});
    setErrorMessage('');
    setIsEditModalOpen(true);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCreateForm(createForm);
    if (Object.keys(validationErrors).length > 0) {
      setCreateErrors(validationErrors);
      return;
    }
    setCreateErrors({});
    try {
      setActionLoading(true);
      setErrorMessage('');
      const payload = {
        ...createForm,
        name: createForm.name.trim(),
        legalName: createForm.legalName?.trim() || undefined,
        nit: createForm.nit.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone?.trim() || undefined,
        city: createForm.city?.trim() || undefined,
        adminFullName: createForm.adminFullName.trim(),
        adminEmail: createForm.adminEmail.trim(),
        adminUsername: createForm.adminUsername.trim(),
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
    const validationErrors = validateEditForm(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }
    setEditErrors({});
    try {
      setActionLoading(true);
      setErrorMessage('');
      const payload = {
        ...editForm,
        name: editForm.name.trim(),
        legalName: editForm.legalName?.trim() || undefined,
        nit: editForm.nit.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone?.trim() || undefined,
        city: editForm.city?.trim() || undefined,
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

  const handleDeleteCompany = (company: CompanyDto) => {
    setCompanyToDelete(company);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      setActionLoading(true);
      await companyService.delete(companyToDelete.id);
      setCompanyToDelete(null);
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {c.logo ? (
                          <div
                            className="company-table-logo-avatar"
                            onClick={() => setPreviewImageModal(c.logo || null)}
                            title="Clic para ver logo en grande"
                            style={{ cursor: 'pointer' }}
                          >
                            <img src={c.logo} alt={c.name} className="pro-logo-thumb-img" />
                          </div>
                        ) : (
                          <div className="company-table-default-avatar" title="Logo por defecto del software">
                            <Building2 size={18} />
                          </div>
                        )}
                        <div className="company-name-cell">
                          <span className="company-main-name">{c.name}</span>
                          {c.legalName && <span className="company-legal-name">{c.legalName}</span>}
                        </div>
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

              <form onSubmit={handleCreateCompany} noValidate>
                <div className="modal-body">
                  {errorMessage && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                      {errorMessage}
                    </div>
                  )}

                  <div className="modal-section-title">1. Datos de la Empresa (Tenant)</div>

                  {/* PRO LOGO UPLOADER - CREATE MODAL */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Logo Corporativo <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span></span>
                    </label>

                    <input
                      type="file"
                      ref={fileInputCreateRef}
                      style={{ display: 'none' }}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, false);
                      }}
                    />

                    {createForm.logo ? (
                      <div className="pro-logo-preview-card">
                        <div
                          className="pro-logo-thumb-wrapper"
                          onClick={() => setPreviewImageModal(createForm.logo || null)}
                          title="Clic para ampliar imagen"
                        >
                          <img src={createForm.logo} alt="Logo Preview" className="pro-logo-thumb-img" />
                          <div className="pro-logo-thumb-overlay">
                            <Maximize2 size={16} />
                          </div>
                        </div>
                        <div className="pro-logo-info">
                          <span className="pro-logo-title">Logo Cargado</span>
                          <span className="pro-logo-desc">Se usará en tickets de parqueadero e identificación corporativa.</span>
                          <div className="pro-logo-actions">
                            <button
                              type="button"
                              className="btn-pro-logo-action"
                              onClick={() => setPreviewImageModal(createForm.logo || null)}
                            >
                              <Eye size={13} /> Ver en grande
                            </button>
                            <button
                              type="button"
                              className="btn-pro-logo-action"
                              onClick={() => fileInputCreateRef.current?.click()}
                            >
                              <Edit2 size={13} /> Cambiar
                            </button>
                            <button
                              type="button"
                              className="btn-pro-logo-action btn-pro-logo-danger"
                              onClick={() => setCreateForm((prev) => ({ ...prev, logo: undefined }))}
                            >
                              <Trash2 size={13} /> Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="pro-logo-dropzone"
                        onClick={() => fileInputCreateRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleLogoUpload(file, false);
                        }}
                      >
                        <div className="pro-logo-dropzone-icon">
                          <ImagePlus size={22} />
                        </div>
                        <div className="pro-logo-dropzone-text">
                          <span className="pro-logo-dropzone-primary">Haz clic o arrastra el logo aquí</span>
                          <span className="pro-logo-dropzone-secondary">PNG, JPG, WEBP o SVG (Máx. 2MB) — Si no se carga, se usará el logo estándar</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-grid-2">
                    <div className={`form-group ${createErrors.name ? 'has-error' : ''}`}>
                      <label>
                        Nombre Comercial <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={createErrors.name ? 'input-error' : ''}
                        placeholder="Ej. Estacionamientos El Cóndor"
                        value={createForm.name}
                        onChange={(e) => handleCreateFieldChange('name', e.target.value)}
                      />
                      {createErrors.name && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.name}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        Razón Social <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Inversiones Cóndor S.A.S"
                        value={createForm.legalName}
                        onChange={(e) => handleCreateFieldChange('legalName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className={`form-group ${createErrors.nit ? 'has-error' : ''}`}>
                      <label>
                        NIT / Documento Fiscal <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={createErrors.nit ? 'input-error' : ''}
                        placeholder="Ej. 901.234.567-8"
                        value={createForm.nit}
                        onChange={(e) => handleCreateFieldChange('nit', e.target.value)}
                      />
                      {createErrors.nit && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.nit}
                        </span>
                      )}
                    </div>
                    <div className={`form-group ${createErrors.email ? 'has-error' : ''}`}>
                      <label>
                        Correo Electrónico Empresa <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="email"
                        className={createErrors.email ? 'input-error' : ''}
                        placeholder="contacto@elcondor.com"
                        value={createForm.email}
                        onChange={(e) => handleCreateFieldChange('email', e.target.value)}
                      />
                      {createErrors.email && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>
                        Teléfono de Contacto <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="+57 310 000 0000"
                        value={createForm.phone}
                        onChange={(e) => handleCreateFieldChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Ciudad <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Medellín"
                        value={createForm.city}
                        onChange={(e) => handleCreateFieldChange('city', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Plan SaaS Contratado <span className="required-asterisk">*</span></label>
                      <select
                        value={createForm.planType}
                        onChange={(e) => {
                          const newPlan = e.target.value;
                          let defaultBranches = createForm.maxBranches;
                          if (newPlan === 'Basic') defaultBranches = 1;
                          else if (newPlan === 'Pro') defaultBranches = 5;
                          else if (newPlan === 'Enterprise') defaultBranches = 20;
                          setCreateForm((prev) => ({ ...prev, planType: newPlan, maxBranches: defaultBranches }));
                        }}
                      >
                        <option value="Basic">Plan Básico (1 Sede)</option>
                        <option value="Pro">Plan Profesional (Hasta 5 Sedes)</option>
                        <option value="Enterprise">Plan Enterprise (Ilimitado / Multi-Sede)</option>
                      </select>
                    </div>
                    <div className={`form-group ${createErrors.maxBranches ? 'has-error' : ''}`}>
                      <label>Límite Máximo de Sedes <span className="required-asterisk">*</span></label>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        className={createErrors.maxBranches ? 'input-error' : ''}
                        value={createForm.maxBranches === 0 ? '' : createForm.maxBranches}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? 0 : parseInt(raw, 10);
                          handleCreateFieldChange('maxBranches', isNaN(num) ? 0 : num);
                        }}
                        onBlur={() => {
                          if (!createForm.maxBranches || createForm.maxBranches < 1) {
                            handleCreateFieldChange('maxBranches', 1);
                          }
                        }}
                      />
                      {createErrors.maxBranches && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.maxBranches}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="modal-section-title" style={{ marginTop: '0.5rem' }}>
                    2. Administrador Inicial de la Empresa
                  </div>
                  <p style={{ fontSize: '0.813rem', color: '#9ca3af', marginTop: '-0.75rem' }}>
                    Se creará este usuario con rol Administrador para que el cliente ingrese y configure sus sedes y operadores.
                  </p>

                  <div className="form-grid-2">
                    <div className={`form-group ${createErrors.adminFullName ? 'has-error' : ''}`}>
                      <label>
                        Nombre Completo Administrador <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={createErrors.adminFullName ? 'input-error' : ''}
                        placeholder="Ej. Carlos Mario Restrepo"
                        value={createForm.adminFullName}
                        onChange={(e) => handleCreateFieldChange('adminFullName', e.target.value)}
                      />
                      {createErrors.adminFullName && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.adminFullName}
                        </span>
                      )}
                    </div>
                    <div className={`form-group ${createErrors.adminEmail ? 'has-error' : ''}`}>
                      <label>
                        Correo del Administrador <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="email"
                        className={createErrors.adminEmail ? 'input-error' : ''}
                        placeholder="carlos.admin@elcondor.com"
                        value={createForm.adminEmail}
                        onChange={(e) => handleCreateFieldChange('adminEmail', e.target.value)}
                      />
                      {createErrors.adminEmail && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.adminEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className={`form-group ${createErrors.adminUsername ? 'has-error' : ''}`}>
                      <label>
                        Usuario para Iniciar Sesión <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={createErrors.adminUsername ? 'input-error' : ''}
                        placeholder="Ej. admin_condor"
                        value={createForm.adminUsername}
                        onChange={(e) => handleCreateFieldChange('adminUsername', e.target.value)}
                      />
                      {createErrors.adminUsername && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.adminUsername}
                        </span>
                      )}
                    </div>
                    <div className={`form-group ${createErrors.adminPassword ? 'has-error' : ''}`}>
                      <label>
                        Contraseña Inicial <span className="required-asterisk">*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showAdminPassword ? "text" : "password"}
                          className={createErrors.adminPassword ? 'input-error' : ''}
                          placeholder="Contraseña segura"
                          value={createForm.adminPassword}
                          onChange={(e) => handleCreateFieldChange('adminPassword', e.target.value)}
                          style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          tabIndex={-1}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0'
                          }}
                        >
                          {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {createErrors.adminPassword && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {createErrors.adminPassword}
                        </span>
                      )}
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
                    Crear Parqueadero
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

              <form onSubmit={handleUpdateCompany} noValidate>
                <div className="modal-body">
                  {errorMessage && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                      {errorMessage}
                    </div>
                  )}

                  <div className="modal-section-title">1. Datos de la Empresa (Tenant)</div>

                  {/* PRO LOGO UPLOADER - EDIT MODAL */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Logo Corporativo <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span></span>
                    </label>

                    <input
                      type="file"
                      ref={fileInputEditRef}
                      style={{ display: 'none' }}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, true);
                      }}
                    />

                    {editForm.logo ? (
                      <div className="pro-logo-preview-card">
                        <div
                          className="pro-logo-thumb-wrapper"
                          onClick={() => setPreviewImageModal(editForm.logo || null)}
                          title="Clic para ampliar imagen"
                        >
                          <img src={editForm.logo} alt="Logo Preview" className="pro-logo-thumb-img" />
                          <div className="pro-logo-thumb-overlay">
                            <Maximize2 size={16} />
                          </div>
                        </div>
                        <div className="pro-logo-info">
                          <span className="pro-logo-title">Logo Corporativo Configurado</span>
                          <span className="pro-logo-desc">Se usará en tickets de parqueadero e identificación corporativa.</span>
                          <div className="pro-logo-actions">
                            <button
                              type="button"
                              className="btn-pro-logo-action"
                              onClick={() => setPreviewImageModal(editForm.logo || null)}
                            >
                              <Eye size={13} /> Ver en grande
                            </button>
                            <button
                              type="button"
                              className="btn-pro-logo-action"
                              onClick={() => fileInputEditRef.current?.click()}
                            >
                              <Edit2 size={13} /> Cambiar
                            </button>
                            <button
                              type="button"
                              className="btn-pro-logo-action btn-pro-logo-danger"
                              onClick={() => setEditForm((prev) => ({ ...prev, logo: undefined }))}
                            >
                              <Trash2 size={13} /> Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="pro-logo-dropzone"
                        onClick={() => fileInputEditRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleLogoUpload(file, true);
                        }}
                      >
                        <div className="pro-logo-dropzone-icon">
                          <ImagePlus size={22} />
                        </div>
                        <div className="pro-logo-dropzone-text">
                          <span className="pro-logo-dropzone-primary">Haz clic o arrastra el logo aquí</span>
                          <span className="pro-logo-dropzone-secondary">PNG, JPG, WEBP o SVG (Máx. 2MB) — Si no se carga, se usará el logo estándar</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-grid-2">
                    <div className={`form-group ${editErrors.name ? 'has-error' : ''}`}>
                      <label>
                        Nombre Comercial <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={editErrors.name ? 'input-error' : ''}
                        value={editForm.name}
                        onChange={(e) => handleEditFieldChange('name', e.target.value)}
                      />
                      {editErrors.name && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {editErrors.name}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        Razón Social <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.legalName}
                        onChange={(e) => handleEditFieldChange('legalName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className={`form-group ${editErrors.nit ? 'has-error' : ''}`}>
                      <label>
                        NIT / Documento Fiscal <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={editErrors.nit ? 'input-error' : ''}
                        value={editForm.nit}
                        onChange={(e) => handleEditFieldChange('nit', e.target.value)}
                      />
                      {editErrors.nit && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {editErrors.nit}
                        </span>
                      )}
                    </div>
                    <div className={`form-group ${editErrors.email ? 'has-error' : ''}`}>
                      <label>
                        Correo Electrónico <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="email"
                        className={editErrors.email ? 'input-error' : ''}
                        value={editForm.email}
                        onChange={(e) => handleEditFieldChange('email', e.target.value)}
                      />
                      {editErrors.email && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {editErrors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>
                        Teléfono <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => handleEditFieldChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Ciudad <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => handleEditFieldChange('city', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Plan SaaS Contratado <span className="required-asterisk">*</span></label>
                      <select
                        value={editForm.planType}
                        onChange={(e) => {
                          const newPlan = e.target.value;
                          let defaultBranches = editForm.maxBranches;
                          if (newPlan === 'Basic') defaultBranches = 1;
                          else if (newPlan === 'Pro') defaultBranches = 5;
                          else if (newPlan === 'Enterprise') defaultBranches = 20;
                          setEditForm((prev) => ({ ...prev, planType: newPlan, maxBranches: defaultBranches }));
                        }}
                      >
                        <option value="Basic">Plan Básico</option>
                        <option value="Pro">Plan Profesional</option>
                        <option value="Enterprise">Plan Enterprise</option>
                      </select>
                    </div>
                    <div className={`form-group ${editErrors.maxBranches ? 'has-error' : ''}`}>
                      <label>Límite Máximo de Sedes <span className="required-asterisk">*</span></label>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        className={editErrors.maxBranches ? 'input-error' : ''}
                        value={editForm.maxBranches === 0 ? '' : editForm.maxBranches}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? 0 : parseInt(raw, 10);
                          handleEditFieldChange('maxBranches', isNaN(num) ? 0 : num);
                        }}
                        onBlur={() => {
                          if (!editForm.maxBranches || editForm.maxBranches < 1) {
                            handleEditFieldChange('maxBranches', 1);
                          }
                        }}
                      />
                      {editErrors.maxBranches && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {editErrors.maxBranches}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Estado de Suscripción</label>
                    <select
                      value={editForm.isActive ? 'true' : 'false'}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
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

      {/* Modal Confirmación de Eliminación de Empresa */}
      {companyToDelete && (
        <ModalPortal>
          <div className="modal-overlay" style={{ background: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(6px)', zIndex: 9999 }}>
            <div
              className="modal-container"
              style={{
                maxWidth: '480px',
                width: '90%',
                background: 'linear-gradient(145deg, #18181b 0%, #27272a 100%)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                overflow: 'hidden',
                color: '#f4f4f5',
              }}
            >
              <div style={{ padding: '28px 28px 20px 28px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <Trash2 size={30} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>
                  ¿Eliminar Empresa Permanentemente?
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#a1a1aa', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  ¿Estás seguro de que deseas eliminar permanentemente la empresa{' '}
                  <strong style={{ color: '#ef4444', fontWeight: 800 }}>"{companyToDelete.name}"</strong>?
                </p>
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    color: '#fca5a5',
                    lineHeight: 1.45,
                  }}
                >
                  <strong>⚠️ ADVERTENCIA CRÍTICA:</strong> Esta acción es <strong>IRREVERSIBLE</strong>. Se borrarán permanentemente sus sedes, usuarios, transacciones, tarifas, convenios y configuraciones asociadas.
                </div>
              </div>

              <div
                style={{
                  padding: '16px 24px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#e4e4e7',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setCompanyToDelete(null)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={confirmDeleteCompany}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="btn-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }} />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Sí, Eliminar Empresa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* LIGHTBOX MODAL PREVIEW */}
      {previewImageModal && (
        <ModalPortal>
          <div
            className="modal-overlay"
            onClick={() => setPreviewImageModal(null)}
            style={{ zIndex: 30000, background: 'rgba(15, 23, 42, 0.85)' }}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.2s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                style={{
                  position: 'absolute',
                  top: '-44px',
                  right: '0',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
              >
                <X size={22} />
              </button>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={previewImageModal}
                  alt="Logo Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '75vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
