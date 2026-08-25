import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BranchDto } from '../../features/settings/model/BranchesContracts';
import { branchesService } from '../../features/settings/data/branchesService';
import type { ParqueaderoDto } from '../../features/settings/model/ParqueaderosContracts';

interface BranchContextType {
  // Nueva API Multi-Sede
  branchesList: BranchDto[];
  activeBranchId: number | null;
  activeBranch: BranchDto | null;
  setActiveBranchId: (id: number | null) => void;
  refreshBranches: () => Promise<void>;
  isLoadingBranches: boolean;
  hasZeroBranches: boolean;

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

  parqueaderosList: [],
  selectedParqueaderoId: null,
  selectedParqueadero: null,
  setSelectedParqueaderoId: () => {},
  refreshParqueaderos: async () => {},
  isLoadingParqueaderos: false,
});

export const ParqueaderoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branchesList, setBranchesList] = useState<BranchDto[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);
  const [activeBranchId, setActiveBranchIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('parkflow_active_branch_id') || localStorage.getItem('parkflow_selected_parqueadero_id');
    if (!saved || saved === 'all') return null;
    const num = Number(saved);
    return isNaN(num) ? null : num;
  });

  const refreshBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    try {
      const data = await branchesService.getAll();
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
  }, []);

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

