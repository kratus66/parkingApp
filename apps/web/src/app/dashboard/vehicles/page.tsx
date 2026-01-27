'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Car, Bike, Truck, Bus, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { vehicleService, Vehicle } from '@/services/vehicleService';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadVehicles();
  }, [page, searchQuery, vehicleTypeFilter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit,
      };

      if (searchQuery) {
        params.query = searchQuery;
      }

      if (vehicleTypeFilter !== 'ALL') {
        params.vehicleType = vehicleTypeFilter;
      }

      const response = await vehicleService.search(params);
      console.log('Vehicles API Response:', response);
      
      // Manejar respuesta anidada
      const actualData = response?.data || response;
      const vehiclesData = Array.isArray(actualData?.data) ? actualData.data : (Array.isArray(actualData) ? actualData : []);
      
      setVehicles(vehiclesData);
      setTotalPages(actualData?.meta?.totalPages || 1);
      setTotal(actualData?.meta?.total || 0);
    } catch (err: any) {
      console.error('Error loading vehicles:', err);
      setError('Error al cargar vehículos');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/vehicles/${id}`);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'CAR': return <Car className="w-5 h-5" />;
      case 'MOTORCYCLE': return <Bike className="w-5 h-5" />;
      case 'BICYCLE': return <Bike className="w-5 h-5" />;
      case 'TRUCK_BUS': return <Truck className="w-5 h-5" />;
      default: return <Car className="w-5 h-5" />;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CAR': 'Auto',
      'MOTORCYCLE': 'Moto',
      'BICYCLE': 'Bicicleta',
      'TRUCK_BUS': 'Camión/Bus',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Vehículos Registrados</h1>
          <p className="text-slate-400">Gestiona todos los vehículos del sistema</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por placa, código, marca, propietario..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Vehicle Type Filter */}
            <div>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => {
                  setVehicleTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los tipos</option>
                <option value="CAR">Autos</option>
                <option value="MOTORCYCLE">Motos</option>
                <option value="BICYCLE">Bicicletas</option>
                <option value="TRUCK_BUS">Camión/Bus</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-slate-400 text-sm">
              Mostrando {vehicles.length} de {total} vehículos
            </div>
            <button
              onClick={() => router.push('/dashboard/customers')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Vehículo
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400 mt-4">Cargando vehículos...</p>
          </div>
        )}

        {/* Table */}
        {!loading && vehicles.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Placa/Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Marca/Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Propietario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(vehicle.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-blue-400">
                            {getVehicleIcon(vehicle.vehicleType)}
                          </div>
                          <span className="text-sm text-slate-300">
                            {getVehicleTypeLabel(vehicle.vehicleType)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-white font-semibold">
                          {vehicle.plate || vehicle.bicycleCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-300">
                          {vehicle.brand && vehicle.model
                            ? `${vehicle.brand} ${vehicle.model}`
                            : vehicle.brand || vehicle.model || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-300">{vehicle.color || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-white">{vehicle.customer?.fullName || '-'}</div>
                          <div className="text-slate-400 text-xs">
                            {vehicle.customer?.documentNumber || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.isActive ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-900/50 text-green-400 border border-green-600">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900/50 text-red-400 border border-red-600">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(vehicle.id);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && vehicles.length === 0 && (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay vehículos registrados</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery ? 'No se encontraron vehículos con ese criterio de búsqueda' : 'Comienza registrando el primer vehículo'}
            </p>
            <button
              onClick={() => router.push('/dashboard/customers')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Vehículo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
