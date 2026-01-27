import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { SearchZonesDto } from './dto/search-zones.dto';
import { AuditService } from '../audit/audit.service';

export interface AuthUser {
  id: string;
  companyId: string;
  parkingLotId: string;
  role: string;
}

@Injectable()
export class ParkingZonesService {
  constructor(
    @InjectRepository(ParkingZone)
    private readonly zoneRepository: Repository<ParkingZone>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Buscar zonas con paginación y filtros
   */
  async search(searchDto: SearchZonesDto, user: AuthUser) {
    const { parkingLotId, search, page = 1, limit = 20 } = searchDto;

    const queryBuilder = this.zoneRepository
      .createQueryBuilder('zone')
      .where('zone.companyId = :companyId', { companyId: user.companyId });

    if (parkingLotId) {
      queryBuilder.andWhere('zone.parkingLotId = :parkingLotId', { parkingLotId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(zone.name) LIKE LOWER(:search) OR LOWER(zone.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('zone.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener zona por ID
   */
  async findOne(id: string, user: AuthUser): Promise<ParkingZone> {
    const zone = await this.zoneRepository.findOne({
      where: {
        id,
        companyId: user.companyId,
      },
      relations: ['parkingLot'],
    });

    if (!zone) {
      throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    }

    return zone;
  }

  /**
   * Crear nueva zona
   */
  async create(createZoneDto: CreateZoneDto, user: AuthUser): Promise<ParkingZone> {
    // Verificar que no exista una zona con el mismo nombre en el parking lot
    const existing = await this.zoneRepository.findOne({
      where: {
        parkingLotId: createZoneDto.parkingLotId,
        name: createZoneDto.name,
        companyId: user.companyId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una zona con el nombre "${createZoneDto.name}" en este parqueadero`,
      );
    }

    const zoneData = {
      ...createZoneDto,
      companyId: user.companyId,
    };

    const zone = this.zoneRepository.create(zoneData);
    const saved = await this.zoneRepository.save(zone);

    // Auditoría
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'ParkingZone',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { zone: saved },
    });

    return this.findOne(saved.id, user);
  }

  /**
   * Actualizar zona
   */
  async update(
    id: string,
    updateZoneDto: UpdateZoneDto,
    user: AuthUser,
  ): Promise<ParkingZone> {
    const zone = await this.findOne(id, user);

    // Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (updateZoneDto.name && updateZoneDto.name !== zone.name) {
      const existing = await this.zoneRepository.findOne({
        where: {
          parkingLotId: zone.parkingLotId,
          name: updateZoneDto.name,
          companyId: user.companyId,
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe una zona con el nombre "${updateZoneDto.name}" en este parqueadero`,
        );
      }
    }

    const before = { ...zone };

    Object.assign(zone, updateZoneDto);
    const updated = await this.zoneRepository.save(zone);

    // Auditoría
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'ParkingZone',
      entityId: updated.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { before, after: updated },
    });

    return this.findOne(updated.id, user);
  }

  /**
   * Eliminar zona (soft delete)
   */
  async remove(id: string, user: AuthUser): Promise<void> {
    const zone = await this.findOne(id, user);

    const before = { ...zone };

    zone.isActive = false;
    await this.zoneRepository.save(zone);

    // Auditoría
    await this.auditService.log({
      action: 'DELETE',
      entityType: 'ParkingZone',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { before },
    });
  }
}
