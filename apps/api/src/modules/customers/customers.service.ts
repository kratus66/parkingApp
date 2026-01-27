import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Customer, DocumentType } from '../../entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchQueryDto } from '../../common/dto/search-query.dto';
import { AuditService } from '../audit/audit.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Normaliza número de documento: trim y uppercase
   */
  private normalizeDocumentNumber(documentNumber: string): string {
    return documentNumber.trim().toUpperCase();
  }

  /**
   * Buscar clientes con paginación
   */
  async search(query: SearchQueryDto, user: User) {
    const { query: searchQuery, page = 1, limit = 20, sort = 'createdAt', order = 'DESC' } = query;

    const qb = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.company_id = :companyId', { companyId: user.companyId });

    if (searchQuery) {
      qb.andWhere(
        `(
          customer.document_number ILIKE :search OR
          customer.full_name ILIKE :search OR
          customer.phone ILIKE :search OR
          customer.email ILIKE :search
        )`,
        { search: `%${searchQuery}%` },
      );
    }

    qb.orderBy(`customer.${sort}`, order).skip((page - 1) * limit).take(limit);

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
   * Obtener cliente por ID
   */
  async findOne(id: string, user: User): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId: user.companyId },
      relations: ['vehicles', 'consents'],
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return customer;
  }

  /**
   * Buscar cliente por documento
   */
  async findByDocument(
    documentType: DocumentType,
    documentNumber: string,
    companyId: string,
  ): Promise<Customer | null> {
    const normalized = this.normalizeDocumentNumber(documentNumber);

    // Búsqueda case-insensitive y quitando espacios
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.vehicles', 'vehicles')
      .leftJoinAndSelect('customer.consents', 'consents')
      .where('customer.company_id = :companyId', { companyId })
      .andWhere('customer.document_type = :documentType', { documentType })
      .andWhere('UPPER(REPLACE(customer.document_number, \' \', \'\')) = :documentNumber', { 
        documentNumber: normalized 
      })
      .getOne();

    return customer;
  }

  /**
   * Crear cliente
   */
  async create(
    createCustomerDto: CreateCustomerDto,
    user: User,
  ): Promise<Customer> {
    const normalized = this.normalizeDocumentNumber(
      createCustomerDto.documentNumber,
    );

    // Verificar si ya existe
    const existing = await this.customerRepository.findOne({
      where: {
        companyId: user.companyId,
        documentType: createCustomerDto.documentType,
        documentNumber: normalized,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un cliente con ${createCustomerDto.documentType} ${normalized}`,
      );
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      documentNumber: normalized,
      companyId: user.companyId,
    });

    const saved = await this.customerRepository.save(customer);

    // Auditoría
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Customer',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { customer: saved },
    });

    return saved;
  }

  /**
   * Actualizar cliente
   */
  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    user: User,
  ): Promise<Customer> {
    const customer = await this.findOne(id, user);

    // REGLA: Solo SUPERVISOR/ADMIN pueden cambiar documentType/documentNumber
    if (
      (updateCustomerDto.documentType || updateCustomerDto.documentNumber) &&
      user.role === UserRole.CASHIER
    ) {
      throw new ForbiddenException(
        'Solo SUPERVISOR o ADMIN pueden modificar el tipo/número de documento',
      );
    }

    // Si se cambia el documento, verificar duplicados
    if (updateCustomerDto.documentNumber || updateCustomerDto.documentType) {
      const newDocType = updateCustomerDto.documentType || customer.documentType;
      const newDocNumber = updateCustomerDto.documentNumber
        ? this.normalizeDocumentNumber(updateCustomerDto.documentNumber)
        : customer.documentNumber;

      if (
        newDocType !== customer.documentType ||
        newDocNumber !== customer.documentNumber
      ) {
        const existing = await this.customerRepository.findOne({
          where: {
            companyId: user.companyId,
            documentType: newDocType,
            documentNumber: newDocNumber,
          },
        });

        if (existing && existing.id !== id) {
          throw new ConflictException(
            `Ya existe un cliente con ${newDocType} ${newDocNumber}`,
          );
        }
      }
    }

    const before = { ...customer };

    Object.assign(customer, updateCustomerDto);

    if (updateCustomerDto.documentNumber) {
      customer.documentNumber = this.normalizeDocumentNumber(
        updateCustomerDto.documentNumber,
      );
    }

    const updated = await this.customerRepository.save(customer);

    // Auditoría
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: updated.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: { before, after: updated },
    });

    return updated;
  }

  /**
   * Obtener vehículos de un cliente
   */
  async getVehicles(id: string, user: User) {
    const customer = await this.findOne(id, user);
    return customer.vehicles;
  }

  /**
   * Obtener consentimientos de un cliente
   */
  async getConsents(id: string, user: User) {
    const customer = await this.findOne(id, user);
    return customer.consents;
  }
}
