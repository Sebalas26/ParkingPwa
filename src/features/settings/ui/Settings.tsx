import React, { useState } from 'react';
import { Users, FileText, Car, CreditCard, Building, Shield } from 'lucide-react';
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

  return (
    <div className="settings-container">
      <div className="settings-nav-tabs">
        {authService.hasPermission('settings.parqueaderos.view') && (
          <button 
            className={`settings-tab-btn ${activeTab === 'parqueaderos' ? 'active' : ''}`}
            onClick={() => setActiveTab('parqueaderos')}
          >
            <Building size={18} /> Parqueaderos
          </button>
        )}
        {authService.hasPermission('settings.usuarios.view') && (
          <button 
            className={`settings-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
          >
            <Users size={18} /> Usuarios
          </button>
        )}
        {(authService.hasPermission('settings.roles.view') || authService.hasPermission('settings.usuarios.view') || authService.hasPermission('roles.manage') || authService.hasPermission('security.view')) && (
          <button 
            className={`settings-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <Shield size={18} /> Roles y Permisos
          </button>
        )}
        {authService.hasPermission('settings.convenios.view') && (
          <button 
            className={`settings-tab-btn ${activeTab === 'convenios' ? 'active' : ''}`}
            onClick={() => setActiveTab('convenios')}
          >
            <FileText size={18} /> Convenios
          </button>
        )}
        {authService.hasPermission('settings.vehiculos.view') && (
          <button 
            className={`settings-tab-btn ${activeTab === 'vehiculos' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehiculos')}
          >
            <Car size={18} /> Vehículos
          </button>
        )}
        {authService.hasPermission('settings.medios_pago.view') && (
          <button 
            className={`settings-tab-btn ${activeTab === 'mediosPago' ? 'active' : ''}`}
            onClick={() => setActiveTab('mediosPago')}
          >
            <CreditCard size={18} /> Medios de Pago
          </button>
        )}
      </div>

      <div className="settings-tab-content">
        {activeTab === 'parqueaderos' && authService.hasPermission('settings.parqueaderos.view') && <ParqueaderosTab />}
        {activeTab === 'usuarios' && authService.hasPermission('settings.usuarios.view') && <UsuariosTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'convenios' && authService.hasPermission('settings.convenios.view') && <ConveniosTab />}
        {activeTab === 'vehiculos' && authService.hasPermission('settings.vehiculos.view') && <VehiculosConfigTab />}
        {activeTab === 'mediosPago' && authService.hasPermission('settings.medios_pago.view') && <MediosPagoTab />}
      </div>
    </div>
  );
};
