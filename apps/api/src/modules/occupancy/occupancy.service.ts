import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  // Inject,
  // forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ParkingSpot, SpotStatus } from '../../entities/parking-spot.entity';
import { ParkingZone, VehicleType } from '../../entities/parking-zone.entity';
import { SpotStatusHistory } from '../../entities/spot-status-history.entity';
import { AuditService } from '../audit/audit.service';
// import { RealtimeGateway } from '../realtime/realtime.gateway'; // Temporalmente comentado
import { AssignSpotDto } from './dto/assign-spot.dto';
import { OccupancyQueryDto } from './dto/occupancy-query.dto';

export interface OccupancySummary {
  total: number;
  free: number;
  occupied: number;
  reserved: number;
  outOfService: number;
  byType: {
    [key in VehicleType]: {
      total: number;
      free: number;
      occupied: number;
    };
  };
  byZone: Array<{
    zoneId: string;
    zoneName: string;
    total: number;
    free: number;
    occupied: number;
  }>;
}

@Injectable()
export class OccupancyService {
  constructor(
    @InjectRepository(ParkingSpot)
    private readonly spotRepository: Repository<ParkingSpot>,
    @InjectRepository(ParkingZone)
    private readonly zoneRepository: Repository<ParkingZone>,
    @InjectRepository(SpotStatusHistory)
    private readonly historyRepository: Repository<SpotStatusHistory>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    // @Inject(forwardRef(() => RealtimeGateway))
    // private readonly realtimeGateway: RealtimeGateway, // Temporalmente comentado
  ) {}

  async getSummary(companyId: string, dto: OccupancyQueryDto): Promise<OccupancySummary> {
    const { parkingLotId, zoneId } = dto;

    // Consulta base
    const queryBuilder = this.spotRepository
      .createQueryBuilder('spot')
      .leftJoinAndSelect('spot.zone', 'zone')
      .where('spot.companyId = :companyId', { companyId })
      .andWhere('spot.parkingLotId = :parkingLotId', { parkingLotId });

    if (zoneId) {
      queryBuilder.andWhere('spot.zoneId = :zoneId', { zoneId });
    }

    const spots = await queryBuilder.getMany();

    // Inicializar contadores por tipo
    const byType: OccupancySummary['byType'] = {
      BICYCLE: { total: 0, free: 0, occupied: 0 },
      MOTORCYCLE: { total: 0, free: 0, occupied: 0 },
      CAR: { total: 0, free: 0, occupied: 0 },
      TRUCK_BUS: { total: 0, free: 0, occupied: 0 },
    };

    // Inicializar contadores por zona
    const byZoneMap = new Map<
      string,
      { zoneId: string; zoneName: string; total: number; free: number; occupied: number }
    >();

    let total = 0;
    let free = 0;
    let occupied = 0;
    let reserved = 0;
    let outOfService = 0;

    spots.forEach((spot) => {
      total++;
      byType[spot.spotType].total++;

      // Contadores por estado
      if (spot.status === SpotStatus.FREE) {
        free++;
        byType[spot.spotType].free++;
      } else if (spot.status === SpotStatus.OCCUPIED) {
        occupied++;
        byType[spot.spotType].occupied++;
      } else if (spot.status === SpotStatus.RESERVED) {
        reserved++;
      } else if (spot.status === SpotStatus.OUT_OF_SERVICE) {
        outOfService++;
      }

      // Contadores por zona
      if (spot.zone) {
        const zoneKey = spot.zone.id;
        if (!byZoneMap.has(zoneKey)) {
          byZoneMap.set(zoneKey, {
            zoneId: spot.zone.id,
            zoneName: spot.zone.name,
            total: 0,
            free: 0,
            occupied: 0,
          });
        }
        const zoneStats = byZoneMap.get(zoneKey)!;
        zoneStats.total++;
        if (spot.status === SpotStatus.FREE) {
          zoneStats.free++;
        } else if (spot.status === SpotStatus.OCCUPIED) {
          zoneStats.occupied++;
        }
      }
    });

    const byZone = Array.from(byZoneMap.values());

    return {
      total,
      free,
      occupied,
      reserved,
      outOfService,
      byType,
      byZone,
    };
  }

  async getAvailableSpots(companyId: string, parkingLotId: string, vehicleType: VehicleType) {
    console.log('🔍 [getAvailableSpots] Buscando puestos con:', { companyId, parkingLotId, vehicleType });
    
    const spots = await this.spotRepository
      .createQueryBuilder('spot')
      .leftJoinAndSelect('spot.zone', 'zone')
      .where('spot.companyId = :companyId', { companyId })
      .andWhere('spot.parkingLotId = :parkingLotId', { parkingLotId })
      .andWhere('spot.spotType = :vehicleType', { vehicleType })
      .andWhere('spot.status = :status', { status: SpotStatus.FREE })
      .orderBy('spot.priority', 'DESC')
      .addOrderBy('spot.code', 'ASC')
      .getMany();

    console.log('✅ [getAvailableSpots] Puestos encontrados:', spots.length);
    console.log('📋 [getAvailableSpots] Puestos:', spots.map(s => ({ code: s.code, type: s.spotType, status: s.status })));

    return spots;
  }

  async assignSpot(companyId: string, userId: string, dto: AssignSpotDto) {
    const { parkingLotId, vehicleType } = dto;

    // Usar transacción para evitar race conditions
    return await this.dataSource.transaction(async (manager) => {
      // Buscar puesto disponible con bloqueo pesimista
      const spot = await manager
        .createQueryBuilder(ParkingSpot, 'spot')
        .setLock('pessimistic_write')
        .where('spot.companyId = :companyId', { companyId })
        .andWhere('spot.parkingLotId = :parkingLotId', { parkingLotId })
        .andWhere('spot.spotType = :vehicleType', { vehicleType })
        .andWhere('spot.status = :status', { status: SpotStatus.FREE })
        .orderBy('spot.priority', 'DESC')
        .addOrderBy('spot.code', 'ASC')
        .getOne();

      if (!spot) {
        throw new ConflictException(
          `No hay puestos disponibles para el tipo de vehículo ${vehicleType}`,
        );
      }

      // Cambiar estado a OCCUPIED
      const previousStatus = spot.status;
      spot.status = SpotStatus.OCCUPIED;
      await manager.save(ParkingSpot, spot);

      // Crear registro de historial
      const history = manager.create(SpotStatusHistory, {
        companyId,
        parkingLotId: spot.parkingLotId,
        spotId: spot.id,
        fromStatus: previousStatus,
        toStatus: SpotStatus.OCCUPIED,
        reason: 'Asignación automática',
        actorUserId: userId,
      });

      await manager.save(SpotStatusHistory, history);

      // Auditoría
      await this.auditService.logAction({
        companyId,
        userId,
        action: 'UPDATE',
        entityType: 'ParkingSpot',
        entityId: spot.id,
        metadata: {
          action: 'AUTO_ASSIGN',
          vehicleType,
          spotCode: spot.code,
        },
      });

      // Emitir evento WebSocket (temporalmente comentado)
      // this.realtimeGateway.emitSpotUpdated(parkingLotId, spot);
      
      // Emitir actualización de ocupación (temporalmente comentado)
      // const summary = await this.getSummary(companyId, { parkingLotId });
      // this.realtimeGateway.emitOccupancyUpdated(parkingLotId, summary);

      return spot;
    });
  }

  async releaseSpot(companyId: string, userId: string, spotId: string, reason?: string) {
    return await this.dataSource.transaction(async (manager) => {
      const spot = await manager.findOne(ParkingSpot, {
        where: { id: spotId, companyId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!spot) {
        throw new NotFoundException(`Puesto con ID ${spotId} no encontrado`);
      }

      if (spot.status !== SpotStatus.OCCUPIED) {
        throw new BadRequestException('El puesto no está ocupado');
      }

      // Cambiar estado a FREE
      const previousStatus = spot.status;
      spot.status = SpotStatus.FREE;
      await manager.save(ParkingSpot, spot);

      // Crear registro de historial
      const history = manager.create(SpotStatusHistory, {
        companyId,
        parkingLotId: spot.parkingLotId,
        spotId: spot.id,
        fromStatus: previousStatus,
        toStatus: SpotStatus.FREE,
        reason: reason || 'Liberación de puesto',
        actorUserId: userId,
      });

      await manager.save(SpotStatusHistory, history);

      // Auditoría
      await this.auditService.logAction({
        companyId,
        userId,
        action: 'UPDATE',
        entityType: 'ParkingSpot',
        entityId: spot.id,
        metadata: {
          action: 'RELEASE',
          spotCode: spot.code,
          reason,
        },
      });

      // Emitir evento WebSocket (temporalmente comentado)
      // this.realtimeGateway.emitSpotUpdated(spot.parkingLotId, spot);
      
      // Emitir actualización de ocupación (temporalmente comentado)
      // const summary = await this.getSummary(companyId, { parkingLotId: spot.parkingLotId });
      // this.realtimeGateway.emitOccupancyUpdated(spot.parkingLotId, summary);

      return spot;
    });
  }

  // Métodos adicionales para Sprint 4
  async findAvailableSpot(parkingLotId: string, vehicleType?: VehicleType) {
    const where: any = {
      parkingLotId,
      status: SpotStatus.FREE,
    };

    // Si se especifica tipo de vehículo, filtrar por él
    if (vehicleType) {
      where.spotType = vehicleType;
    }

    return this.spotRepository.findOne({
      where,
      order: {
        priority: 'DESC', // Primero por prioridad
        code: 'ASC', // Luego por código
      },
    });
  }

  async occupySpot(spotId: string, sessionId: string, queryRunner?: any) {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;
    
    const spot = await manager.findOne(ParkingSpot, {
      where: { id: spotId },
    });

    if (!spot) {
      throw new NotFoundException('Espacio no encontrado');
    }

    if (spot.status !== SpotStatus.FREE) {
      throw new ConflictException('El espacio no está disponible');
    }

    spot.status = SpotStatus.OCCUPIED;
    spot.sessionId = sessionId;
    spot.lastStatusChange = new Date();

    return manager.save(spot);
  }

  async releaseSpotSimple(spotId: string, queryRunner?: any) {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;
    
    const spot = await manager.findOne(ParkingSpot, {
      where: { id: spotId },
    });

    if (!spot) {
      throw new NotFoundException('Espacio no encontrado');
    }

    spot.status = SpotStatus.FREE;
    spot.sessionId = null;
    spot.lastStatusChange = new Date();

    return manager.save(spot);
  }

  async findSpotById(spotId: string) {
    return this.spotRepository.findOne({
      where: { id: spotId },
    });
  }
}
