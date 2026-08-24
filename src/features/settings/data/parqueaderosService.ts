import { apiClient } from '../../../shared/api/apiClient';
import type { ParqueaderoDto, SaveParqueaderoDto } from '../model/ParqueaderosContracts';

const LOCAL_STORAGE_KEY = 'parkflow_parqueaderos_fallback';

const defaultParqueaderos: ParqueaderoDto[] = [
  {
    id: 1,
    name: 'Parqueadero Central - Plaza Mayor',
    description: 'Parqueadero principal con alta capacidad para vehículos livianos y motocicletas.',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800',
    isMainImage: true,
    isActive: true,
    enrolledUsers: [],
    permissions: {
      tarifas: true,
      usuarios: true,
      convenios: true,
      vehiculos: true,
      mediosPago: true,
    },
  },
];

export const parqueaderosService = {
  getParqueaderos: async (): Promise<ParqueaderoDto[]> => {
    try {
      const data = await apiClient.get<ParqueaderoDto[]>('/ParkingLots');
      if (data && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('API /ParkingLots no disponible o retorno vacio, usando almacenamiento local:', err);
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }
    return defaultParqueaderos;
  },

  getParqueaderoById: async (id: number): Promise<ParqueaderoDto | null> => {
    try {
      return await apiClient.get<ParqueaderoDto>(`/ParkingLots/${id}`);
    } catch {
      const all = await parqueaderosService.getParqueaderos();
      return all.find((p) => p.id === id) || null;
    }
  },

  saveOrEditParqueadero: async (dto: SaveParqueaderoDto): Promise<ParqueaderoDto> => {
    try {
      const result = await apiClient.post<ParqueaderoDto>('/ParkingLots/SaveOrEdit', dto);
      if (result && result.id) {
        return result;
      }
    } catch (err) {
      console.warn('Error al guardar en API REST /ParkingLots, usando local storage:', err);
    }

    const all = await parqueaderosService.getParqueaderos();
    let updatedList = [...all];

    if (dto.isMainImage) {
      updatedList = updatedList.map((p) => ({ ...p, isMainImage: false }));
    }

    let savedItem: ParqueaderoDto;
    if (dto.id && dto.id > 0) {
      const existing = updatedList.find((p) => p.id === dto.id);
      const index = updatedList.findIndex((p) => p.id === dto.id);
      savedItem = {
        id: dto.id,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isMainImage: dto.isMainImage,
        isActive: dto.isActive,
        enrolledUsers: existing?.enrolledUsers || [],
        permissions: dto.permissions || existing?.permissions || {
          tarifas: true,
          usuarios: true,
          convenios: true,
          vehiculos: true,
          mediosPago: true,
        },
        inheritedFromId: dto.inheritedFromId ?? existing?.inheritedFromId,
      };
      if (index >= 0) {
        updatedList[index] = savedItem;
      } else {
        updatedList.push(savedItem);
      }
    } else {
      const newId = Math.max(0, ...updatedList.map((p) => p.id)) + 1;
      savedItem = {
        id: newId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isMainImage: dto.isMainImage,
        isActive: dto.isActive,
        enrolledUsers: [],
        permissions: dto.permissions || {
          tarifas: true,
          usuarios: true,
          convenios: true,
          vehiculos: true,
          mediosPago: true,
        },
        inheritedFromId: dto.inheritedFromId || null,
      };
      updatedList.push(savedItem);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    return savedItem;
  },

  deactivateParqueadero: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/ParkingLots/${id}`);
    } catch (err) {
      console.warn('Error al desactivar en API /ParkingLots:', err);
    }

    const all = await parqueaderosService.getParqueaderos();
    const updated = all.map((p) => (p.id === id ? { ...p, isActive: false } : p));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  },
};
