'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { shiftsApi } from '../../../services/shifts.service';

export default function OpenShiftPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    openingFloat: 50000,
    openingNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Obtener usuario autenticado
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setError('Debe iniciar sesión');
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    const parkingLotId = user?.parkingLot?.id;
    
    if (!parkingLotId) {
      setError('Usuario sin parqueadero asignado');
      return;
    }

    try {
      setLoading(true);
      await shiftsApi.open({
        parkingLotId,
        openingFloat: formData.openingFloat,
        openingNotes: formData.openingNotes || undefined,
      });

      router.push('/cash');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al abrir turno. Intente nuevamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Abrir Caja</h1>
        <p className="text-gray-600">Registre la base inicial para comenzar el turno</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Base Inicial *
          </label>
          <input
            type="number"
            value={formData.openingFloat}
            onChange={(e) =>
              setFormData({ ...formData, openingFloat: parseInt(e.target.value) || 0 })
            }
            min="0"
            step="1000"
            required
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Monto en efectivo: {formatCurrency(formData.openingFloat)}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Notas de Apertura (Opcional)
          </label>
          <textarea
            value={formData.openingNotes}
            onChange={(e) =>
              setFormData({ ...formData, openingNotes: e.target.value })
            }
            rows={3}
            placeholder="Ej: Turno mañana - Base completa"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-600 mb-2">
            📋 Antes de abrir caja
          </h3>
          <ul className="text-sm text-blue-600/90 space-y-1">
            <li>• Verifique que el monto en efectivo sea correcto</li>
            <li>• Asegúrese de contar todas las denominaciones</li>
            <li>• Registre cualquier novedad en las notas</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </div>
      </form>
    </div>
  );
}
