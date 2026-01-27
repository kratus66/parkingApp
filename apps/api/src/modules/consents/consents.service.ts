import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Consent,
  ConsentChannel,
  ConsentStatus,
} from '../../entities/consent.entity';
import { Customer } from '../../entities/customer.entity';
import { CreateConsentDto } from './dto/create-consent.dto';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ConsentsService {
  constructor(
    @InjectRepository(Consent)
    private readonly consentRepository: Repository<Consent>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Crear consentimiento (grant o revoke)
   */
  async create(createConsentDto: CreateConsentDto, user: User): Promise<Consent> {
    // Verificar que el cliente existe y pertenece a la empresa
    const customer = await this.customerRepository.findOne({
      where: {
        id: createConsentDto.customerId,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        `Cliente con ID ${createConsentDto.customerId} no encontrado`,
      );
    }

    const consentData = {
      customerId: createConsentDto.customerId,
      channel: createConsentDto.channel,
      status: createConsentDto.status,
      source: createConsentDto.source,
      evidenceText: createConsentDto.evidenceText,
      companyId: user.companyId,
      actorUserId: user.id,
      grantedAt:
        createConsentDto.status === ConsentStatus.GRANTED ? new Date() : undefined,
      revokedAt:
        createConsentDto.status === ConsentStatus.REVOKED ? new Date() : undefined,
    };
    const consent = this.consentRepository.create(consentData);

    const saved = await this.consentRepository.save(consent);

    // Auditoría
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Consent',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { consent: saved },
    });

    return saved;
  }

  /**
   * Obtener historial completo de consentimientos de un cliente
   */
  async getCustomerConsents(customerId: string, user: User) {
    // Verificar que el cliente existe
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
    }

    // Obtener todos los consentimientos
    const allConsents = await this.consentRepository.find({
      where: {
        customerId,
        companyId: user.companyId,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['actorUser'],
    });

    // Obtener estado actual por canal
    const currentWhatsapp = await this.getCurrentConsent(
      customerId,
      ConsentChannel.WHATSAPP,
      user.companyId,
    );

    const currentEmail = await this.getCurrentConsent(
      customerId,
      ConsentChannel.EMAIL,
      user.companyId,
    );

    return {
      current: {
        whatsapp: currentWhatsapp,
        email: currentEmail,
      },
      history: allConsents,
    };
  }

  /**
   * Obtener el consentimiento vigente actual para un canal
   */
  private async getCurrentConsent(
    customerId: string,
    channel: ConsentChannel,
    companyId: string,
  ): Promise<Consent | null> {
    return this.consentRepository.findOne({
      where: {
        customerId,
        channel,
        companyId,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['actorUser'],
    });
  }
}
