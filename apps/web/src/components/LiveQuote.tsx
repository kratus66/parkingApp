'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface QuoteData {
  vehicleType: string;
  entryAt: string;
  exitAt: string;
  totalMinutes: number;
  graceMinutesApplied: number;
  billableMinutes: number;
  subtotal: number;
  dailyMaxApplied: boolean;
  dailyMaxAmount: number;
  lostTicketFee: number;
  total: number;
}

interface LiveQuoteProps {
  sessionId: string;
  autoRefresh?: boolean;
}

export function LiveQuote({ sessionId, autoRefresh = true }: LiveQuoteProps) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuote();

    if (autoRefresh) {
      const interval = setInterval(loadQuote, 15000); // Actualizar cada 15s
      return () => clearInterval(interval);
    }
  }, [sessionId, autoRefresh]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3002/api/v1/pricing/session/${sessionId}/quote`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        // Intentar extraer mensaje del backend
        let backendMessage = 'Error al cargar cotización';
        try {
          const errorBody = await response.json();
          backendMessage = errorBody?.message || backendMessage;
        } catch (parseErr) {
          // ignore
        }
        throw new Error(backendMessage);
      }

      const raw = await response.json();

      // Manejar posibles envoltorios { data: { quote } } o { quote }
      const payload = raw?.data?.quote || raw?.quote || raw?.data || raw;
      const breakdown = payload?.breakdown || {};

      const normalized: QuoteData = {
        vehicleType: payload?.vehicleType || '',
        entryAt: payload?.entryAt || payload?.entryDate || '',
        exitAt: payload?.exitAt || payload?.exitDate || '',
        totalMinutes: Number(
          payload?.totalMinutes ?? payload?.durationMinutes ?? breakdown.totalMinutes ?? 0
        ) || 0,
        graceMinutesApplied: Number(
          payload?.graceMinutesApplied ?? breakdown.graceAppliedMinutes ?? 0
        ) || 0,
        billableMinutes: Number(
          payload?.billableMinutes ??
          payload?.chargeableMinutes ??
          breakdown.billableMinutes ??
          payload?.totalMinutes ??
          breakdown.totalMinutes ??
          0
        ) || 0,
        subtotal: Number(
          payload?.subtotal ?? payload?.amount ?? payload?.total ?? breakdown.subtotal ?? 0
        ) || 0,
        dailyMaxApplied: Boolean(
          payload?.dailyMaxApplied ?? breakdown.dailyMaxApplied ?? payload?.maxApplied ?? false
        ),
        dailyMaxAmount: Number(
          payload?.dailyMaxAmount ?? breakdown.dailyMaxAmount ?? payload?.dailyMax ?? 0
        ) || 0,
        lostTicketFee: Number(payload?.lostTicketFee ?? breakdown.lostTicketFee ?? 0) || 0,
        total: Number(payload?.total ?? payload?.totalAmount ?? payload?.amount ?? 0) || 0,
      };

      setQuote(normalized);
    } catch (err) {
      console.error('Error loading quote:', err);
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
    const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  if (loading && !quote) {
    return (
      <div className="p-4 bg-white rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-green-900 flex items-center gap-2">
          <DollarSign size={18} />
          Cotización Actual
        </h3>
        {autoRefresh && (
          <div className="flex items-center gap-1 text-xs text-green-700">
            <Clock size={12} />
            <span>Auto</span>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-700">Tiempo Total</span>
          <span className="font-medium text-green-900">
            {formatDuration(quote.totalMinutes)}
          </span>
        </div>

        {quote.graceMinutesApplied > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700">Gracia Aplicada</span>
            <span className="font-medium text-green-600">
              -{formatDuration(quote.graceMinutesApplied)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-green-700">Tiempo Facturable</span>
          <span className="font-medium text-green-900">
            {formatDuration(quote.billableMinutes)}
          </span>
        </div>

        {quote.dailyMaxApplied && (
          <div className="p-2 bg-yellow-100 rounded text-xs text-yellow-800">
            ⚠️ Máximo diario aplicado: {formatCurrency(quote.dailyMaxAmount)}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-green-300">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">Total a Pagar</span>
          <div className="flex items-center gap-1">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-2xl font-bold text-green-900">
              {formatCurrency(quote.total)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={loadQuote}
        className="mt-3 w-full py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        Actualizar Cotización
      </button>
    </div>
  );
}
