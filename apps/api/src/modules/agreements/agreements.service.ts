import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Agreement,
  AgreementDiscountType,
} from '../../entities/agreement.entity';
import { CreateAgreementDto, UpdateAgreementDto } from './dto/agreement.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AgreementsService {
  constructor(
    @InjectRepository(Agreement)
    private readonly agreementRepo: Repository<Agreement>,
  ) {}

  async findAll(
    user: User,
    opts: { activeOnly?: boolean; parkingLotId?: string } = {},
  ): Promise<Agreement[]> {
    const qb = this.agreementRepo
      .createQueryBuilder('a')
      .where('a.company_id = :companyId', { companyId: user.companyId })
      .orderBy('a.name', 'ASC');

    if (opts.activeOnly) {
      qb.andWhere('a.is_active = true');
    }
    if (opts.parkingLotId) {
      // Convenios globales (null) o del parqueadero indicado
      qb.andWhere('(a.parking_lot_id IS NULL OR a.parking_lot_id = :lot)', {
        lot: opts.parkingLotId,
      });
    }
    return qb.getMany();
  }

  async findOne(id: string, user: User): Promise<Agreement> {
    const agreement = await this.agreementRepo.findOne({
      where: { id, companyId: user.companyId },
    });
    if (!agreement) {
      throw new NotFoundException('Convenio no encontrado');
    }
    return agreement;
  }

  async create(dto: CreateAgreementDto, user: User): Promise<Agreement> {
    this.validateDiscount(dto.discountType, dto.discountValue);

    const exists = await this.agreementRepo.findOne({
      where: { companyId: user.companyId, name: dto.name },
    });
    if (exists) {
      throw new ConflictException('Ya existe un convenio con ese nombre');
    }

    const agreement = this.agreementRepo.create({
      ...dto,
      companyId: user.companyId,
      parkingLotId: dto.parkingLotId ?? null,
    });
    return this.agreementRepo.save(agreement);
  }

  async update(
    id: string,
    dto: UpdateAgreementDto,
    user: User,
  ): Promise<Agreement> {
    const agreement = await this.findOne(id, user);

    const discountType = dto.discountType ?? agreement.discountType;
    const discountValue = dto.discountValue ?? agreement.discountValue;
    this.validateDiscount(discountType, discountValue);

    Object.assign(agreement, dto);
    return this.agreementRepo.save(agreement);
  }

  async remove(id: string, user: User): Promise<void> {
    const agreement = await this.findOne(id, user);
    await this.agreementRepo.remove(agreement);
  }

  /**
   * Resuelve el convenio aplicable por ID dentro de una empresa. Devuelve null
   * si no se pasa ID o no existe. Usado por el checkout.
   */
  async resolve(
    agreementId: string | null | undefined,
    companyId: string,
  ): Promise<Agreement | null> {
    if (!agreementId) return null;
    return this.agreementRepo.findOne({
      where: { id: agreementId, companyId },
    });
  }

  private validateDiscount(type: AgreementDiscountType, value: number): void {
    if (type === AgreementDiscountType.PERCENT && (value < 0 || value > 100)) {
      throw new ConflictException(
        'El porcentaje de descuento debe estar entre 0 y 100',
      );
    }
    if (value < 0) {
      throw new ConflictException('El descuento no puede ser negativo');
    }
  }

  /**
   * Indica si el convenio está vigente en una fecha dada (por defecto hoy).
   */
  isValidOn(agreement: Agreement, date: Date = new Date()): boolean {
    if (!agreement.isActive) return false;
    const day = date.toISOString().slice(0, 10);
    if (agreement.validFrom && day < agreement.validFrom) return false;
    if (agreement.validUntil && day > agreement.validUntil) return false;
    return true;
  }

  /**
   * Calcula el monto de descuento (COP) para un subtotal dado, aplicando
   * validaciones de vigencia. Nunca excede el subtotal ni es negativo.
   */
  computeDiscount(
    agreement: Agreement | null | undefined,
    subtotal: number,
    date: Date = new Date(),
  ): number {
    if (!agreement || !this.isValidOn(agreement, date)) return 0;

    let discount = 0;
    if (agreement.discountType === AgreementDiscountType.PERCENT) {
      discount = Math.round((subtotal * agreement.discountValue) / 100);
    } else {
      discount = agreement.discountValue;
    }
    return Math.max(0, Math.min(discount, subtotal));
  }
}
