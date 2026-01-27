'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { shiftsApi } from '../../../../services/shifts.service';
import type { ShiftSummary } from '../../../../types/cash';
import Link from 'next/link';

export default function ShiftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shiftId = params.id as string;
  
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shiftId) {
      loadSummary();
    }
  }, [shiftId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await shiftsApi.getSummary(shiftId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading shift summary:', error);
      alert('Error al cargar el detalle del turno');
      router.push('/cash/history');
    } finally {
      setLoading(false);
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
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando detalle...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-600">No se pudo cargar el detalle del turno</p>
        </div>
      </div>
    );
  }

  const { shift, totals, payments, movements, counts } = summary;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/cash/history"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Volver al Historial
        </Link>
        <h1 className="text-3xl font-bold mb-2">Detalle de Turno</h1>
        <p className="text-gray-600">Resumen completo del turno de caja</p>
      </div>

      {/* Información del Turno */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Información General</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Fecha de Apertura</p>
            <p className="font-semibold">{formatDateTime(shift.openedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha de Cierre</p>
            <p className="font-semibold">
              {shift.closedAt ? formatDateTime(shift.closedAt) : 'Aún abierto'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cajero</p>
            <p className="font-semibold">
              {shift.cashier?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              shift.status === 'OPEN' ? 'bg-green-100 text-green-800' :
              shift.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {shift.status === 'OPEN' ? 'Abierto' :
               shift.status === 'CLOSED' ? 'Cerrado' :
               'Cancelado'}
            </span>
          </div>
        </div>

        {shift.openingNotes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Notas de Apertura</p>
            <p className="text-sm">{shift.openingNotes}</p>
          </div>
        )}

        {shift.closingNotes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Notas de Cierre</p>
            <p className="text-sm">{shift.closingNotes}</p>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">Base Inicial</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(shift.openingFloat || 0)}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">Total Esperado</div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(totals.expectedTotal)}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 mb-1">Total Contado</div>
          <div className="text-2xl font-bold text-purple-900">
            {totals.countedTotal !== null 
              ? formatCurrency(totals.countedTotal)
              : 'No registrado'}
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${
          totals.difference === 0 ? 'bg-gray-50 border-gray-200' :
          totals.difference > 0 ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className={`text-sm mb-1 ${
            totals.difference === 0 ? 'text-gray-600' :
            totals.difference > 0 ? 'text-green-600' :
            'text-red-600'
          }`}>
            Diferencia
          </div>
          <div className={`text-2xl font-bold ${
            totals.difference === 0 ? 'text-gray-900' :
            totals.difference > 0 ? 'text-green-900' :
            'text-red-900'
          }`}>
            {totals.difference !== null 
              ? formatCurrency(totals.difference)
              : '-'}
          </div>
        </div>
      </div>

      {/* Desglose de Ingresos */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Desglose de Ingresos</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Pagos</p>
            <p className="text-xl font-bold">{formatCurrency(totals.totalPayments)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cantidad de Pagos</p>
            <p className="text-xl font-bold">{totals.paymentsCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ingresos Manuales</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(totals.totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Egresos</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(totals.totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Pagos */}
      {payments.length > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Pagos Registrados ({payments.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm">Método</th>
                  <th className="px-4 py-2 text-right text-sm">Monto</th>
                  <th className="px-4 py-2 text-left text-sm">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(payment.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-2 text-sm">{payment.method}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-2 text-sm">{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movimientos */}
      {movements.length > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Movimientos Manuales ({movements.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm">Tipo</th>
                  <th className="px-4 py-2 text-left text-sm">Concepto</th>
                  <th className="px-4 py-2 text-right text-sm">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(movement.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        movement.type === 'INCOME' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">{movement.description}</td>
                    <td className={`px-4 py-2 text-sm text-right font-semibold ${
                      movement.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(movement.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Arqueos */}
      {counts.length > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Arqueo de Caja</h2>
          
          <div className="space-y-4">
            {counts.map((count) => (
              <div key={count.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{count.method}</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(count.countedAmount)}
                  </span>
                </div>
                
                {count.method === 'CASH' && count.details && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium mb-1">Denominaciones:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {count.details.denominations?.map((denom: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          {formatCurrency(denom.value)} × {denom.qty} = {formatCurrency(denom.value * denom.qty)}
                        </div>
                      ))}
                    </div>
                    {count.details.coinsTotal && count.details.coinsTotal > 0 && (
                      <p className="text-xs mt-1">
                        Monedas: {formatCurrency(count.details.coinsTotal)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
