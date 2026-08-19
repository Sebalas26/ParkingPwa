import React, { useState } from 'react';
import { DollarSign, Users, FileText, Car } from 'lucide-react';
import { TarifasTab } from './TarifasTab';
import { UsuariosTab } from './UsuariosTab';
import { ConveniosTab } from './ConveniosTab';
import { VehiculosConfigTab } from './VehiculosConfigTab';
import './Settings.css';

type ActiveTab = 'tarifas' | 'usuarios' | 'convenios' | 'vehiculos';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tarifas');

  return (
    <div className="settings-container">
      <div className="settings-nav-tabs">
        <button 
          className={`settings-tab-btn ${activeTab === 'tarifas' ? 'active' : ''}`}
          onClick={() => setActiveTab('tarifas')}
        >
          <DollarSign size={18} /> Tarifas
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <Users size={18} /> Usuarios
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'convenios' ? 'active' : ''}`}
          onClick={() => setActiveTab('convenios')}
        >
          <FileText size={18} /> Convenios
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'vehiculos' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehiculos')}
        >
          <Car size={18} /> Vehículos
        </button>
      </div>

      <div className="settings-tab-content">
        {activeTab === 'tarifas' && <TarifasTab />}
        {activeTab === 'usuarios' && <UsuariosTab />}
        {activeTab === 'convenios' && <ConveniosTab />}
        {activeTab === 'vehiculos' && <VehiculosConfigTab />}
      </div>
    </div>
  );
};
