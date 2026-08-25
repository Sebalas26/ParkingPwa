import { branchesService } from './branchesService';
import type { ParqueaderoDto, SaveParqueaderoDto } from '../model/ParqueaderosContracts';

export const parqueaderosService = {
  getParqueaderos: async (): Promise<ParqueaderoDto[]> => {
    try {
      const branches = await branchesService.getAll();
      return (branches || []).map((b) => ({
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
    } catch {
      return [];
    }
  },

  getParqueaderoById: async (id: number): Promise<ParqueaderoDto | null> => {
    try {
      const b = await branchesService.getById(id);
      if (!b) return null;
      return {
        id: b.id,
        name: b.name,
        description: b.notes,
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
      };
    } catch {
      return null;
    }
  },

  saveOrEditParqueadero: async (dto: SaveParqueaderoDto): Promise<ParqueaderoDto> => {
    if (dto.id) {
      const updated = await branchesService.update(dto.id, {
        code: `SEDE-${dto.id}`,
        name: dto.name,
        notes: dto.description,
        totalCapacity: 100,
        isActive: dto.isActive ?? true,
      });
      return {
        id: updated.id,
        name: updated.name,
        description: updated.notes,
        isActive: updated.isActive,
        enrolledUsers: [],
        permissions: {
          tarifas: true,
          usuarios: true,
          convenios: true,
          vehiculos: true,
          mediosPago: true,
        },
      };
    } else {
      const created = await branchesService.create({
        code: `SEDE-NEW`,
        name: dto.name,
        notes: dto.description,
        totalCapacity: 100,
      });
      return {
        id: created.id,
        name: created.name,
        description: created.notes,
        isActive: created.isActive,
        enrolledUsers: [],
        permissions: {
          tarifas: true,
          usuarios: true,
          convenios: true,
          vehiculos: true,
          mediosPago: true,
        },
      };
    }
  },
};
