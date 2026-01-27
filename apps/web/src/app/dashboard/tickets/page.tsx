'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Filter, Download, Eye, XCircle, Clock, DollarSign, Car } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Session {
  id: string;
  ticketNumber: string;
  vehicleType: string;
  licensePlate?: string;
  bicycleCode?: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  status: string;
  spot?: {
    code: string;
    zone: {
      name: string;
    };
  };
  customer?: {
    fullName: string;
    documentNumber: string;
  };
  ticket?: {
    totalAmount: number;
    rateApplied: string;
  };
}

interface SessionsResponse {
  data: Session[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function TicketsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // ID del parqueadero (debería venir del contexto del usuario)
  const parkingLotId = 'b04f6eec-264b-4143-9b71-814b05d4ffc4';

  useEffect(() => {
    loadSessions();
  }, [page, searchQuery, statusFilter, dateFrom, dateTo]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (dateFrom) {
        params.dateFrom = dateFrom;
      }

      if (dateTo) {
        params.dateTo = dateTo;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/history?${queryString}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar sesiones');
      }

      const result = await response.json();
      console.log('Sessions API Response:', result);
      
      // Manejar respuesta anidada
      const actualData = result?.data || result;
      const sessionsData = Array.isArray(actualData?.data) ? actualData.data : (Array.isArray(actualData) ? actualData : []);
      
      setSessions(sessionsData);
      setTotalPages(actualData?.meta?.totalPages || 1);
      setTotal(actualData?.meta?.total || 0);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError('Error al cargar sesiones');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'ACTIVE': 'bg-blue-900/50 text-blue-400 border-blue-600',
      'COMPLETED': 'bg-green-900/50 text-green-400 border-green-600',
      'CANCELLED': 'bg-red-900/50 text-red-400 border-red-600',
    };
    const labels: Record<string, string> = {
      'ACTIVE': 'Activo',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${styles[status] || 'bg-gray-900/50 text-gray-400 border-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Historial de Tickets</h1>
          <p className="text-slate-400">Consulta todas las sesiones de parqueo registradas</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por ticket, placa, cliente..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="COMPLETED">Completados</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-slate-400 text-sm">
              Mostrando {sessions.length} de {total} tickets
              {(searchQuery || statusFilter !== 'ALL' || dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="ml-4 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            <button
              onClick={() => router.push('/dashboard/tickets/active')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Car className="w-4 h-4" />
              Ver Activos
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400 mt-4">Cargando tickets...</p>
          </div>
        )}

        {/* Table */}
        {!loading && sessions.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Salida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-white font-semibold">
                          {session.ticketNumber}
                        </div>
                        {session.spot && (
                          <div className="text-xs text-slate-400">
                            {session.spot.code} - {session.spot.zone.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-white font-semibold">
                            {session.licensePlate || session.bicycleCode || 'N/A'}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {getVehicleTypeLabel(session.vehicleType)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.customer ? (
                          <div className="text-sm">
                            <div className="text-white">{session.customer.fullName}</div>
                            <div className="text-slate-400 text-xs">{session.customer.documentNumber}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {format(new Date(session.checkInTime), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {format(new Date(session.checkInTime), 'HH:mm', { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.checkOutTime ? (
                          <>
                            <div className="text-sm text-white">
                              {format(new Date(session.checkOutTime), 'dd/MM/yyyy', { locale: es })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {format(new Date(session.checkOutTime), 'HH:mm', { locale: es })}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">En curso</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{formatDuration(session.duration)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-green-400 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm">{formatCurrency(session.ticket?.totalAmount)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(session.status)}
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
        {!loading && sessions.length === 0 && (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay tickets registrados</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || statusFilter !== 'ALL' || dateFrom || dateTo
                ? 'No se encontraron tickets con los filtros aplicados'
                : 'Los tickets aparecerán aquí cuando se registren sesiones'}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
