import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CustomersService } from '../customers/customers.service';
import { VehiclesV2Service } from '../vehicles-v2/vehicles-v2.service';
import { IdentifyDto } from './dto/identify.dto';
import { DashboardStatsQueryDto } from './dto/dashboard-stats.dto';
import { User } from '../users/entities/user.entity';
import { Customer } from '../../entities/customer.entity';
import { Vehicle } from '../../entities/vehicle-v2.entity';
import { ParkingSession, ParkingSessionStatus } from '../../entities/parking-session.entity';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { Ticket } from '../../entities/ticket.entity';

@Injectable()
export class OpsService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly vehiclesService: VehiclesV2Service,
    @InjectRepository(ParkingSession)
    private readonly sessionRepo: Repository<ParkingSession>,
    @InjectRepository(ParkingSpot)
    private readonly spotRepo: Repository<ParkingSpot>,
    @InjectRepository(ParkingZone)
    private readonly zoneRepo: Repository<ParkingZone>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  /**
   * Identificar cliente por vehículo o documento
   * Endpoint para flujo rápido de taquilla
   */
  async identify(identifyDto: IdentifyDto, user: User) {
    console.log('🔍 Identify request:', identifyDto);
    console.log('👤 User companyId:', user.companyId);
    
    let customer: Customer | null = null;
    let vehicles: Vehicle[] = [];

    // Intentar por placa
    if (identifyDto.vehiclePlate) {
      console.log('🚗 Buscando por placa:', identifyDto.vehiclePlate);
      const vehicle = await this.vehiclesService.findByPlate(
        identifyDto.vehiclePlate,
        user.companyId,
      );
      console.log('✅ Vehículo encontrado:', vehicle ? 'SÍ' : 'NO');

      if (vehicle) {
        customer = vehicle.customer;
        vehicles = customer.vehicles || [vehicle];
        console.log('👤 Cliente encontrado:', customer?.fullName);
        console.log('🚗 Vehículos del cliente:', vehicles.length);
      }
    }

    // Intentar por código de bicicleta
    if (!customer && identifyDto.bicycleCode) {
      const vehicle = await this.vehiclesService.findByBicycleCode(
        identifyDto.bicycleCode,
        user.companyId,
      );

      if (vehicle) {
        customer = vehicle.customer;
        vehicles = customer.vehicles || [vehicle];
      }
    }

    // Intentar por documento
    if (
      !customer &&
      identifyDto.documentType &&
      identifyDto.documentNumber
    ) {
      customer = await this.customersService.findByDocument(
        identifyDto.documentType,
        identifyDto.documentNumber,
        user.companyId,
      );

      if (customer) {
        vehicles = customer.vehicles || [];
      }
    }

    // Preparar respuesta
    if (customer) {
      // Obtener estado actual de consentimientos
      const consentsData = customer.consents || [];
      const whatsappConsent = consentsData
        .filter((c) => c.channel === 'WHATSAPP')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      const emailConsent = consentsData
        .filter((c) => c.channel === 'EMAIL')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      return {
        found: true,
        customer: {
          id: customer.id,
          documentType: customer.documentType,
          documentNumber: customer.documentNumber,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes,
          isActive: customer.isActive,
        },
        vehicles: vehicles.map((v) => ({
          id: v.id,
          vehicleType: v.vehicleType,
          plate: v.plate,
          bicycleCode: v.bicycleCode,
          brand: v.brand,
          model: v.model,
          color: v.color,
          isActive: v.isActive,
        })),
        consentsCurrent: {
          whatsapp: whatsappConsent
            ? {
                status: whatsappConsent.status,
                source: whatsappConsent.source,
                grantedAt: whatsappConsent.grantedAt,
                revokedAt: whatsappConsent.revokedAt,
              }
            : null,
          email: emailConsent
            ? {
                status: emailConsent.status,
                source: emailConsent.source,
                grantedAt: emailConsent.grantedAt,
                revokedAt: emailConsent.revokedAt,
              }
            : null,
        },
      };
    }

    // No encontrado
    return {
      found: false,
      suggestions: this.buildSuggestions(identifyDto),
    };
  }

  /**
   * Construir sugerencias cuando no se encuentra
   */
  private buildSuggestions(identifyDto: IdentifyDto): string[] {
    const suggestions: string[] = [];

    if (identifyDto.vehiclePlate || identifyDto.bicycleCode) {
      suggestions.push('Crear nuevo cliente y registrar vehículo');
    }

    if (identifyDto.documentType && identifyDto.documentNumber) {
      suggestions.push('Crear cliente con el documento proporcionado');
    }

    return suggestions;
  }

  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(user: User, dto: DashboardStatsQueryDto) {
    const parkingLotId = dto.parkingLotId || user.parkingLotId;

    if (!parkingLotId) {
      throw new Error('No se especificó un parqueadero');
    }

    // Sesiones activas (vehículos activos)
    const activeSessions = await this.sessionRepo.count({
      where: {
        parkingLotId,
        status: ParkingSessionStatus.ACTIVE,
      },
    });

    // Obtener zonas y calcular totales por tipo de vehículo
    const zones = await this.zoneRepo.find({
      where: { parkingLotId },
    });

    const vehicleTypeStats = await Promise.all([
      this.getVehicleTypeOccupancy(parkingLotId, 'CAR'),
      this.getVehicleTypeOccupancy(parkingLotId, 'BICYCLE'),
      this.getVehicleTypeOccupancy(parkingLotId, 'TRUCK_BUS'),
      this.getVehicleTypeOccupancy(parkingLotId, 'MOTORCYCLE'),
    ]);

    console.log('🔍 vehicleTypeStats:', JSON.stringify(vehicleTypeStats, null, 2));

    // Calcular totales
    const totalOccupied = vehicleTypeStats.reduce((sum, stat) => sum + stat.occupied, 0);
    const totalCapacity = vehicleTypeStats.reduce((sum, stat) => sum + stat.capacity, 0);
    const availableSpots = totalCapacity - totalOccupied;

    // Recaudo del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyRevenue = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select('SUM(ticket.amount)', 'total')
      .where('ticket.parkingLotId = :parkingLotId', { parkingLotId })
      .andWhere('ticket.paidAt >= :today', { today })
      .andWhere('ticket.paidAt < :tomorrow', { tomorrow })
      .getRawOne();

    // Entradas de hoy
    const entriesToday = await this.sessionRepo.count({
      where: {
        parkingLotId,
        entryAt: MoreThanOrEqual(today),
      },
    });

    // Salidas de hoy
    const exitsToday = await this.sessionRepo.count({
      where: {
        parkingLotId,
        exitAt: MoreThanOrEqual(today),
        status: ParkingSessionStatus.CLOSED,
      },
    });

    const dashboardResponse = {
      activeVehicles: activeSessions,
      availableSpots,
      dailyRevenue: parseFloat(dailyRevenue?.total || '0'),
      entriesToday,
      exitsToday,
      totalOccupancy: {
        occupied: totalOccupied,
        total: totalCapacity,
        percentage: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
      },
      vehicleTypes: [
        {
          type: 'Auto',
          ...vehicleTypeStats[0],
        },
        {
          type: 'Bicicleta',
          ...vehicleTypeStats[1],
        },
        {
          type: 'Camión',
          ...vehicleTypeStats[2],
        },
        {
          type: 'Bus',
          ...vehicleTypeStats[2], // TRUCK_BUS se usa para ambos
        },
      ],
      alerts: await this.getAlerts(parkingLotId),
    };

    console.log('✅ Dashboard Response:', JSON.stringify(dashboardResponse, null, 2));

    return dashboardResponse;
  }

  /**
   * Obtener ocupación por tipo de vehículo
   */
  private async getVehicleTypeOccupancy(
    parkingLotId: string,
    vehicleType: 'CAR' | 'BICYCLE' | 'TRUCK_BUS' | 'MOTORCYCLE',
  ) {
    // Obtener capacidad total por zona
    const spots = await this.spotRepo.find({
      where: { parkingLotId },
      relations: ['zone'],
    });

    // Filtrar spots que están en zonas que permiten este tipo de vehículo
    const filteredSpots = spots.filter(spot => 
      spot.zone?.allowedVehicleTypes?.includes(vehicleType as any)
    );
    
    const capacity = filteredSpots.length;

    // Contar ocupados entre los spots filtrados
    const occupied = filteredSpots.filter(spot => spot.status === 'OCCUPIED').length;

    const percentage = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

    return {
      occupied,
      capacity,
      percentage,
    };
  }

  /**
   * Obtener alertas del sistema
   */
  private async getAlerts(parkingLotId: string) {
    const alerts: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: Date;
    }> = [];

    // Verificar ocupación crítica por tipo de vehículo
    const vehicleTypes = ['CAR', 'BICYCLE', 'TRUCK_BUS', 'MOTORCYCLE'];
    const typeNames = {
      CAR: 'Autos',
      BICYCLE: 'Bicicletas',
      TRUCK_BUS: 'Camiones',
      MOTORCYCLE: 'Motos',
    };

    for (const type of vehicleTypes) {
      const stats = await this.getVehicleTypeOccupancy(parkingLotId, type as any);
      
      if (stats.percentage >= 90) {
        alerts.push({
          id: `critical-${type}`,
          type: 'critical',
          message: `Capacidad crítica en ${typeNames[type]} (${stats.percentage}%)`,
          timestamp: new Date(),
        });
      } else if (stats.percentage >= 80) {
        alerts.push({
          id: `warning-${type}`,
          type: 'warning',
          message: `${typeNames[type]} casi lleno (${stats.percentage}%)`,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }
}
