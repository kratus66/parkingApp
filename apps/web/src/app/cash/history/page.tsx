'use client';

import { useState, useEffect } from 'react';
import { shiftsApi } from '../../../services/shifts.service';
import type { CashShift, CashShiftStatus } from '../../../types/cash';
import Link from 'next/link';

export default function CashHistoryPage() {
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [parkingLotId, setParkingLotId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CashShiftStatus | ''>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const lotId = user.parkingLot?.id;
        if (lotId) {
          setParkingLotId(lotId);
          loadShifts(lotId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadShifts = async (lotId: string, filters?: {
    status?: CashShiftStatus;
    from?: string;
    to?: string;
  }) => {
    try {
      setLoading(true);
      const params: any = { parkingLotId: lotId };
      
      if (filters?.status) {
        params.status = filters.status;
      }
      if (filters?.from) {
        params.from = filters.from;
      }
      if (filters?.to) {
        params.to = filters.to;
      }

      const data = await shiftsApi.findAll(params);
      setShifts(data);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (parkingLotId) {
      loadShifts(parkingLotId, {
        status: statusFilter as CashShiftStatus | undefined,
        from: fromDate,
        to: toDate,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getStatusBadge = (status: CashShiftStatus) => {
    const styles = {
      OPEN: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      CANCELED: 'bg-red-100 text-red-800',
    };

    const labels = {
      OPEN: 'Abierto',
      CLOSED: 'Cerrado',
      CANCELED: 'Cancelado',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getDifferenceColor = (difference: number | null) => {
    if (difference === null || difference === 0) return 'text-gray-700';
    return difference > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando historial...</div>
      </div>
    );
  }

  if (!parkingLotId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-600">
            Debe seleccionar un parqueadero primero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Historial de Turnos</h1>
        <p className="text-gray-600">Consulta de turnos de caja</p>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CashShiftStatus | '')}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="">Todos</option>
              <option value="OPEN">Abierto</option>
              <option value="CLOSED">Cerrado</option>
              <option value="CANCELED">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de turnos */}
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Apertura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Cierre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Inicial
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Esperado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Contado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diferencia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron turnos
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDateTime(shift.openedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {shift.closedAt ? formatDateTime(shift.closedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(shift.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(shift.openingFloat || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {shift.status === 'CLOSED' 
                        ? formatCurrency(shift.expectedTotal || 0)
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {shift.countedTotal !== null
                        ? formatCurrency(shift.countedTotal)
                        : '-'
                      }
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${getDifferenceColor(shift.difference)}`}>
                      {shift.difference !== null
                        ? formatCurrency(shift.difference)
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {shift.status === 'CLOSED' && (
                        <Link
                          href={`/cash/history/${shift.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver Detalle
                        </Link>
                      )}
                      {shift.status === 'OPEN' && (
                        <Link
                          href="/cash"
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Ir a Caja
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón volver */}
      <div className="mt-6">
        <Link
          href="/cash"
          className="inline-block px-6 py-2 border border-gray-300 rounded-lg hover:bg-muted transition-colors"
        >
          ← Volver a Caja
        </Link>
      </div>
    </div>
  );
}
