/**
 * Mock data para el dashboard de parqueadero
 * Este archivo simula datos en tiempo real del parqueadero
 */

export interface VehicleTypeData {
  type: 'Auto' | 'Bicicleta' | 'Camión' | 'Bus';
  occupied: number;
  capacity: number;
  percentage: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

export interface ParkingStats {
  activeVehicles: number;
  availableSpots: number;
  dailyRevenue: number;
  entriesToday: number;
  exitToday: number;
  totalOccupancy: {
    occupied: number;
    total: number;
    percentage: number;
  };
}

export const mockParkingStats: ParkingStats = {
  activeVehicles: 142,
  availableSpots: 58,
  dailyRevenue: 2450000,
  entriesToday: 89,
  exitToday: 67,
  totalOccupancy: {
    occupied: 142,
    total: 200,
    percentage: 71,
  },
};

export const mockVehicleData: VehicleTypeData[] = [
  {
    type: 'Auto',
    occupied: 85,
    capacity: 120,
    percentage: 71,
  },
  {
    type: 'Bicicleta',
    occupied: 12,
    capacity: 30,
    percentage: 40,
  },
  {
    type: 'Camión',
    occupied: 28,
    capacity: 30,
    percentage: 93,
  },
  {
    type: 'Bus',
    occupied: 17,
    capacity: 20,
    percentage: 85,
  },
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    message: 'Capacidad crítica en Camiones (93%)',
    timestamp: new Date('2026-01-15T15:30:00'),
  },
  {
    id: '2',
    type: 'warning',
    message: 'Buses casi lleno (85%)',
    timestamp: new Date('2026-01-15T14:45:00'),
  },
  {
    id: '3',
    type: 'info',
    message: 'Mantenimiento programado zona A - 5:00 PM',
    timestamp: new Date('2026-01-15T13:00:00'),
  },
];

/**
 * Función helper para determinar el nivel de ocupación
 */
export const getOccupancyLevel = (percentage: number): 'Bajo' | 'Medio' | 'Crítico' => {
  if (percentage < 50) return 'Bajo';
  if (percentage < 80) return 'Medio';
  return 'Crítico';
};

/**
 * Función helper para obtener el color según el porcentaje
 */
export const getOccupancyColor = (percentage: number): string => {
  if (percentage < 50) return '#10b981'; // green-500
  if (percentage < 80) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};
