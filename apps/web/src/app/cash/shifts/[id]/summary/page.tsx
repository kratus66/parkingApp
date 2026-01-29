'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { shiftsApi } from '../../../../../services/shifts.service';
import type { ShiftSummary } from '../../../../../types/cash';
import Link from 'next/link';

export default function ShiftSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const shiftId = params.id as string;

  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [shiftId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shiftsApi.getSummary(shiftId);
      setSummary(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar resumen');
      console.error('Error loading summary:', err);
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
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-lg">Cargando resumen...</div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Resumen de Turno</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-semibold">{error || 'No se pudo cargar el resumen'}</p>
        </div>
        <Link href="/cash" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          ← Volver a Caja
        </Link>
      </div>
    );
  }

  const difference = summary.totals.difference;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Resumen de Turno</h1>
          <p className="text-gray-600">Detalles completos del turno de caja</p>
        </div>
        <Link href="/cash" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shift Info */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <h3 className="font-bold mb-4 text-lg">Información del Turno</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Cajero:</span>
              <span className="font-semibold">{summary.shift.cashier?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Parqueadero:</span>
              <span className="font-semibold">{summary.shift.parkingLot?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Apertura:</span>
              <span className="font-semibold">{formatDateTime(summary.shift.openedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cierre:</span>
              <span className="font-semibold">
                {summary.shift.closedAt ? formatDateTime(summary.shift.closedAt) : 'No cerrado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estado:</span>
              <span className={`font-semibold px-2 py-1 rounded text-xs ${
                summary.shift.status === 'OPEN' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
              }`}>
                {summary.shift.status}
              </span>
            </div>
          </div>
        </div>

        {/* Base Inicial */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <h3 className="font-bold mb-4 text-lg">Base Inicial</h3>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(summary.shift.openingFloat)}
          </div>
          {summary.shift.openingNotes && (
            <p className="text-sm text-gray-400 mt-2">{summary.shift.openingNotes}</p>
          )}
        </div>
      </div>

      {/* Pagos */}
      <div className="bg-card border border-border rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold mb-4 text-lg">Pagos Recibidos ({summary.totals.paymentsCount})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between py-2 border-b md:border-b-0">
            <span className="text-gray-400">Total de Pagos:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(summary.totals.totalPayments)}
            </span>
          </div>
        </div>
      </div>

      {/* Movimientos */}
      <div className="bg-card border border-border rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold mb-4 text-lg">Movimientos Manuales</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b">
            <span>Ingresos ({summary.movements.filter(m => m.type === 'INCOME').length})</span>
            <span className="font-semibold text-green-600">
              +{formatCurrency(summary.totals.totalIncome)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span>Egresos ({summary.movements.filter(m => m.type === 'EXPENSE').length})</span>
            <span className="font-semibold text-red-600">
              -{formatCurrency(summary.totals.totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-card border border-border rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold mb-4 text-lg">Cálculo de Totales</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">Base Inicial</span>
            <span className="font-semibold">{formatCurrency(summary.shift.openingFloat)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">+ Pagos Recibidos</span>
            <span className="font-semibold text-green-600">+{formatCurrency(summary.totals.totalPayments)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">+ Ingresos</span>
            <span className="font-semibold text-green-600">+{formatCurrency(summary.totals.totalIncome)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-400">- Egresos</span>
            <span className="font-semibold text-red-600">-{formatCurrency(summary.totals.totalExpenses)}</span>
          </div>
          <div className="flex justify-between py-3 bg-slate-900 rounded px-3 text-lg font-bold">
            <span>Total Esperado</span>
            <span>{formatCurrency(summary.totals.expectedTotal)}</span>
          </div>
        </div>
      </div>

      {/* Arqueo */}
      <div className="bg-card border border-border rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold mb-4 text-lg">Arqueo (Conteo Físico)</h3>
        {summary.counts && summary.counts.length > 0 ? (
          <div className="space-y-2">
            {summary.counts.map((count) => (
              <div key={count.id} className="flex justify-between py-2 border-b">
                <span className="text-gray-400">{count.method}</span>
                <span className="font-semibold">{formatCurrency(count.countedAmount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 bg-slate-900 rounded px-3 text-lg font-bold mt-3">
              <span>Total Contado</span>
              <span>{formatCurrency(summary.totals.countedTotal)}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No hay conteos registrados</p>
        )}
      </div>

      {/* Diferencia */}
      <div
        className={`rounded-lg shadow p-6 mb-6 border ${
          difference === 0
            ? 'bg-green-500/10 border-green-500/30'
            : difference > 0
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <h3 className="font-bold mb-4 text-lg">Diferencia (Cuadre)</h3>
        <div className="text-4xl font-bold mb-2">
          <span
            className={
              difference === 0
                ? 'text-green-600'
                : difference > 0
                ? 'text-blue-600'
                : 'text-red-600'
            }
          >
            {difference === 0
              ? '✓ Cuadra'
              : difference > 0
              ? `+${formatCurrency(difference)} (Sobrante)`
              : `${formatCurrency(difference)} (Faltante)`}
          </span>
        </div>
        <p className="text-sm text-gray-400">
          Esperado: {formatCurrency(summary.totals.expectedTotal)} | Contado:{' '}
          {formatCurrency(summary.totals.countedTotal)}
        </p>
      </div>

      {/* Notas de Cierre */}
      {summary.shift.closingNotes && (
        <div className="bg-card border border-border rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Notas de Cierre</h3>
          <p className="text-gray-400">{summary.shift.closingNotes}</p>
        </div>
      )}

      <Link href="/cash" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
        ← Volver a Caja
      </Link>
    </div>
  );
}
