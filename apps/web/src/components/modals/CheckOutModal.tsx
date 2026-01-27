'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Clock, DollarSign, Printer } from 'lucide-react';
import { sessionService } from '@/lib/sessionService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PaymentReceipt } from '@/components/PaymentReceipt';

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parkingLotId: string;
}

interface SessionData {
  id: string;
  ticketNumber: string;
  entryAt: string;
  vehicle: {
    vehicleType: string;
    plate?: string;
    bicycleCode?: string;
    brand?: string;
    model?: string;
    color?: string;
    customer?: {
      fullName: string;
      documentNumber: string;
    };
  };
  spot?: {
    code: string;
    zone?: {
      name: string;
    };
  };
}

/**
 * Modal para registrar salida de vehículos (Check-Out)
 */
export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parkingLotId,
}) => {
  const [step, setStep] = useState<'search' | 'confirm' | 'receipt'>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchType, setSearchType] = useState<'ticket' | 'plate' | 'barcode'>('ticket');
  const [searchValue, setSearchValue] = useState('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [duration, setDuration] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [receiptData, setReceiptData] = useState<any>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      let result: any;
      if (searchType === 'ticket' || searchType === 'barcode') {
        // Tanto ticket como código de barras usan el número de ticket
        result = await sessionService.findByTicketNumber(searchValue);
      } else {
        result = await sessionService.findActiveByPlate(searchValue);
      }

      if (!result || !result.id) {
        setError('No se encontró una sesión activa con ese ' + (searchType === 'ticket' ? 'número de ticket' : searchType === 'barcode' ? 'código de barras' : 'placa'));
        return;
      }

      setSessionData(result);
      
      // Calcular duración
      const entryTime = new Date(result.entryAt);
      const now = new Date();
      const diff = now.getTime() - entryTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDuration(`${hours}h ${minutes}m`);

      // Calcular monto (esto debería venir del backend en el checkout)
      setTotalAmount(0);
      
      setStep('confirm');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!sessionData) return;

    try {
      setLoading(true);
      setError(null);

      const response = await sessionService.checkOut(sessionData.id);
      console.log('Check-out response:', response);

      // El backend devuelve { session, receipt }
      if (response.receipt) {
        setReceiptData(response.receipt);
        setStep('receipt');
      } else {
        // Si no hay recibo, solo cerramos
        onSuccess();
        handleClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar salida');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    console.log('Imprimiendo ticket...');
    // TODO: Implementar impresión de ticket
  };

  const handleClose = () => {
    setStep('search');
    setSearchValue('');
    setSessionData(null);
    setDuration('');
    setTotalAmount(0);
    setReceiptData(null);
    setError(null);
    onClose();
  };

  const handleFinish = () => {
    onSuccess();
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Registrar Salida</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Buscar sesión */}
          {step === 'search' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Buscar por:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setSearchType('ticket')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === 'ticket'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Nº Ticket
                  </button>
                  <button
                    onClick={() => setSearchType('plate')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === 'plate'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Placa
                  </button>
                  <button
                    onClick={() => setSearchType('barcode')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === 'barcode'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Código Barras
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                    placeholder={
                      searchType === 'ticket'
                        ? 'Ej: 20260120-0013'
                        : searchType === 'plate'
                        ? 'Ej: ABC123'
                        : 'Escanee el código de barras del ticket'
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !searchValue}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Buscando...' : 'Buscar Sesión'}
              </button>
            </div>
          )}

          {/* Step 2: Confirmar y procesar pago */}
          {step === 'confirm' && sessionData && (
            <div className="space-y-6">
              {/* Información del vehículo */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ticket:</span>
                  <span className="text-white font-semibold">{sessionData.ticketNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tipo de vehículo:</span>
                  <span className="text-white font-semibold">{sessionData.vehicle.vehicleType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    {sessionData.vehicle.plate ? 'Placa:' : 'Código:'}
                  </span>
                  <span className="text-white font-semibold">
                    {sessionData.vehicle.plate || sessionData.vehicle.bicycleCode}
                  </span>
                </div>
                {sessionData.spot && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Puesto:</span>
                    <span className="text-white font-semibold">
                      {sessionData.spot.zone?.name ? `${sessionData.spot.zone.name} - ` : ''}{sessionData.spot.code}
                    </span>
                  </div>
                )}
                {sessionData.vehicle.customer && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cliente:</span>
                    <span className="text-white font-semibold">
                      {sessionData.vehicle.customer.fullName}
                    </span>
                  </div>
                )}
              </div>

              {/* Información de tiempo y cobro */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Hora de entrada</span>
                  </div>
                  <p className="text-white text-lg font-semibold">
                    {format(new Date(sessionData.entryAt), 'HH:mm', { locale: es })}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {format(new Date(sessionData.entryAt), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Tiempo total</span>
                  </div>
                  <p className="text-white text-lg font-semibold">{duration}</p>
                  <p className="text-slate-400 text-sm">En parqueadero</p>
                </div>
              </div>

              {/* Total a pagar */}
              <div className="p-6 bg-green-500/10 border-2 border-green-500/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Total a pagar</p>
                      <p className="text-white text-3xl font-bold">
                        ${totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Imprimir ticket"
                  >
                    <Printer className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('search')}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Procesando...' : 'Confirmar Pago y Salida'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Mostrar recibo de pago */}
          {step === 'receipt' && receiptData && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-3">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  ¡Pago Procesado!
                </h3>
                <p className="text-slate-400">
                  El vehículo ha sido dado de salida correctamente
                </p>
              </div>

              <PaymentReceipt receiptData={receiptData} />

              <button
                onClick={handleFinish}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
