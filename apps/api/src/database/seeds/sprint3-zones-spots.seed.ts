import { DataSource } from 'typeorm';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { VehicleType } from '../../entities/parking-zone.entity';
import { SpotStatus } from '../../entities/parking-spot.entity';

export async function seedParkingZonesAndSpots(dataSource: DataSource) {
  const zoneRepository = dataSource.getRepository(ParkingZone);
  const spotRepository = dataSource.getRepository(ParkingSpot);

  // Nota: Asume que ya existe al menos una compañía y un parqueadero
  // Debes ajustar estos IDs según tu base de datos
  const COMPANY_ID = '95fa923b-61cf-4573-a051-753a74de5e04';
  const PARKING_LOT_ID = 'b04f6eec-264b-4143-9b71-814b05d4ffc4';

  console.log('🌱 Iniciando seed de zonas y puestos...');

  // Limpiar datos existentes de este parqueadero
  await spotRepository.delete({ parkingLotId: PARKING_LOT_ID });
  await zoneRepository.delete({ parkingLotId: PARKING_LOT_ID });

  // Crear zonas
  const zones = [
    {
      name: 'Zona A - Autos',
      description: 'Zona principal para automóviles',
      allowedVehicleTypes: [VehicleType.CAR],
      totalSpots: 25,
      spotPrefix: 'A',
    },
    {
      name: 'Zona B - Motos',
      description: 'Zona exclusiva para motocicletas',
      allowedVehicleTypes: [VehicleType.MOTORCYCLE],
      totalSpots: 15,
      spotPrefix: 'B',
    },
    {
      name: 'Zona C - Camiones/Buses',
      description: 'Zona para vehículos grandes',
      allowedVehicleTypes: [VehicleType.TRUCK_BUS],
      totalSpots: 10,
      spotPrefix: 'C',
    },
    {
      name: 'Zona D - Bicicletas',
      description: 'Zona para bicicletas',
      allowedVehicleTypes: [VehicleType.BICYCLE],
      totalSpots: 5,
      spotPrefix: 'D',
    },
  ];

  for (const zoneData of zones) {
    // Crear zona
    const zone = zoneRepository.create({
      companyId: COMPANY_ID,
      parkingLotId: PARKING_LOT_ID,
      name: zoneData.name,
      description: zoneData.description,
      allowedVehicleTypes: zoneData.allowedVehicleTypes,
    });

    const savedZone = await zoneRepository.save(zone);
    console.log(`✅ Zona creada: ${savedZone.name}`);

    // Crear puestos para esta zona
    const spots: Partial<ParkingSpot>[] = [];
    const vehicleType = zoneData.allowedVehicleTypes[0]; // Tomar el primer tipo permitido

    for (let i = 1; i <= zoneData.totalSpots; i++) {
      const code = `${zoneData.spotPrefix}-${i.toString().padStart(2, '0')}`;
      
      // Asignar estados aleatorios para simular ocupación real
      let status = SpotStatus.FREE;
      let priority = 0;

      // 30% ocupados
      if (Math.random() < 0.3) {
        status = SpotStatus.OCCUPIED;
      }
      // 5% fuera de servicio
      else if (Math.random() < 0.05) {
        status = SpotStatus.OUT_OF_SERVICE;
      }
      // 2% reservados
      else if (Math.random() < 0.02) {
        status = SpotStatus.RESERVED;
      }

      // Algunos puestos tienen prioridad (cerca de la entrada, por ejemplo)
      if (i <= 5) {
        priority = 10; // Alta prioridad para los primeros 5 puestos
      } else if (i <= 10) {
        priority = 5; // Prioridad media para los siguientes 5
      }

      spots.push({
        companyId: COMPANY_ID,
        parkingLotId: PARKING_LOT_ID,
        zoneId: savedZone.id,
        code,
        spotType: vehicleType,
        status,
        priority,
        notes: i <= 5 ? 'Cerca de la entrada' : undefined,
      });
    }

    await spotRepository.save(spots);
    console.log(`✅ ${spots.length} puestos creados para ${savedZone.name}`);
  }

  // Resumen
  const totalZones = await zoneRepository.count({ where: { parkingLotId: PARKING_LOT_ID } });
  const totalSpots = await spotRepository.count({ where: { parkingLotId: PARKING_LOT_ID } });
  const freeSpots = await spotRepository.count({
    where: { parkingLotId: PARKING_LOT_ID, status: SpotStatus.FREE },
  });
  const occupiedSpots = await spotRepository.count({
    where: { parkingLotId: PARKING_LOT_ID, status: SpotStatus.OCCUPIED },
  });

  console.log('\n📊 Resumen:');
  console.log(`   Total de zonas: ${totalZones}`);
  console.log(`   Total de puestos: ${totalSpots}`);
  console.log(`   Puestos libres: ${freeSpots}`);
  console.log(`   Puestos ocupados: ${occupiedSpots}`);
  console.log('\n✨ Seed completado exitosamente!\n');
}

// Script para ejecutar el seed directamente
if (require.main === module) {
  (async () => {
    const dataSource = (await import('../data-source')).default;
    
    try {
      await dataSource.initialize();
      console.log('📦 Conexión a la base de datos establecida\n');
      
      await seedParkingZonesAndSpots(dataSource);
      
      await dataSource.destroy();
      console.log('👋 Conexión cerrada');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error ejecutando seed:', error);
      process.exit(1);
    }
  })();
}
