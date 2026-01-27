import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const { email, password } = loginDto;

    // Buscar usuario con relaciones usando QueryBuilder para evitar problemas de alias
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .andWhere('user.is_active = true')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.parkingLot', 'parkingLot')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Create audit log for login
    await this.auditLogRepository.save({
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      actorUserId: user.id,
      entityName: 'User',
      entityId: user.id,
      action: AuditAction.LOGIN,
      ip,
      userAgent,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
        },
        parkingLot: user.parkingLot
          ? {
              id: user.parkingLot.id,
              name: user.parkingLot.name,
            }
          : null,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['company', 'parkingLot'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    return user;
  }
}
