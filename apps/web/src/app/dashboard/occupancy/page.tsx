'use client';

import React, { useState, useEffect } from 'react';
import { occupancyService, OccupancySummary } from '@/services/occupancyService';
import { Car, Bike, Truck, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function OccupancyPage() {
  const [summary, setSummary] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // TODO: Obtener del contexto del usuario
  const parkingLotId = 'b04f6eec-264b-4143-9b71-814b05d4ffc4';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await occupancyService.getSummary(parkingLotId);
      setSummary(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar ocupación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getOccupancyPercentage = () => {
    if (!summary) return 0;
    if (summary.total === 0) return 0;
    return Math.round((summary.occupied / summary.total) * 100);
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'CAR': return <Car className="w-5 h-5" />;
      case 'MOTORCYCLE': return <Bike className="w-5 h-5" />;
      case 'BICYCLE': return <Bike className="w-5 h-5" />;
      case 'TRUCK_BUS': return <Truck className="w-5 h-5" />;
      default: return <Car className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-center py-12">Cargando ocupación...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-center py-12">No hay datos disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Ocupación en Tiempo Real</h1>
            <p className="text-slate-400 mt-1">Monitor de capacidad y disponibilidad</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Actualizar
          </button>
        </div>

        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Puestos</p>
                <p className="text-3xl font-bold text-white mt-1">{summary.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Libres */}
          <div className="bg-slate-900 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Libres</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{summary.free}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Ocupados */}
          <div className="bg-slate-900 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Ocupados</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{summary.occupied}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          {/* Reservados */}
          <div className="bg-slate-900 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Reservados</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{summary.reserved}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Fuera de servicio */}
          <div className="bg-slate-900 border border-slate-600 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Fuera de Servicio</p>
                <p className="text-3xl font-bold text-slate-400 mt-1">{summary.outOfService}</p>
              </div>
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Gauge de ocupación */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Nivel de Ocupación</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-8 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    getOccupancyPercentage() > 80 ? 'bg-red-500' :
                    getOccupancyPercentage() > 60 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${getOccupancyPercentage()}%` }}
                />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{getOccupancyPercentage()}%</div>
          </div>
        </div>

        {/* Por tipo de vehículo */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Por Tipo de Vehículo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(summary.byType).map(([type, data]) => (
              <div key={type} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {getVehicleTypeIcon(type)}
                  <h3 className="text-white font-medium">
                    {type === 'CAR' ? 'Autos' :
                     type === 'MOTORCYCLE' ? 'Motos' :
                     type === 'BICYCLE' ? 'Bicicletas' :
                     'Camión/Bus'}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total:</span>
                    <span className="text-white font-medium">{data.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Libres:</span>
                    <span className="text-green-400 font-medium">{data.free}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Ocupados:</span>
                    <span className="text-red-400 font-medium">{data.occupied}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por zona */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Por Zona</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Zona</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Total</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Libres</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Ocupados</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Ocupación</th>
                </tr>
              </thead>
              <tbody>
                {summary.byZone.map((zone) => {
                  const occupancyPct = zone.total > 0 ? Math.round((zone.occupied / zone.total) * 100) : 0;
                  return (
                    <tr key={zone.zoneId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-white">{zone.zoneName}</td>
                      <td className="py-3 px-4 text-center text-white">{zone.total}</td>
                      <td className="py-3 px-4 text-center text-green-400">{zone.free}</td>
                      <td className="py-3 px-4 text-center text-red-400">{zone.occupied}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                occupancyPct > 80 ? 'bg-red-500' :
                                occupancyPct > 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${occupancyPct}%` }}
                            />
                          </div>
                          <span className="text-white text-sm">{occupancyPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
