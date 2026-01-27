'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftsApi } from '../../../services/shifts.service';
import type { CashShift, ShiftSummary } from '../../../types/cash';

export default function CloseShiftPage() {
  const router = useRouter();
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Validar usuario
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const parkingLotId = user?.parkingLot?.id;
      
      if (!parkingLotId) {
        setLoading(false);
        alert('No se pudo obtener el ID del parqueadero');
        router.push('/cash');
        return;
      }

      // Verificar turno abierto
      let shift: CashShift | null = null;
      try {
        shift = await shiftsApi.getCurrent(parkingLotId);
      } catch (error) {
        console.error('Error al obtener turno:', error);
        setLoading(false);
        alert('Error al verificar el turno de caja. Por favor, intente nuevamente.');
        router.push('/cash');
        return;
      }

      console.log('Shift found:', shift);
      
      if (!shift || !shift.id || shift.status !== 'OPEN') {
        setLoading(false);
        alert('No hay turno de caja abierto. Debe abrir un turno primero desde el Dashboard.');
        router.push('/dashboard');
        return;
      }

      setCurrentShift(shift);
      
      // Solo cargar resumen si tenemos un turno válido
      try {
        const sum = await shiftsApi.getSummary(shift.id);
        console.log('Summary loaded:', sum);
        setSummary(sum);
      } catch (error) {
        console.error('Error al cargar resumen:', error);
        setLoading(false);
        alert('Error al cargar el resumen del turno.');
        router.push('/cash');
        return;
      }
      
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error al cargar los datos del turno.');
      router.push('/cash');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!currentShift) return;
    if (!confirm('¿Está seguro de cerrar el turno? Esta acción no se puede deshacer.'))
      return;

    try {
      setClosing(true);
      await shiftsApi.close(currentShift.id, { closingNotes: notes || undefined });
      alert('Turno cerrado exitosamente');
      router.push('/cash');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cerrar turno');
    } finally {
      setClosing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!summary) return <div className="p-6">Error al cargar resumen</div>;

  const difference = summary.totals.difference;
  const incomes = summary.movements.filter(m => m.type === 'INCOME');
  const expenses = summary.movements.filter(m => m.type === 'EXPENSE');
  const totalIncome = incomes.reduce((sum, m) => sum + m.amount, 0);
  const totalExpenses = expenses.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cerrar Caja</h1>
        <p className="text-gray-600">Resumen del turno</p>
      </div>

      <div className="space-y-6">
        {/* Opening Float */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <h3 className="font-bold mb-3">Base Inicial</h3>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.shift.openingFloat)}
          </div>
        </div>

        {/* Payments */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <h3 className="font-bold mb-3">Pagos Recibidos ({summary.totals.paymentsCount})</h3>
          <div className="flex justify-between py-2 mt-2 font-bold">
            <span>Total Pagos</span>
            <span className="text-green-600">
              {formatCurrency(summary.totals.totalPayments)}
            </span>
          </div>
        </div>

        {/* Movements */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <h3 className="font-bold mb-3">Movimientos</h3>
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

        {/* Expected vs Counted */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <h3 className="font-bold mb-3">Totales</h3>
          <div className="flex justify-between py-2 border-b">
            <span>Total Esperado</span>
            <span className="font-semibold">{formatCurrency(summary.totals.expectedTotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>Total Contado (Arqueo)</span>
            <span className="font-semibold">
              {summary.totals.countedTotal ? formatCurrency(summary.totals.countedTotal) : 'No registrado'}
            </span>
          </div>
          {difference !== null && (
            <div
              className={`flex justify-between py-2 mt-2 text-lg font-bold ${
                difference === 0
                  ? 'text-green-600'
                  : difference > 0
                  ? 'text-blue-600'
                  : 'text-red-600'
              }`}
            >
              <span>Diferencia</span>
              <span>
                {difference === 0
                  ? 'Cuadra ✓'
                  : difference > 0
                  ? `+${formatCurrency(difference)} (Sobrante)`
                  : `${formatCurrency(difference)} (Faltante)`}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <label className="block font-bold mb-2">Notas de Cierre (Opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
            placeholder="Registre cualquier novedad..."
          />
        </div>

        {/* Warning if no count */}
        {!summary.totals.countedTotal && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-600">
              ⚠️ No ha registrado el arqueo. Se recomienda hacer el conteo antes de cerrar.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/cash')}
            className="flex-1 px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted"
            disabled={closing}
          >
            Cancelar
          </button>
          <button
            onClick={handleClose}
            disabled={closing}
            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {closing ? 'Cerrando...' : 'Cerrar Turno'}
          </button>
        </div>
      </div>
    </div>
  );
}
