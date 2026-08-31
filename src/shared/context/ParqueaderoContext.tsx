import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BranchDto } from '../../features/settings/model/BranchesContracts';
import { branchesService } from '../../features/settings/data/branchesService';
import type { ParqueaderoDto } from '../../features/settings/model/ParqueaderosContracts';
import type { CompanyDto } from '../../features/companies/model/CompanyContracts';
import { apiClient } from '../api/apiClient';
import { authService } from '../../features/auth/data/authService';

interface BranchContextType {
  // Nueva API Multi-Sede
  branchesList: BranchDto[];
  activeBranchId: number | null;
  activeBranch: BranchDto | null;
  setActiveBranchId: (id: number | null) => void;
  refreshBranches: () => Promise<void>;
  isLoadingBranches: boolean;
  hasZeroBranches: boolean;

  // Modo Impersonación SaaS para SuperAdmin
  inspectedCompany: CompanyDto | null;
  startInspectingCompany: (company: CompanyDto) => Promise<void>;
  stopInspectingCompany: () => void;

  // Compatibilidad con vistas existentes
  parqueaderosList: ParqueaderoDto[];
  selectedParqueaderoId: number | null;
  selectedParqueadero: ParqueaderoDto | null;
  setSelectedParqueaderoId: (id: number | null) => void;
  refreshParqueaderos: () => Promise<void>;
  isLoadingParqueaderos: boolean;
}

const BranchContext = createContext<BranchContextType>({
  branchesList: [],
  activeBranchId: null,
  activeBranch: null,
  setActiveBranchId: () => {},
  refreshBranches: async () => {},
  isLoadingBranches: false,
  hasZeroBranches: false,

  inspectedCompany: null,
  startInspectingCompany: async () => {},
  stopInspectingCompany: () => {},

  parqueaderosList: [],
  selectedParqueaderoId: null,
  selectedParqueadero: null,
  setSelectedParqueaderoId: () => {},
  refreshParqueaderos: async () => {},
  isLoadingParqueaderos: false,
});

export const ParqueaderoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branchesList, setBranchesList] = useState<BranchDto[]>(() => {
    try {
      const user = authService.getCurrentUser();
      return Array.isArray(user?.branches) && user.branches.length > 0
        ? (user.branches as BranchDto[])
        : [];
    } catch {
      return [];
    }
  });
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);
  const [inspectedCompany, setInspectedCompany] = useState<CompanyDto | null>(() => {
    try {
      const saved = sessionStorage.getItem('parkflow_inspected_company');
      return saved ? (JSON.parse(saved) as CompanyDto) : null;
    } catch {
      return null;
    }
  });

  const [activeBranchId, setActiveBranchIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('parkflow_active_branch_id') || localStorage.getItem('parkflow_selected_parqueadero_id');
    if (!saved || saved === 'all') return null;
    const num = Number(saved);
    return isNaN(num) ? null : num;
  });

  const refreshBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    try {
      let data: BranchDto[] = [];
      const currentInspected = inspectedCompany || (() => {
        try {
          const s = sessionStorage.getItem('parkflow_inspected_company');
          return s ? (JSON.parse(s) as CompanyDto) : null;
        } catch {
          return null;
        }
      })();

      if (currentInspected && currentInspected.id) {
        const companyBranches = await apiClient.get<BranchDto[]>(`/Branches/company/${currentInspected.id}`);
        data = Array.isArray(companyBranches) ? companyBranches : [];
      } else {
        data = await branchesService.getAll();
      }

      setBranchesList(data || []);

      if (data && data.length > 0) {
        // Si no hay sede activa seleccionada o la seleccionada ya no existe, elegir la primera
        setActiveBranchIdState((prevId) => {
          const exists = prevId !== null && data.some((b) => b.id === prevId);
          if (!exists) {
            const defaultBranch = data.find((b) => b.isActive) || data[0];
            localStorage.setItem('parkflow_active_branch_id', String(defaultBranch.id));
            localStorage.setItem('parkflow_selected_parqueadero_id', String(defaultBranch.id));
            return defaultBranch.id;
          }
          return prevId;
        });
      } else {
        setActiveBranchIdState(null);
        localStorage.removeItem('parkflow_active_branch_id');
        localStorage.removeItem('parkflow_selected_parqueadero_id');
      }
    } catch (err) {
      console.error('Error al sincronizar sedes en contexto:', err);
    } finally {
      setIsLoadingBranches(false);
    }
  }, [inspectedCompany]);

  useEffect(() => {
    refreshBranches();
  }, [refreshBranches]);

  const setActiveBranchId = (id: number | null) => {
    setActiveBranchIdState(id);
    if (id !== null) {
      localStorage.setItem('parkflow_active_branch_id', String(id));
      localStorage.setItem('parkflow_selected_parqueadero_id', String(id));
    } else {
      localStorage.removeItem('parkflow_active_branch_id');
      localStorage.removeItem('parkflow_selected_parqueadero_id');
    }
  };

  const startInspectingCompany = async (company: CompanyDto) => {
    setInspectedCompany(company);
    sessionStorage.setItem('parkflow_inspected_company', JSON.stringify(company));
    setIsLoadingBranches(true);
    try {
      const branches = await apiClient.get<BranchDto[]>(`/Branches/company/${company.id}`);
      const validBranches = Array.isArray(branches) ? branches : [];
      setBranchesList(validBranches);
      if (validBranches.length > 0) {
        const defaultBranch = validBranches.find((b) => b.isActive) || validBranches[0];
        setActiveBranchId(defaultBranch.id);
      } else {
        setActiveBranchId(null);
      }
    } catch (err) {
      console.error('Error al cargar sedes de la empresa inspeccionada:', err);
      setBranchesList([]);
      setActiveBranchId(null);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const stopInspectingCompany = () => {
    setInspectedCompany(null);
    sessionStorage.removeItem('parkflow_inspected_company');
    localStorage.removeItem('parkflow_active_branch_id');
    localStorage.removeItem('parkflow_selected_parqueadero_id');
    setActiveBranchIdState(null);
    setBranchesList([]);
  };

  const activeBranch = activeBranchId !== null
    ? branchesList.find((b) => b.id === activeBranchId) || null
    : (branchesList.length > 0 ? branchesList[0] : null);

  const hasZeroBranches = !isLoadingBranches && branchesList.length === 0;

  // Mapeo retrocompatible a ParqueaderoDto
  const parqueaderosList: ParqueaderoDto[] = branchesList.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.notes || `${b.code} - ${b.city || ''}`,
    address: b.address,
    city: b.city,
    totalCapacity: b.totalCapacity,
    isActive: b.isActive,
    imageUrl: b.imageUrl,
    isMainImage: b.isMainImage,
    enrolledUsers: [],
    permissions: {
      tarifas: true,
      usuarios: true,
      convenios: true,
      vehiculos: true,
      mediosPago: true,
    },
  }));

  const selectedParqueadero = activeBranch ? {
    id: activeBranch.id,
    name: activeBranch.name,
    description: activeBranch.notes,
    address: activeBranch.address,
    city: activeBranch.city,
    totalCapacity: activeBranch.totalCapacity,
    isActive: activeBranch.isActive,
    imageUrl: activeBranch.imageUrl,
    isMainImage: activeBranch.isMainImage,
    enrolledUsers: [],
    permissions: {
      tarifas: true,
      usuarios: true,
      convenios: true,
      vehiculos: true,
      mediosPago: true,
    },
  } : null;

  return (
    <BranchContext.Provider
      value={{
        branchesList,
        activeBranchId,
        activeBranch,
        setActiveBranchId,
        refreshBranches,
        isLoadingBranches,
        hasZeroBranches,

        inspectedCompany,
        startInspectingCompany,
        stopInspectingCompany,

        parqueaderosList,
        selectedParqueaderoId: activeBranchId,
        selectedParqueadero,
        setSelectedParqueaderoId: setActiveBranchId,
        refreshParqueaderos: refreshBranches,
        isLoadingParqueaderos: isLoadingBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranchContext = () => useContext(BranchContext);
export const useParqueaderoContext = () => useContext(BranchContext);

