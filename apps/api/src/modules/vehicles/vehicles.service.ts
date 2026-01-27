import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleType } from '../../entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
    user: User,
  ): Promise<Vehicle> {
    // Verificar si ya existe un vehículo con esa placa
    const existing = await this.vehicleRepository.findOne({
      where: { licensePlate: createVehicleDto.licensePlate.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException(
        `El vehículo con placa ${createVehicleDto.licensePlate} ya existe`,
      );
    }

    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      licensePlate: createVehicleDto.licensePlate.toUpperCase(),
      companyId: user.companyId,
    });

    const saved = await this.vehicleRepository.save(vehicle);

    // Registrar auditoría
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Vehicle',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        licensePlate: saved.licensePlate,
        vehicleType: saved.vehicleType,
      },
    });

    return saved;
  }

  async findAll(companyId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, companyId },
      relations: ['tickets'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    return vehicle;
  }

  async findByLicensePlate(
    licensePlate: string,
    companyId: string,
  ): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { licensePlate: licensePlate.toUpperCase(), companyId },
      relations: ['tickets'],
    });

    if (!vehicle) {
      throw new NotFoundException(
        `Vehículo con placa ${licensePlate} no encontrado`,
      );
    }

    return vehicle;
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    user: User,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id, user.companyId);

    // Si se actualiza la placa, verificar que no exista otra
    if (updateVehicleDto.licensePlate) {
      const existing = await this.vehicleRepository.findOne({
        where: {
          licensePlate: updateVehicleDto.licensePlate.toUpperCase(),
          companyId: user.companyId,
        },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Ya existe un vehículo con la placa ${updateVehicleDto.licensePlate}`,
        );
      }
    }

    Object.assign(vehicle, {
      ...updateVehicleDto,
      licensePlate: updateVehicleDto.licensePlate
        ? updateVehicleDto.licensePlate.toUpperCase()
        : vehicle.licensePlate,
    });

    const saved = await this.vehicleRepository.save(vehicle);

    // Registrar auditoría
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Vehicle',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        changes: updateVehicleDto,
      },
    });

    return saved;
  }

  async remove(id: string, user: User): Promise<void> {
    const vehicle = await this.findOne(id, user.companyId);

    await this.vehicleRepository.remove(vehicle);

    // Registrar auditoría
    await this.auditService.log({
      action: 'DELETE',
      entityType: 'Vehicle',
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        licensePlate: vehicle.licensePlate,
      },
    });
  }

  async blacklist(
    id: string,
    reason: string,
    user: User,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id, user.companyId);

    vehicle.isBlacklisted = true;
    vehicle.blacklistReason = reason;

    const saved = await this.vehicleRepository.save(vehicle);

    // Registrar auditoría
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Vehicle',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        licensePlate: saved.licensePlate,
        reason,
      },
    });

    return saved;
  }

  async unblacklist(id: string, user: User): Promise<Vehicle> {
    const vehicle = await this.findOne(id, user.companyId);

    vehicle.isBlacklisted = false;
    vehicle.blacklistReason = '';

    const saved = await this.vehicleRepository.save(vehicle);

    // Registrar auditoría
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Vehicle',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        licensePlate: saved.licensePlate,
      },
    });

    return saved;
  }

  async getBlacklisted(companyId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { companyId, isBlacklisted: true },
      order: { createdAt: 'DESC' },
    });
  }
}
