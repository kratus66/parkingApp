'use client';

import { useState, useEffect } from 'react';
import { shiftsApi } from '../../services/shifts.service';
import type { CashShift } from '../../types/cash';
import Link from 'next/link';

export default function CashPage() {
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [parkingLotId, setParkingLotId] = useState<string>('');

  useEffect(() => {
    // Get parkingLotId from authenticated user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const lotId = user.parkingLot?.id;
        if (lotId) {
          setParkingLotId(lotId);
          loadCurrentShift(lotId);
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

  const loadCurrentShift = async (lotId: string) => {
    try {
      setLoading(true);
      const shift = await shiftsApi.getCurrent(lotId);
      console.log('Current shift loaded:', shift);
      
      // Validar que el turno tenga datos válidos
      if (shift && shift.id && shift.status === 'OPEN') {
        setCurrentShift(shift);
      } else {
        console.log('No valid shift found');
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error loading current shift:', error);
      setCurrentShift(null);
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
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando...</div>
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Caja</h1>
          <p className="text-gray-600">Gestión de turno de caja</p>
        </div>
        <Link
          href="/cash/history"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Historial
        </Link>
      </div>

      {!currentShift ? (
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">No hay turno abierto</h2>
            <p className="text-gray-600 mb-6">
              Debe abrir un turno de caja para comenzar a operar
            </p>
          </div>

          <Link
            href="/cash/open"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Abrir Caja
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Turno Actual Card */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Turno Actual</h2>
                <p className="text-sm text-gray-500">
                  Abierto el {formatDateTime(currentShift.openedAt)}
                </p>
              </div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                ABIERTO
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Base Inicial</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(currentShift.openingFloat || 0)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 mb-1">Total Esperado</div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(currentShift.expectedTotal || 0)}
                </div>
              </div>
            </div>

            {currentShift.openingNotes && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <div className="text-xs text-gray-500 mb-1">Notas de apertura:</div>
                <div className="text-sm">{currentShift.openingNotes}</div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/cash/movements"
              className="bg-card border border-border p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-3 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
              <div className="font-semibold">Movimientos</div>
              <div className="text-xs text-gray-500">Ingresos/Egresos</div>
            </Link>

            <Link
              href="/cash/count"
              className="bg-card border border-border p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="font-semibold">Arqueo</div>
              <div className="text-xs text-gray-500">Conteo físico</div>
            </Link>

            <Link
              href={`/cash/shifts/${currentShift.id}/summary`}
              className="bg-card border border-border p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-3 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="font-semibold">Resumen</div>
              <div className="text-xs text-gray-500">Ver detalle</div>
            </Link>

            <Link
              href="/cash/close"
              className="bg-card border-2 border-destructive/30 p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-3 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="font-semibold text-red-600">Cerrar Caja</div>
              <div className="text-xs text-red-500">Finalizar turno</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
