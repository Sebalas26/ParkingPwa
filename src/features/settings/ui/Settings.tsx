import React, { useState, useEffect } from 'react';
import { Users, FileText, Car, CreditCard, Building2, Shield, FileCheck } from 'lucide-react';
import { useAuthSession } from '../../../shared/hooks/useAuthSession';
import { UsuariosTab } from './UsuariosTab';
import { RolesTab } from './RolesTab';
import { ConveniosTab } from './ConveniosTab';
import { VehiculosConfigTab } from './VehiculosConfigTab';
import { MediosPagoTab } from './MediosPagoTab';
import { ParqueaderosTab } from './ParqueaderosTab';
import { ResolucionesTab } from './ResolucionesTab';
import './Settings.css';

type ActiveTab = 'parqueaderos' | 'usuarios' | 'roles' | 'convenios' | 'vehiculos' | 'mediosPago' | 'resoluciones';

export const Settings: React.FC = () => {
  const { hasPermission } = useAuthSession();

  const canViewBranches = hasPermission('branches.view') || hasPermission('settings.parqueaderos.view');
  const canViewUsers = hasPermission('users.view') || hasPermission('settings.usuarios.view');
  const canViewRoles = hasPermission('roles.view') || hasPermission('settings.roles.view');
  const canViewAgreements = hasPermission('agreements.view') || hasPermission('settings.convenios.view');
  const canViewRates = hasPermission('rates.view') || hasPermission('settings.vehiculos.view') || hasPermission('settings.tarifas.view');
  const canViewPaymentMethods = hasPermission('payment_methods.view') || hasPermission('settings.medios_pago.view');
  const canViewResolutions = hasPermission('resolutions.view') || hasPermission('settings.resoluciones.view');

  const getFirstAvailableTab = (): ActiveTab => {
    if (canViewBranches) return 'parqueaderos';
    if (canViewUsers) return 'usuarios';
    if (canViewRoles) return 'roles';
    if (canViewAgreements) return 'convenios';
    if (canViewRates) return 'vehiculos';
    if (canViewPaymentMethods) return 'mediosPago';
    if (canViewResolutions) return 'resoluciones';
    return 'parqueaderos';
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getFirstAvailableTab);

  // Auto-ajustar pestaña activa si se revocan permisos en tiempo real
  useEffect(() => {
    const isCurrentTabValid =
      (activeTab === 'parqueaderos' && canViewBranches) ||
      (activeTab === 'usuarios' && canViewUsers) ||
      (activeTab === 'roles' && canViewRoles) ||
      (activeTab === 'convenios' && canViewAgreements) ||
      (activeTab === 'vehiculos' && canViewRates) ||
      (activeTab === 'mediosPago' && canViewPaymentMethods) ||
      (activeTab === 'resoluciones' && canViewResolutions);

    if (!isCurrentTabValid) {
      setActiveTab(getFirstAvailableTab());
    }
  }, [activeTab, canViewBranches, canViewUsers, canViewRoles, canViewAgreements, canViewRates, canViewPaymentMethods, canViewResolutions]);

  return (
    <div className="settings-container">
      <div className="settings-nav-tabs">
        {canViewBranches && (
          <button 
            className={`settings-tab-btn ${activeTab === 'parqueaderos' ? 'active' : ''}`}
            onClick={() => setActiveTab('parqueaderos')}
          >
            <Building2 size={16} /> Sedes
          </button>
        )}
        {canViewUsers && (
          <button 
            className={`settings-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
          >
            <Users size={16} /> Usuarios
          </button>
        )}
        {canViewRoles && (
          <button 
            className={`settings-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <Shield size={16} /> Roles y Permisos
          </button>
        )}
        {canViewAgreements && (
          <button 
            className={`settings-tab-btn ${activeTab === 'convenios' ? 'active' : ''}`}
            onClick={() => setActiveTab('convenios')}
          >
            <FileText size={16} /> Convenios
          </button>
        )}
        {canViewRates && (
          <button 
            className={`settings-tab-btn ${activeTab === 'vehiculos' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehiculos')}
          >
            <Car size={16} /> Tipos Vehículos
          </button>
        )}
        {canViewPaymentMethods && (
          <button 
            className={`settings-tab-btn ${activeTab === 'mediosPago' ? 'active' : ''}`}
            onClick={() => setActiveTab('mediosPago')}
          >
            <CreditCard size={16} /> Medios de Pago
          </button>
        )}
        {canViewResolutions && (
          <button 
            className={`settings-tab-btn ${activeTab === 'resoluciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('resoluciones')}
          >
            <FileCheck size={16} /> Resoluciones
          </button>
        )}
      </div>

      <div className="settings-tab-content">
        {activeTab === 'parqueaderos' && canViewBranches && <ParqueaderosTab />}
        {activeTab === 'usuarios' && canViewUsers && <UsuariosTab />}
        {activeTab === 'roles' && canViewRoles && <RolesTab />}
        {activeTab === 'convenios' && canViewAgreements && <ConveniosTab />}
        {activeTab === 'vehiculos' && canViewRates && <VehiculosConfigTab />}
        {activeTab === 'mediosPago' && canViewPaymentMethods && <MediosPagoTab />}
        {activeTab === 'resoluciones' && canViewResolutions && <ResolucionesTab />}
      </div>
    </div>
  );
};
