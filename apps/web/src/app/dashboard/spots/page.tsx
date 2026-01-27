'use client';

import React, { useState, useEffect } from 'react';
import { spotService, ParkingSpot } from '@/services/spotService';
import { zoneService, ParkingZone } from '@/services/zoneService';
import { Plus, Edit, Search, Filter } from 'lucide-react';

export default function SpotsPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const parkingLotId = 'b04f6eec-264b-4143-9b71-814b05d4ffc4';

  // Filtros
  const [filters, setFilters] = useState({
    zoneId: '',
    status: '',
    spotType: '',
    search: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [spotsRes, zonesRes] = await Promise.all([
        spotService.list({ parkingLotId, ...filters }),
        zoneService.list(parkingLotId, 1, 100),
      ]);
      setSpots(spotsRes.data || spotsRes);
      setZones(zonesRes.data || zonesRes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const styles = {
      FREE: 'bg-green-500/20 text-green-400 border-green-500/30',
      OCCUPIED: 'bg-red-500/20 text-red-400 border-red-500/30',
      RESERVED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      OUT_OF_SERVICE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    const labels = {
      FREE: 'Libre',
      OCCUPIED: 'Ocupado',
      RESERVED: 'Reservado',
      OUT_OF_SERVICE: 'Fuera de Servicio',
    };
    return (
      <span className={`px-2 py-1 rounded border text-xs ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleChangeStatus = async (spotId: string, currentStatus: string) => {
    const statuses = ['FREE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'];
    const newStatus = prompt(
      `Estado actual: ${currentStatus}\nNuevo estado (FREE/OCCUPIED/RESERVED/OUT_OF_SERVICE):`,
      currentStatus
    );
    
    if (!newStatus || !statuses.includes(newStatus.toUpperCase())) return;
    
    const reason = prompt('Razón del cambio (opcional):');

    try {
      await spotService.changeStatus(spotId, {
        toStatus: newStatus.toUpperCase() as any,
        reason: reason || undefined,
      });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Puestos</h1>
            <p className="text-slate-400 mt-1">Administra los puestos de estacionamiento</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            Nuevo Puesto
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Buscar por código</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="A-01, B-15..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Zona</label>
              <select
                value={filters.zoneId}
                onChange={(e) => setFilters({ ...filters, zoneId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="">Todas las zonas</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="">Todos</option>
                <option value="FREE">Libre</option>
                <option value="OCCUPIED">Ocupado</option>
                <option value="RESERVED">Reservado</option>
                <option value="OUT_OF_SERVICE">Fuera de Servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Tipo</label>
              <select
                value={filters.spotType}
                onChange={(e) => setFilters({ ...filters, spotType: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="">Todos</option>
                <option value="CAR">Autos</option>
                <option value="MOTORCYCLE">Motos</option>
                <option value="BICYCLE">Bicicletas</option>
                <option value="TRUCK_BUS">Camión/Bus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Grid de puestos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {spots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => handleChangeStatus(spot.id, spot.status)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                spot.status === 'FREE' ? 'border-green-500 bg-green-500/10' :
                spot.status === 'OCCUPIED' ? 'border-red-500 bg-red-500/10' :
                spot.status === 'RESERVED' ? 'border-yellow-500 bg-yellow-500/10' :
                'border-slate-600 bg-slate-800/50'
              }`}
            >
              <div className="text-center">
                <div className={`text-xl font-bold mb-1 ${
                  spot.status === 'FREE' ? 'text-green-400' :
                  spot.status === 'OCCUPIED' ? 'text-red-400' :
                  spot.status === 'RESERVED' ? 'text-yellow-400' :
                  'text-slate-400'
                }`}>
                  {spot.code}
                </div>
                <div className="text-xs text-slate-400">
                  {spot.spotType === 'CAR' ? 'Auto' :
                   spot.spotType === 'MOTORCYCLE' ? 'Moto' :
                   spot.spotType === 'BICYCLE' ? 'Bici' : 'Camión'}
                </div>
                {spot.zone && (
                  <div className="text-xs text-slate-500 mt-1">{spot.zone.name}</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {spots.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            No se encontraron puestos
          </div>
        )}
      </div>
    </div>
  );
}
