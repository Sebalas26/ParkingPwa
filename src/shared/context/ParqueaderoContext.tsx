import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ParqueaderoDto } from '../../features/settings/model/ParqueaderosContracts';
import { parqueaderosService } from '../../features/settings/data/parqueaderosService';

interface ParqueaderoContextType {
  parqueaderosList: ParqueaderoDto[];
  selectedParqueaderoId: number | 'all';
  selectedParqueadero: ParqueaderoDto | null;
  setSelectedParqueaderoId: (id: number | 'all') => void;
  refreshParqueaderos: () => Promise<void>;
  isLoadingParqueaderos: boolean;
}

const ParqueaderoContext = createContext<ParqueaderoContextType>({
  parqueaderosList: [],
  selectedParqueaderoId: 'all',
  selectedParqueadero: null,
  setSelectedParqueaderoId: () => {},
  refreshParqueaderos: async () => {},
  isLoadingParqueaderos: false,
});

export const ParqueaderoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parqueaderosList, setParqueaderosList] = useState<ParqueaderoDto[]>([]);
  const [isLoadingParqueaderos, setIsLoadingParqueaderos] = useState<boolean>(true);
  const [selectedParqueaderoId, setSelectedParqueaderoIdState] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('parkflow_selected_parqueadero_id');
    if (saved === 'all') return 'all';
    const num = Number(saved);
    return isNaN(num) ? 'all' : num;
  });

  const refreshParqueaderos = async () => {
    setIsLoadingParqueaderos(true);
    try {
      const data = await parqueaderosService.getParqueaderos();
      setParqueaderosList(data || []);
      
      // Si el ID guardado no existe en la lista y no es 'all', seleccionar el primero disponible
      if (data && data.length > 0 && selectedParqueaderoId !== 'all') {
        const exists = data.some((p) => p.id === selectedParqueaderoId);
        if (!exists) {
          const main = data.find((p) => p.isMainImage) || data[0];
          setSelectedParqueaderoIdState(main.id);
          localStorage.setItem('parkflow_selected_parqueadero_id', String(main.id));
        }
      }
    } catch (err) {
      console.error('Error al cargar lista de parqueaderos en contexto:', err);
    } finally {
      setIsLoadingParqueaderos(false);
    }
  };

  useEffect(() => {
    refreshParqueaderos();
  }, []);

  const setSelectedParqueaderoId = (id: number | 'all') => {
    setSelectedParqueaderoIdState(id);
    localStorage.setItem('parkflow_selected_parqueadero_id', String(id));
  };

  const selectedParqueadero = selectedParqueaderoId === 'all'
    ? null
    : parqueaderosList.find((p) => p.id === selectedParqueaderoId) || null;

  return (
    <ParqueaderoContext.Provider
      value={{
        parqueaderosList,
        selectedParqueaderoId,
        selectedParqueadero,
        setSelectedParqueaderoId,
        refreshParqueaderos,
        isLoadingParqueaderos,
      }}
    >
      {children}
    </ParqueaderoContext.Provider>
  );
};

export const useParqueaderoContext = () => useContext(ParqueaderoContext);
