import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleType } from '../../entities/vehicle-v2.entity';
import { Customer } from '../../entities/customer.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { SearchQueryDto } from '../../common/dto/search-query.dto';
import { AuditService } from '../audit/audit.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class VehiclesV2Service {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Normaliza placa: trim, uppercase, sin espacios ni guiones
   */
  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase().replace(/[\s\-]/g, '');
  }

  /**
   * Normaliza código de bicicleta
   */
  private normalizeBicycleCode(code: string): string {
    return code.trim().toUpperCase();
  }

  /**
   * Validar reglas de negocio para vehículos
   */
  private validateVehicleData(dto: CreateVehicleDto | UpdateVehicleDto) {
    const vehicleType = dto.vehicleType;

    if (vehicleType === VehicleType.BICYCLE) {
      if (!dto.bicycleCode) {
        throw new BadRequestException(
          'El código de bicicleta es obligatorio para BICYCLE',
        );
      }
      if (dto.plate) {
        throw new BadRequestException(
          'Las bicicletas no deben tener placa, usa bicycleCode',
        );
      }
    } else {
      if (!dto.plate) {
        throw new BadRequestException(
          `La placa es obligatoria para vehículos tipo ${vehicleType}`,
        );
      }
      if (dto.bicycleCode) {
        throw new BadRequestException(
          'Solo las bicicletas pueden tener bicycleCode',
        );
      }
    }
  }

  /**
   * Buscar vehículos con paginación
   */
  async search(query: SearchQueryDto, user: User) {
    const { query: searchQuery, page = 1, limit = 20, sort = 'createdAt', order = 'DESC' } = query;

    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .where('vehicle.company_id = :companyId', { companyId: user.companyId });

    if (searchQuery) {
      qb.andWhere(
        `(
          vehicle.plate ILIKE :search OR
          vehicle.bicycle_code ILIKE :search OR
          customer.full_name ILIKE :search
        )`,
        { search: `%${searchQuery}%` },
      );
    }

    qb.orderBy(`vehicle.${sort}`, order).skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

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
   * Buscar vehículo por placa
   */
  async findByPlate(plate: string, companyId: string): Promise<Vehicle | null> {
    const normalized = this.normalizePlate(plate);

    // Búsqueda case-insensitive usando QueryBuilder
    const vehicle = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .leftJoinAndSelect('customer.consents', 'consents')
      .leftJoinAndSelect('customer.vehicles', 'vehicles')
      .where('vehicle.company_id = :companyId', { companyId })
      .andWhere('UPPER(REPLACE(REPLACE(vehicle.plate, \' \', \'\'), \'-\', \'\')) = :plate', { 
        plate: normalized 
      })
      .getOne();

    return vehicle;
  }

  /**
   * Buscar vehículo por código de bicicleta
   */
  async findByBicycleCode(
    bicycleCode: string,
    companyId: string,
  ): Promise<Vehicle | null> {
    const normalized = this.normalizeBicycleCode(bicycleCode);

    // Búsqueda case-insensitive usando QueryBuilder
    const vehicle = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .leftJoinAndSelect('customer.consents', 'consents')
      .leftJoinAndSelect('customer.vehicles', 'vehicles')
      .where('vehicle.company_id = :companyId', { companyId })
      .andWhere('UPPER(REPLACE(vehicle.bicycle_code, \' \', \'\')) = :bicycleCode', { 
        bicycleCode: normalized 
      })
      .getOne();

    return vehicle;
  }

  /**
   * Obtener vehículo por ID
   */
  async findOne(id: string, user: User): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, companyId: user.companyId },
      relations: ['customer'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    return vehicle;
  }

  /**
   * Crear vehículo
   */
  async create(createVehicleDto: CreateVehicleDto, user: User): Promise<Vehicle> {
    // Validar reglas de negocio
    this.validateVehicleData(createVehicleDto);

    // Verificar que el cliente existe y pertenece a la misma empresa
    const customer = await this.customerRepository.findOne({
      where: {
        id: createVehicleDto.customerId,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        `Cliente con ID ${createVehicleDto.customerId} no encontrado`,
      );
    }

    // Normalizar identificadores
    let normalizedPlate: string | null = null;
    let normalizedBicycleCode: string | null = null;

    if (createVehicleDto.plate) {
      normalizedPlate = this.normalizePlate(createVehicleDto.plate);

      // Verificar duplicados por placa
      const existingPlate = await this.vehicleRepository.findOne({
        where: { companyId: user.companyId, plate: normalizedPlate },
      });

      if (existingPlate) {
        throw new ConflictException(
          `Ya existe un vehículo con placa ${normalizedPlate}`,
        );
      }
    }

    if (createVehicleDto.bicycleCode) {
      normalizedBicycleCode = this.normalizeBicycleCode(
        createVehicleDto.bicycleCode,
      );

      // Verificar duplicados por código
      const existingCode = await this.vehicleRepository.findOne({
        where: { companyId: user.companyId, bicycleCode: normalizedBicycleCode },
      });

      if (existingCode) {
        throw new ConflictException(
          `Ya existe una bicicleta con código ${normalizedBicycleCode}`,
        );
      }
    }

    const vehicleData = {
      vehicleType: createVehicleDto.vehicleType,
      plate: normalizedPlate || undefined,
      bicycleCode: normalizedBicycleCode || undefined,
      brand: createVehicleDto.brand || undefined,
      model: createVehicleDto.model || undefined,
      color: createVehicleDto.color || undefined,
      notes: createVehicleDto.notes || undefined,
      customerId: createVehicleDto.customerId,
      companyId: user.companyId,
    };
    const vehicle = this.vehicleRepository.create(vehicleData);

    const saved = await this.vehicleRepository.save(vehicle);

    // Auditoría
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Vehicle',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { vehicle: saved },
    });

    return this.findOne(saved.id, user);
  }

  /**
   * Actualizar vehículo
   */
  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    user: User,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id, user);

    // REGLA: CASHIER solo puede editar color y notes
    if (user.role === UserRole.CASHIER) {
      const allowedFields = ['color', 'notes'];
      const updateFields = Object.keys(updateVehicleDto);
      const forbidden = updateFields.filter((f) => !allowedFields.includes(f));

      if (forbidden.length > 0) {
        throw new ForbiddenException(
          `CASHIER solo puede editar color y notas. Campos no permitidos: ${forbidden.join(', ')}`,
        );
      }
    }

    // Validar reglas si se cambia el tipo
    if (updateVehicleDto.vehicleType) {
      this.validateVehicleData({
        ...vehicle,
        ...updateVehicleDto,
      } as any);
    }

    const before = { ...vehicle };

    Object.assign(vehicle, updateVehicleDto);

    // Normalizar si se actualiza
    if (updateVehicleDto.plate) {
      vehicle.plate = this.normalizePlate(updateVehicleDto.plate);

      // Verificar duplicados
      const existing = await this.vehicleRepository.findOne({
        where: { companyId: user.companyId, plate: vehicle.plate },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe un vehículo con placa ${vehicle.plate}`,
        );
      }
    }

    if (updateVehicleDto.bicycleCode) {
      vehicle.bicycleCode = this.normalizeBicycleCode(
        updateVehicleDto.bicycleCode,
      );

      // Verificar duplicados
      const existing = await this.vehicleRepository.findOne({
        where: { companyId: user.companyId, bicycleCode: vehicle.bicycleCode },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe una bicicleta con código ${vehicle.bicycleCode}`,
        );
      }
    }

    const updated = await this.vehicleRepository.save(vehicle);

    // Auditoría
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Vehicle',
      entityId: updated.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { before, after: updated },
    });

    return this.findOne(updated.id, user);
  }
}
