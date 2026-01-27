'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftsApi } from '../../../services/shifts.service';
import { countsApi } from '../../../services/counts.service';
import type { CashShift, CashCountMethod, CashDenomination } from '../../../types/cash';

const DENOMINATIONS = [
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50,
];

export default function CashCountPage() {
  const router = useRouter();
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMethod, setActiveMethod] = useState<CashCountMethod>(
    CashCountMethod.CASH,
  );

  // Cash denominations
  const [denominations, setDenominations] = useState<Record<number, number>>(
    DENOMINATIONS.reduce((acc, val) => ({ ...acc, [val]: 0 }), {}),
  );

  // Other methods
  const [otherAmounts, setOtherAmounts] = useState({
    [CashCountMethod.CARD]: 0,
    [CashCountMethod.TRANSFER]: 0,
    [CashCountMethod.QR]: 0,
    [CashCountMethod.OTHER]: 0,
  });

  useEffect(() => {
    loadCurrentShift();
  }, []);

  const loadCurrentShift = async () => {
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCashTotal = () => {
    return DENOMINATIONS.reduce((sum, val) => sum + val * denominations[val], 0);
  };

  const handleSaveCash = async () => {
    if (!currentShift) return;

    try {
      setSaving(true);
      const total = calculateCashTotal();
      const details = {
        denominations: DENOMINATIONS.map((value) => ({
          value,
          qty: denominations[value],
        })),
      };

      await countsApi.upsert({
        cashShiftId: currentShift.id,
        method: CashCountMethod.CASH,
        countedAmount: total,
        details,
      });

      alert('Conteo de efectivo guardado');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOther = async (method: CashCountMethod) => {
    if (!currentShift) return;

    try {
      setSaving(true);
      await countsApi.upsert({
        cashShiftId: currentShift.id,
        method,
        countedAmount: otherAmounts[method],
      });

      alert(`Conteo de ${method} guardado`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Arqueo de Caja</h1>
        <p className="text-gray-600">Conteo físico por método de pago</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        {[
          CashCountMethod.CASH,
          CashCountMethod.CARD,
          CashCountMethod.TRANSFER,
          CashCountMethod.QR,
        ].map((method) => (
          <button
            key={method}
            onClick={() => setActiveMethod(method)}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeMethod === method
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      {/* Cash Tab */}
      {activeMethod === CashCountMethod.CASH && (
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Conteo de Efectivo</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {DENOMINATIONS.map((value) => (
              <div key={value} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    {formatCurrency(value)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={denominations[value]}
                    onChange={(e) =>
                      setDenominations({
                        ...denominations,
                        [value]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div className="text-right text-sm font-semibold min-w-[100px]">
                  {formatCurrency(value * denominations[value])}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-600">Total Efectivo:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculateCashTotal())}
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveCash}
            disabled={saving}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Conteo Efectivo'}
          </button>
        </div>
      )}

      {/* Other Methods Tab */}
      {activeMethod !== CashCountMethod.CASH && (
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Conteo de {activeMethod}</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Monto Total</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={otherAmounts[activeMethod]}
              onChange={(e) =>
                setOtherAmounts({
                  ...otherAmounts,
                  [activeMethod]: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-lg"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(otherAmounts[activeMethod])}
            </p>
          </div>

          <button
            onClick={() => handleSaveOther(activeMethod)}
            disabled={saving}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : `Guardar Conteo ${activeMethod}`}
          </button>
        </div>
      )}

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
