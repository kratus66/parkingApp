'use client';

import { useState, useEffect } from 'react';
import { movementsApi } from '../../../services/movements.service';
import { shiftsApi } from '../../../services/shifts.service';
import type {
  CashMovement,
  CashMovementType,
  CashMovementCategory,
  CashShift,
} from '../../../types/cash';
import { useRouter } from 'next/navigation';

export default function MovementsPage() {
  const router = useRouter();
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'EXPENSE' as CashMovementType,
    category: 'OTHER' as CashMovementCategory,
    amount: 0,
    description: '',
    reference: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    const parkingLotId = user?.parkingLot?.id;
    
    if (!parkingLotId) {
      router.push('/cash');
      return;
    }

    try {
      const shift = await shiftsApi.getCurrent(parkingLotId);
      if (!shift) {
        router.push('/cash');
        return;
      }

      setCurrentShift(shift);
      const movs = await movementsApi.findByShift(shift.id);
      setMovements(movs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    try {
      await movementsApi.create({
        cashShiftId: currentShift.id,
        ...formData,
      });

      setShowForm(false);
      setFormData({
        type: 'EXPENSE' as CashMovementType,
        category: 'OTHER' as CashMovementCategory,
        amount: 0,
        description: '',
        reference: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar');
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

  const incomes = movements.filter((m) => m.type === 'INCOME');
  const expenses = movements.filter((m) => m.type === 'EXPENSE');
  const totalIncome = incomes.reduce((sum, m) => sum + m.amount, 0);
  const totalExpense = expenses.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Movimientos de Caja</h1>
          <p className="text-gray-600">Ingresos y egresos no relacionados con parqueo</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Movimiento'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6"
        >
          <h3 className="font-bold mb-4">Registrar Movimiento</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as CashMovementType,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                required
              >
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Egreso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as CashMovementCategory,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                required
              >
                <option value="SUPPLIES">Insumos</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="PETTY_CASH">Caja Menor</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Monto *</label>
            <input
              type="number"
              min="1"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Descripción *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Referencia (Opcional)
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Guardar Movimiento
          </button>
        </form>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Total Ingresos</div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs text-green-600">{incomes.length} movimientos</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600 mb-1">Total Egresos</div>
          <div className="text-2xl font-bold text-red-900">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-xs text-red-600">{expenses.length} movimientos</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <h3 className="font-bold">Historial de Movimientos</h3>
        </div>
        <div className="divide-y">
          {movements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay movimientos registrados
            </div>
          ) : (
            movements.map((mov) => (
              <div key={mov.id} className="p-4 flex justify-between items-start">
                <div>
                  <div className="font-semibold">{mov.description}</div>
                  <div className="text-sm text-gray-500">
                    {mov.category} • {new Date(mov.createdAt).toLocaleString('es-CO')}
                  </div>
                  {mov.reference && (
                    <div className="text-xs text-gray-400">Ref: {mov.reference}</div>
                  )}
                </div>
                <div
                  className={`text-lg font-bold ${
                    mov.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {mov.type === 'INCOME' ? '+' : '-'} {formatCurrency(mov.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push('/cash')}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Volver a Caja
        </button>
      </div>
    </div>
  );
}
