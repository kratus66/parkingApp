import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLot } from './entities/parking-lot.entity';

@Injectable()
export class ParkingLotsService {
  constructor(
    @InjectRepository(ParkingLot)
    private readonly parkingLotRepository: Repository<ParkingLot>,
  ) {}

  async findAll(companyId?: string) {
    const where: any = { isActive: true };
    if (companyId) {
      where.companyId = companyId;
    }

    return this.parkingLotRepository.find({
      where,
      relations: ['company'],
    });
  }
}
