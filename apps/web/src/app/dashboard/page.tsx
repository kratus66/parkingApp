'use client';

import React, { useState, useEffect } from 'react';
import { KPICards } from '@/components/KPICards';
import { GaugeMeter } from '@/components/GaugeMeter';
import { VehicleCard } from '@/components/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckInModal } from '@/components/modals/CheckInModal';
import { CheckOutModal } from '@/components/modals/CheckOutModal';
import { useDashboardData } from '@/lib/useDashboardData';
import { LogOut, Wallet, AlertCircle } from 'lucide-react';
import { shiftsApi } from '@/services/shifts.service';
import type { CashShift } from '@/types/cash';
import Link from 'next/link';

/**
 * Dashboard principal del sistema de parqueadero
 * Muestra estadísticas en tiempo real, ocupación y alertas
 */
export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboardData();
  
  // Estados para modales
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  
  // Estados para verificación de turno de caja
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [parkingLotId, setParkingLotId] = useState<string>('');
  
  // Cargar turno de caja actual
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const lotId = user.parkingLot?.id;
        if (lotId) {
          setParkingLotId(lotId);
          loadCurrentShift(lotId);
        } else {
          setLoadingShift(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoadingShift(false);
      }
    } else {
      setLoadingShift(false);
    }
  }, []);

  const loadCurrentShift = async (lotId: string) => {
    try {
      setLoadingShift(true);
      const shift = await shiftsApi.getCurrent(lotId);
      setCurrentShift(shift);
    } catch (error) {
      console.error('Error loading current shift:', error);
    } finally {
      setLoadingShift(false);
    }
  };
  
  // ID del parqueadero - obtener del usuario autenticado
  const getParkingLotId = () => {
    if (parkingLotId) return parkingLotId;
    if (typeof window === 'undefined') return 'b04f6eec-264b-4143-9b71-814b05d4ffc4';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.parkingLot?.id || 'b04f6eec-264b-4143-9b71-814b05d4ffc4';
      } catch {
        return 'b04f6eec-264b-4143-9b71-814b05d4ffc4';
      }
    }
    return 'b04f6eec-264b-4143-9b71-814b05d4ffc4';
  };
  const parkingLotIdValue = getParkingLotId();

  // Handler para registro de vehículos
  const handleRegisterVehicle = (vehicleType: string) => {
    console.log('Registrar vehículo tipo:', vehicleType);
    setShowCheckInModal(true);
  };

  // Handler para éxito en operaciones
  const handleOperationSuccess = () => {
    refetch(); // Actualizar datos del dashboard
  };

  // Estado de carga
  if (loading || loadingShift) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-xl mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no hay datos aún
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">No hay datos disponibles</div>
      </div>
    );
  }

  // Debug: verificar datos de vehículos
  console.log('Dashboard data:', data);
  console.log('Vehicle types:', data.vehicleTypes);
  console.log('Current shift:', currentShift);

  // Si no hay turno abierto, mostrar alerta
  if (!currentShift) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto mt-12">
            <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Turno de Caja No Abierto</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Debe abrir un turno de caja antes de comenzar a operar
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">¿Por qué necesito abrir un turno?</h3>
                  <p className="text-sm text-muted-foreground">
                    El sistema requiere que abra un turno de caja para:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Registrar el efectivo inicial en caja</li>
                    <li>Asociar todos los pagos a su turno</li>
                    <li>Realizar arqueos durante el día</li>
                    <li>Generar reportes al cierre de turno</li>
                  </ul>
                </div>

                <Link
                  href="/cash/open"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
                >
                  <Wallet className="w-5 h-5" />
                  Abrir Turno de Caja
                </Link>

                <p className="text-sm text-muted-foreground text-center">
                  Una vez abierto el turno, podrá acceder a todas las funcionalidades del sistema
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Contenido principal */}
      <main className="container mx-auto p-6 space-y-6">
        {/* KPIs superiores */}
        <KPICards
          activeVehicles={data.activeVehicles || 0}
          availableSpots={data.availableSpots || 0}
          dailyRevenue={data.dailyRevenue || 0}
          entriesToday={data.entriesToday || 0}
          exitsToday={data.exitsToday || 0}
        />

        {/* Sección media - Ocupación total y botón de salida */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ocupación total - 2/3 del ancho */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ocupación Total</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <GaugeMeter
                  percentage={data.totalOccupancy?.percentage || 0}
                  size="lg"
                  occupied={data.totalOccupancy?.occupied || 0}
                  total={data.totalOccupancy?.total || 0}
                />
              </CardContent>
            </Card>
          </div>

          {/* Botón de salida - 1/3 del ancho */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Registro de Salida</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <button
                  onClick={() => setShowCheckOutModal(true)}
                  className="w-full px-6 py-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-lg font-semibold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Registrar Salida
                </button>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Registra la salida de un vehículo del parqueadero
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Registro de vehículos - Grid de 4 columnas */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Registro de Vehículos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data.vehicleTypes || []).map((vehicleData) => {
              // Mapear nombres del backend a tipos del componente
              const typeMap: Record<string, "car" | "bicycle" | "truck" | "bus"> = {
                'Auto': 'car',
                'Bicicleta': 'bicycle',
                'Camión': 'truck',
                'Bus': 'bus',
              };
              
              return (
                <VehicleCard
                  key={vehicleData.type}
                  type={typeMap[vehicleData.type] || 'car'}
                  occupied={vehicleData.occupied || 0}
                  capacity={vehicleData.capacity || 0}
                  onClick={() => handleRegisterVehicle(vehicleData.type)}
                />
              );
            })}
          </div>
        </div>

        {/* Modales */}
        <CheckInModal
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={handleOperationSuccess}
          parkingLotId={parkingLotIdValue}
        />

        <CheckOutModal
          isOpen={showCheckOutModal}
          onClose={() => setShowCheckOutModal(false)}
          onSuccess={handleOperationSuccess}
          parkingLotId={parkingLotIdValue}
        />
      </main>
    </div>
  );
}


