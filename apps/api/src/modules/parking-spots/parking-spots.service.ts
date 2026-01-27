import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { SpotStatusHistory } from '../../entities/spot-status-history.entity';
import { AuditService } from '../audit/audit.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { SearchSpotsDto } from './dto/search-spots.dto';
import { ChangeSpotStatusDto } from './dto/change-spot-status.dto';

@Injectable()
export class ParkingSpotsService {
  constructor(
    @InjectRepository(ParkingSpot)
    private readonly spotRepository: Repository<ParkingSpot>,
    @InjectRepository(ParkingZone)
    private readonly zoneRepository: Repository<ParkingZone>,
    @InjectRepository(SpotStatusHistory)
    private readonly historyRepository: Repository<SpotStatusHistory>,
    private readonly auditService: AuditService,
  ) {}

  async search(companyId: string, dto: SearchSpotsDto) {
    const { page = 1, limit = 20, search, parkingLotId, zoneId, status, spotType } = dto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.spotRepository
      .createQueryBuilder('spot')
      .leftJoinAndSelect('spot.zone', 'zone')
      .where('spot.companyId = :companyId', { companyId });

    if (parkingLotId) {
      queryBuilder.andWhere('spot.parkingLotId = :parkingLotId', { parkingLotId });
    }

    if (zoneId) {
      queryBuilder.andWhere('spot.zoneId = :zoneId', { zoneId });
    }

    if (status) {
      queryBuilder.andWhere('spot.status = :status', { status });
    }

    if (spotType) {
      queryBuilder.andWhere('spot.spotType = :spotType', { spotType });
    }

    if (search) {
      queryBuilder.andWhere(
        '(spot.code ILIKE :search OR spot.notes ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('spot.code', 'ASC');

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

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

  async findOne(id: string, companyId: string) {
    const spot = await this.spotRepository.findOne({
      where: { id, companyId },
      relations: ['zone'],
    });

    if (!spot) {
      throw new NotFoundException(`Puesto con ID ${id} no encontrado`);
    }

    return spot;
  }

  async create(companyId: string, userId: string, dto: CreateSpotDto) {
    // Validar que la zona pertenece a la compañía y al parqueadero
    const zone = await this.zoneRepository.findOne({
      where: {
        id: dto.zoneId,
        companyId,
        parkingLotId: dto.parkingLotId,
      },
    });

    if (!zone) {
      throw new BadRequestException('Zona no encontrada o no pertenece al parqueadero especificado');
    }

    // Validar que el tipo de puesto está permitido en la zona
    if (!zone.allowedVehicleTypes.includes(dto.spotType)) {
      throw new BadRequestException(
        `El tipo de vehículo ${dto.spotType} no está permitido en la zona ${zone.name}`,
      );
    }

    // Validar que no exista un puesto con el mismo código en el parqueadero
    const existingSpot = await this.spotRepository.findOne({
      where: {
        companyId,
        parkingLotId: dto.parkingLotId,
        code: dto.code,
      },
    });

    if (existingSpot) {
      throw new BadRequestException(
        `Ya existe un puesto con el código ${dto.code} en este parqueadero`,
      );
    }

    const spot = this.spotRepository.create({
      ...dto,
      companyId,
      status: 'FREE' as any,
      priority: dto.priority ?? 0,
    });

    const savedSpot = await this.spotRepository.save(spot);

    // Auditoría
    await this.auditService.logAction({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'ParkingSpot',
      entityId: savedSpot.id,
      metadata: {
        parkingLotId: dto.parkingLotId,
        zoneId: dto.zoneId,
        code: dto.code,
        spotType: dto.spotType,
      },
    });

    return this.findOne(savedSpot.id, companyId);
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateSpotDto) {
    const spot = await this.findOne(id, companyId);
    const before = { ...spot };

    // Si se cambia la zona, validar que existe y pertenece al parqueadero
    if (dto.zoneId && dto.zoneId !== spot.zoneId) {
      const zone = await this.zoneRepository.findOne({
        where: {
          id: dto.zoneId,
          companyId,
          parkingLotId: spot.parkingLotId,
        },
      });

      if (!zone) {
        throw new BadRequestException('Zona no encontrada o no pertenece al parqueadero');
      }

      // Validar que el tipo de puesto está permitido en la nueva zona
      const spotType = dto.spotType ?? spot.spotType;
      if (!zone.allowedVehicleTypes.includes(spotType)) {
        throw new BadRequestException(
          `El tipo de vehículo ${spotType} no está permitido en la zona ${zone.name}`,
        );
      }
    }

    // Si se cambia el código, validar que no exista otro puesto con ese código
    if (dto.code && dto.code !== spot.code) {
      const existingSpot = await this.spotRepository.findOne({
        where: {
          companyId,
          parkingLotId: spot.parkingLotId,
          code: dto.code,
        },
      });

      if (existingSpot && existingSpot.id !== id) {
        throw new BadRequestException(
          `Ya existe un puesto con el código ${dto.code} en este parqueadero`,
        );
      }
    }

    Object.assign(spot, dto);
    const updated = await this.spotRepository.save(spot);

    // Auditoría
    await this.auditService.logAction({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'ParkingSpot',
      entityId: id,
      metadata: {
        before,
        after: updated,
      },
    });

    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string, userId: string) {
    const spot = await this.findOne(id, companyId);

    // No permitir eliminar puestos ocupados
    if (spot.status === 'OCCUPIED') {
      throw new BadRequestException('No se puede eliminar un puesto ocupado');
    }

    await this.spotRepository.remove(spot);

    // Auditoría
    await this.auditService.logAction({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'ParkingSpot',
      entityId: id,
      metadata: {
        code: spot.code,
        spotType: spot.spotType,
        zoneId: spot.zoneId,
      },
    });

    return { message: 'Puesto eliminado correctamente' };
  }

  async changeStatus(
    id: string,
    companyId: string,
    userId: string,
    dto: ChangeSpotStatusDto,
  ) {
    const spot = await this.findOne(id, companyId);
    const fromStatus = spot.status;

    if (fromStatus === dto.toStatus) {
      throw new BadRequestException('El estado nuevo es igual al estado actual');
    }

    // Crear registro de historial
    const history = this.historyRepository.create({
      companyId,
      parkingLotId: spot.parkingLotId,
      spotId: id,
      fromStatus,
      toStatus: dto.toStatus,
      reason: dto.reason,
      actorUserId: userId,
    });

    await this.historyRepository.save(history);

    // Actualizar estado del puesto
    spot.status = dto.toStatus;
    await this.spotRepository.save(spot);

    // Auditoría
    await this.auditService.logAction({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'ParkingSpot',
      entityId: id,
      metadata: {
        action: 'STATUS_CHANGE',
        fromStatus,
        toStatus: dto.toStatus,
        reason: dto.reason,
      },
    });

    return this.findOne(id, companyId);
  }

  async getStatusHistory(spotId: string, companyId: string) {
    const spot = await this.findOne(spotId, companyId);

    const history = await this.historyRepository.find({
      where: {
        spotId: spot.id,
        companyId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 50, // Últimos 50 cambios
    });

    return history;
  }
}
