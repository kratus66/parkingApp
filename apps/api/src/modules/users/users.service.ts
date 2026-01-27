import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(companyId?: string) {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    return this.userRepository.find({
      where,
      relations: ['company', 'parkingLot'],
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        companyId: true,
        parkingLotId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['company', 'parkingLot'],
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        companyId: true,
        parkingLotId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }
}
