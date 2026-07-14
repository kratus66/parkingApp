import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BillingResolution } from '../../entities/billing-resolution.entity';
import { UpsertResolutionDto } from './dto/billing.dto';
import { User } from '../users/entities/user.entity';

export interface NextNumberResult {
  invoiceNumber: string;
  resolutionNumber: string | null;
  technicalKey: string | null;
  environment: number;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingResolution)
    private readonly resolutionRepo: Repository<BillingResolution>,
  ) {}

  async getForLot(parkingLotId: string, companyId: string): Promise<BillingResolution | null> {
    return this.resolutionRepo.findOne({ where: { parkingLotId, companyId } });
  }

  async upsert(dto: UpsertResolutionDto, user: User): Promise<BillingResolution> {
    if (dto.rangeTo < dto.rangeFrom) {
      throw new ConflictException('El rango final debe ser mayor o igual al inicial');
    }

    let resolution = await this.resolutionRepo.findOne({
      where: { parkingLotId: dto.parkingLotId, companyId: user.companyId },
    });

    if (resolution) {
      Object.assign(resolution, dto);
    } else {
      resolution = this.resolutionRepo.create({
        ...dto,
        companyId: user.companyId,
        currentNumber: dto.rangeFrom - 1,
      });
    }
    return this.resolutionRepo.save(resolution);
  }

  async findForLotOrFail(parkingLotId: string, companyId: string): Promise<BillingResolution> {
    const res = await this.getForLot(parkingLotId, companyId);
    if (!res) {
      throw new NotFoundException('No hay resolución de facturación para este parqueadero');
    }
    return res;
  }

  /**
   * Reserva el siguiente número consecutivo dentro del rango de la resolución,
   * con bloqueo pesimista para evitar duplicados. Debe llamarse dentro de una
   * transacción (se pasa el EntityManager). Si no hay resolución configurada,
   * devuelve null para que el llamador use su numeración de respaldo.
   */
  async nextNumber(
    manager: EntityManager,
    parkingLotId: string,
    companyId: string,
  ): Promise<NextNumberResult | null> {
    const resolution = await manager.findOne(BillingResolution, {
      where: { parkingLotId, companyId, isActive: true },
      lock: { mode: 'pessimistic_write' },
    });

    if (!resolution) return null;

    const next = resolution.currentNumber + 1;
    if (next > resolution.rangeTo) {
      throw new ConflictException(
        `Se agotó el rango de numeración de la resolución ${resolution.resolutionNumber} (máximo ${resolution.rangeTo}). Solicite una nueva resolución.`,
      );
    }

    resolution.currentNumber = next;
    await manager.save(resolution);

    return {
      invoiceNumber: `${resolution.prefix}${next}`,
      resolutionNumber: resolution.resolutionNumber,
      technicalKey: resolution.technicalKey,
      environment: resolution.environment,
    };
  }
}
