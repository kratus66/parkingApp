import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Holiday } from '../../entities/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
  ) {}

  async create(createDto: CreateHolidayDto): Promise<Holiday> {
    const holiday = this.holidayRepository.create(createDto);
    return this.holidayRepository.save(holiday);
  }

  async findAll(from?: string, to?: string): Promise<Holiday[]> {
    const query = this.holidayRepository.createQueryBuilder('holiday');

    if (from && to) {
      query.where('holiday.date BETWEEN :from AND :to', { from, to });
    } else if (from) {
      query.where('holiday.date >= :from', { from });
    } else if (to) {
      query.where('holiday.date <= :to', { to });
    }

    return query.orderBy('holiday.date', 'ASC').getMany();
  }

  async findByDate(date: string, country = 'CO'): Promise<Holiday | null> {
    return this.holidayRepository.findOne({
      where: { date, country },
    });
  }

  async isHoliday(date: string, country = 'CO'): Promise<boolean> {
    const holiday = await this.findByDate(date, country);
    return !!holiday;
  }

  async remove(id: string): Promise<void> {
    await this.holidayRepository.delete(id);
  }
}
