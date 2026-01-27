'use client';

import { useState } from 'react';
import { Calculator, Clock, DollarSign } from 'lucide-react';

interface QuoteRequest {
  vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'TRUCK_BUS';
  entryAt: string;
  exitAt: string;
  isLostTicket?: boolean;
}

interface QuoteResult {
  vehicleType: string;
  entryAt: string;
  exitAt: string;
  totalMinutes: number;
  graceMinutesApplied: number;
  billableMinutes: number;
  segments: Array<{
    vehicleType: string;
    dayType: string;
    period: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    billingUnit: string;
    calculatedUnits: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  dailyMaxApplied: boolean;
  dailyMaxAmount: number;
  lostTicketFee: number;
  total: number;
}

export default function PricingSimulator() {
  const [formData, setFormData] = useState<QuoteRequest>({
    vehicleType: 'CAR',
    entryAt: new Date().toISOString().slice(0, 16),
    exitAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isLostTicket: false,
  });

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/v1/pricing/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al calcular la cotización');
      }

      const data = await response.json();
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const vehicleTypeLabels = {
    BICYCLE: '🚲 Bicicleta',
    MOTORCYCLE: '🏍️ Moto',
    CAR: '🚗 Auto',
    TRUCK_BUS: '🚚 Camión/Bus',
  };

  const dayTypeLabels = {
    WEEKDAY: 'Entre semana',
    WEEKEND: 'Fin de semana',
    HOLIDAY: 'Festivo',
  };

  const periodLabels = {
    DAY: '☀️ Día',
    NIGHT: '🌙 Noche',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulador de Tarifas</h1>
          <p className="text-gray-600">Calcula el costo de estacionamiento según horarios y tipo de vehículo</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calculator size={24} className="text-blue-600" />
              Datos de la Simulación
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Vehículo
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleType: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha/Hora de Entrada
                </label>
                <input
                  type="datetime-local"
                  value={formData.entryAt}
                  onChange={(e) => setFormData({ ...formData, entryAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha/Hora de Salida
                </label>
                <input
                  type="datetime-local"
                  value={formData.exitAt}
                  onChange={(e) => setFormData({ ...formData, exitAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isLostTicket}
                    onChange={(e) =>
                      setFormData({ ...formData, isLostTicket: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Ticket Perdido</span>
                </label>
              </div>

              <button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator size={20} />
                    Simular Cotización
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {quote && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={24} className="text-green-600" />
                Resultado de la Cotización
              </h2>

              {/* Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Duración Total</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Clock size={16} />
                    {formatDuration(quote.totalMinutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Periodo de Gracia</span>
                  <span className="font-semibold">{formatDuration(quote.graceMinutesApplied)}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700">Tiempo Facturable</span>
                  <span className="font-semibold text-blue-600">
                    {formatDuration(quote.billableMinutes)}
                  </span>
                </div>

                <div className="pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between text-2xl font-bold text-blue-900">
                    <span>TOTAL</span>
                    <span>{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>

              {/* Segments Breakdown */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3 text-gray-700">Desglose por Segmentos</h3>
                <div className="space-y-2">
                  {quote.segments.map((segment, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {dayTypeLabels[segment.dayType as keyof typeof dayTypeLabels]} -{' '}
                          {periodLabels[segment.period as keyof typeof periodLabels]}
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(segment.subtotal)}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs">
                        {formatDuration(segment.durationMinutes)} × {formatCurrency(segment.unitPrice)}/hora
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Fees */}
              {quote.dailyMaxApplied && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-800">⚠️ Máximo Diario Aplicado</span>
                    <span className="font-semibold">
                      {formatCurrency(quote.dailyMaxAmount)}
                    </span>
                  </div>
                </div>
              )}

              {quote.lostTicketFee > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-red-800">🎫 Cargo por Ticket Perdido</span>
                    <span className="font-semibold">
                      {formatCurrency(quote.lostTicketFee)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
