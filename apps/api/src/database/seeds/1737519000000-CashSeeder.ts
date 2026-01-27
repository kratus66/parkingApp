import { DataSource } from 'typeorm';
import { CashPolicy } from '../../entities/cash-policy.entity';
import { CashShift, CashShiftStatus } from '../../entities/cash-shift.entity';
import { ParkingLot } from '../../modules/parking-lots/entities/parking-lot.entity';
import { User } from '../../modules/users/entities/user.entity';

export default class CashSeeder1737519000000 {
  public async run(dataSource: DataSource): Promise<void> {
    const policyRepo = dataSource.getRepository(CashPolicy);
    const shiftRepo = dataSource.getRepository(CashShift);
    const parkingLotRepo = dataSource.getRepository(ParkingLot);
    const userRepo = dataSource.getRepository(User);

    // Get first parking lot
    const parkingLot = await parkingLotRepo.findOne({
      where: {},
      relations: ['company'],
    });

    if (!parkingLot) {
      console.log('No parking lot found. Skipping cash seeder.');
      return;
    }

    // Get cashier user
    const cashier = await userRepo.findOne({
      where: { email: 'cajero@test.com' },
    });

    if (!cashier) {
      console.log('No cashier user found. Skipping cash shift seeder.');
    }

    // Create default policy
    const existingPolicy = await policyRepo.findOne({
      where: { parkingLotId: parkingLot.id },
    });

    if (!existingPolicy) {
      const policy = policyRepo.create({
        companyId: parkingLot.companyId,
        parkingLotId: parkingLot.id,
        requireOpenShiftForCheckout: true,
        defaultShiftHours: 8,
        allowMultipleOpenShiftsPerCashier: false,
        allowMultipleOpenShiftsPerParkingLot: true,
      });

      await policyRepo.save(policy);
      console.log(`✓ Created CashPolicy for parking lot: ${parkingLot.name}`);
    } else {
      console.log(`CashPolicy already exists for parking lot: ${parkingLot.name}`);
    }

    // Create sample CLOSED shift (demo data)
    if (cashier) {
      const existingShift = await shiftRepo.findOne({
        where: { cashierUserId: cashier.id },
      });

      if (!existingShift) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(8, 0, 0, 0);

        const closedAt = new Date(yesterday);
        closedAt.setHours(16, 0, 0, 0);

        const closedShift = shiftRepo.create({
          companyId: parkingLot.companyId,
          parkingLotId: parkingLot.id,
          cashierUserId: cashier.id,
          openedAt: yesterday,
          closedAt,
          status: CashShiftStatus.CLOSED,
          openingFloat: 50000,
          openingNotes: 'Turno de prueba - Seed data',
          closingNotes: 'Cierre sin novedades',
          expectedTotal: 250000,
          countedTotal: 250000,
          difference: 0,
        });

        await shiftRepo.save(closedShift);
        console.log(`✓ Created sample CLOSED shift for cashier: ${cashier.email}`);
      } else {
        console.log(`Sample shift already exists for cashier: ${cashier.email}`);
      }
    }

    console.log('Cash seeding completed!');
  }
}
