'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { sessionService } from '@/lib/sessionService';
import { ThermalTicket } from '../ThermalTicket';

interface ReprintTicketModalProps {
  isOpen: boolean;
  ticketNumber: string;
  sessionId: string;
  onClose: () => void;
}

export const ReprintTicketModal: React.FC<ReprintTicketModalProps> = ({
  isOpen,
  ticketNumber,
  sessionId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSessionData();
    } else {
      // Limpiar estado cuando se cierra
      setSessionData(null);
      setShowPreview(false);
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Buscar sesión por ticket number
      const result = await sessionService.findByTicketNumber(ticketNumber);
      console.log('Session data loaded:', result);
      
      // Manejar respuesta anidada
      const actualData = result?.data || result;
      setSessionData(actualData);
      
      if (!actualData) {
        setError('No se encontraron datos del ticket');
      }
    } catch (err: any) {
      console.error('Error loading session data:', err);
      setError(err.message || 'Error al cargar los datos del ticket');
      setSessionData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = async () => {
    if (!reason.trim()) {
      setError('Por favor ingresa un motivo de reimpresión');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await sessionService.reprintTicket({ sessionId, reason });
      console.log('Reprint result:', result);
      // Mostrar preview inmediatamente
      setShowPreview(true);
    } catch (err: any) {
      console.error('Error reprinting ticket:', err);
      setError(err.message || 'Error al reimprimir el ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Reimprimir Ticket #{ticketNumber}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading && !showPreview && (
            <div className="text-center py-8">
              <div className="animate-spin inline-block">
                <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full"></div>
              </div>
              <p className="text-slate-400 mt-4 text-sm">Cargando datos del ticket...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {!showPreview && sessionData && (
            <>
              {/* Información del ticket */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Placa/Código</div>
                    <div className="text-white font-semibold text-sm">
                      {sessionData.vehicle?.plate || sessionData.vehicle?.bicycleCode || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Tipo de Vehículo</div>
                    <div className="text-white font-semibold text-sm">
                      {sessionData.vehicle?.vehicleType || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Cliente</div>
                    <div className="text-white font-semibold text-sm">
                      {sessionData.customer?.fullName || 'Sin cliente'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Puesto</div>
                    <div className="text-white font-semibold text-sm">
                      {sessionData.spot?.code || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivo de reimpresión */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Motivo de Reimpresión
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Ticket dañado, cliente solicita copia..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReprint}
                  disabled={loading || !reason.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Reimprimir y Ver Preview
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}

          {showPreview && sessionData && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm text-center">
                ✅ Ticket reimpreso exitosamente
              </p>
              <ThermalTicket 
                ticketData={sessionData}
                onClose={onClose}
              />
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};;
