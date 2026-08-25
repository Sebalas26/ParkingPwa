import React, { useState } from 'react';
import { Users, FileText, Car, CreditCard, Building2, Shield } from 'lucide-react';
import { authService } from '../../auth/data/authService';
import { UsuariosTab } from './UsuariosTab';
import { RolesTab } from './RolesTab';
import { ConveniosTab } from './ConveniosTab';
import { VehiculosConfigTab } from './VehiculosConfigTab';
import { MediosPagoTab } from './MediosPagoTab';
import { ParqueaderosTab } from './ParqueaderosTab';
import './Settings.css';

type ActiveTab = 'parqueaderos' | 'usuarios' | 'roles' | 'convenios' | 'vehiculos' | 'mediosPago';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('parqueaderos');

  const canViewBranches = authService.hasPermission('branches.view') || authService.hasPermission('settings.parqueaderos.view');
  const canViewUsers = authService.hasPermission('users.view') || authService.hasPermission('settings.usuarios.view');
  const canViewRoles = authService.hasPermission('roles.view') || authService.hasPermission('settings.roles.view') || authService.hasPermission('security.view');
  const canViewAgreements = authService.hasPermission('agreements.view') || authService.hasPermission('settings.convenios.view');
  const canViewRates = authService.hasPermission('rates.view') || authService.hasPermission('settings.vehiculos.view') || authService.hasPermission('settings.tarifas.view');
  const canViewPaymentMethods = authService.hasPermission('payment_methods.view') || authService.hasPermission('settings.medios_pago.view');

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
            <FileText size={16} /> Comercios y Convenios
          </button>
        )}
        {canViewRates && (
          <button 
            className={`settings-tab-btn ${activeTab === 'vehiculos' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehiculos')}
          >
            <Car size={16} /> Tarifas Vehiculares
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
      </div>

      <div className="settings-tab-content">
        {activeTab === 'parqueaderos' && canViewBranches && <ParqueaderosTab />}
        {activeTab === 'usuarios' && canViewUsers && <UsuariosTab />}
        {activeTab === 'roles' && canViewRoles && <RolesTab />}
        {activeTab === 'convenios' && canViewAgreements && <ConveniosTab />}
        {activeTab === 'vehiculos' && canViewRates && <VehiculosConfigTab />}
        {activeTab === 'mediosPago' && canViewPaymentMethods && <MediosPagoTab />}
      </div>
    </div>
  );
};
