'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Bike, Truck, Clock, MapPin, User, RefreshCw, LogOut, AlertTriangle, Printer, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { sessionService } from '@/lib/sessionService';
import { checkoutApi } from '@/services/checkout.service';
import { PaymentMethod } from '@/types/checkout';
import { LiveQuote } from '@/components/LiveQuote';
import { InvoiceReceipt } from '@/components/InvoiceReceipt';
import { ReprintTicketModal } from '@/components/modals/ReprintTicketModal';

interface ActiveSession {
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

export default function ActiveTicketsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<{ id: string; ticket: string }>({ id: '', ticket: '' });
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [checkoutReceived, setCheckoutReceived] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutConfirming, setCheckoutConfirming] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [reprintTicketNumber, setReprintTicketNumber] = useState('');
  const [reprintSessionId, setReprintSessionId] = useState('');

  // ID del parqueadero (debería venir del contexto del usuario)
  const parkingLotId = 'b04f6eec-264b-4143-9b71-814b05d4ffc4';

  useEffect(() => {
    loadActiveSessions();

    // Auto-refresh cada 30 segundos si está habilitado
    if (autoRefresh) {
      const interval = setInterval(loadActiveSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parking-sessions/active`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar sesiones activas');
      }

      const result = await response.json();
      console.log('Active Sessions API Response:', result);
      
      // Manejar respuesta anidada
      const actualData = result?.data || result;
      const sessionsData = Array.isArray(actualData) ? actualData : [];
      
      setSessions(sessionsData);
    } catch (err: any) {
      console.error('Error loading active sessions:', err);
      setError(err.message || 'Error al cargar sesiones activas');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReprintTicket = async (sessionId: string, ticketNumber: string) => {
    setReprintSessionId(sessionId);
    setReprintTicketNumber(ticketNumber);
    setReprintModalOpen(true);
  };

  const handleCheckout = async (sessionId: string, ticketNumber: string) => {
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // Paso 1: Obtener preview del checkout
      const previewData = await checkoutApi.preview(sessionId, false);
      
      // Paso 2: Mostrar los datos al usuario y solicitar información de pago
      const total = previewData.data?.quote?.total || previewData.quote?.total || 0;
      setCheckoutSession({ id: sessionId, ticket: ticketNumber });
      setCheckoutTotal(total);
      setCheckoutMethod(PaymentMethod.CASH);
      setCheckoutReceived(total ? String(total) : '');
      setCheckoutModalOpen(true);
    } catch (err: any) {
      console.error('Error checking out session:', err);
      alert(err.response?.data?.message || err.message || 'Error al preparar el checkout');
    }
    finally {
      setCheckoutLoading(false);
    }
  };

  const confirmCheckout = async () => {
    if (!checkoutSession.id) return;

    // Solo permitir CASH por ahora
    if (checkoutMethod !== PaymentMethod.CASH) {
      setCheckoutError('Por ahora solo se puede pagar con efectivo. Tarjeta y transferencia se habilitarán próximamente.');
      return;
    }

    const total = checkoutTotal || 0;
    const receivedNumeric = parseInt(checkoutReceived || '0', 10) || 0;

    if (receivedNumeric < total) {
      setCheckoutError(`Monto insuficiente. Debe ser al menos ${new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(total)}`);
      return;
    }

    try {
      setCheckoutConfirming(true);
      setCheckoutError(null);

      const confirmResult = await checkoutApi.confirm(checkoutSession.id, [
        {
          method: PaymentMethod.CASH,
          amount: total,
          receivedAmount: receivedNumeric,
        },
      ]);

      // Preparar datos de la factura
      const session = sessions.find(s => s.id === checkoutSession.id);
      if (confirmResult && session) {
        setInvoiceData({
          invoiceNumber: confirmResult.invoice?.invoiceNumber || 'N/A',
          issuedAt: confirmResult.invoice?.issuedAt || new Date().toISOString(),
          ticketNumber: checkoutSession.ticket,
          entryAt: session.entryAt,
          exitAt: confirmResult.session?.exitAt || new Date().toISOString(),
          vehicle: session.vehicle,
          customer: session.vehicle?.customer,
          parkingLot: { name: 'Parqueadero Centro', address: 'Calle 100 # 10-20, Bogotá' },
          quote: {
            totalMinutes: confirmResult.snapshot?.totalMinutes || 0,
            billableMinutes: confirmResult.snapshot?.billableMinutes || 0,
            graceMinutesApplied: confirmResult.snapshot?.graceMinutesApplied || 0,
            subtotal: confirmResult.snapshot?.subtotal || total,
            total: confirmResult.snapshot?.total || total,
            dailyMaxApplied: confirmResult.snapshot?.dailyMaxApplied || false,
            dailyMaxAmount: confirmResult.snapshot?.dailyMaxAmount || 0,
          },
          payment: confirmResult.payment || { items: [{ method: PaymentMethod.CASH, amount: total, receivedAmount: receivedNumeric, changeAmount: receivedNumeric - total }] },
        });
        setShowInvoice(true);
      }

      setCheckoutModalOpen(false);
      loadActiveSessions();
    } catch (err: any) {
      console.error('Error confirming checkout:', err);
      setCheckoutError(err.response?.data?.message || err.message || 'Error al registrar salida');
    } finally {
      setCheckoutConfirming(false);
    }
  };

  const handleCancelSession = async (sessionId: string, ticketNumber: string) => {
    if (!confirm(`¿Está seguro de cancelar la sesión del ticket #${ticketNumber}?`)) {
      return;
    }

    const reason = prompt('Motivo de la cancelación (obligatorio):');
    if (!reason) {
      alert('Debe proporcionar un motivo para cancelar la sesión');
      return;
    }

    try {
      await sessionService.cancel({ sessionId, reason });
      alert(`Sesión del ticket #${ticketNumber} cancelada exitosamente`);
      // Recargar lista
      loadActiveSessions();
    } catch (err: any) {
      console.error('Error canceling session:', err);
      alert(err.message || 'Error al cancelar sesión');
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'CAR': return <Car className="w-6 h-6" />;
      case 'MOTORCYCLE': return <Bike className="w-6 h-6" />;
      case 'BICYCLE': return <Bike className="w-6 h-6" />;
      case 'TRUCK_BUS': return <Truck className="w-6 h-6" />;
      default: return <Car className="w-6 h-6" />;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CAR': 'Auto',
      'MOTORCYCLE': 'Moto',
      'BICYCLE': 'Bicicleta',
      'TRUCK_BUS': 'Camión/Bus',
    };
    return labels[type] || type;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDurationColor = (minutes: number) => {
    if (minutes < 60) return 'text-green-400';
    if (minutes < 180) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = !searchQuery || 
      session.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.vehicle.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.vehicle.bicycleCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.vehicle.customer?.fullName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = vehicleTypeFilter === 'ALL' || session.vehicle.vehicleType === vehicleTypeFilter;

    return matchesSearch && matchesType;
  });

  const stats = {
    total: sessions.length,
    cars: sessions.filter(s => s.vehicle.vehicleType === 'CAR').length,
    motorcycles: sessions.filter(s => s.vehicle.vehicleType === 'MOTORCYCLE').length,
    bicycles: sessions.filter(s => s.vehicle.vehicleType === 'BICYCLE').length,
    trucks: sessions.filter(s => s.vehicle.vehicleType === 'TRUCK_BUS').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Vehículos Activos</h1>
              <p className="text-slate-400">Vehículos actualmente en el parqueadero</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Auto-actualizar</span>
              </label>
              <button
                onClick={loadActiveSessions}
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Total Activos</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Car className="w-4 h-4" /> Autos
            </div>
            <div className="text-3xl font-bold text-white">{stats.cars}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Bike className="w-4 h-4" /> Motos
            </div>
            <div className="text-3xl font-bold text-white">{stats.motorcycles}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Bike className="w-4 h-4" /> Bicicletas
            </div>
            <div className="text-3xl font-bold text-white">{stats.bicycles}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Truck className="w-4 h-4" /> Camiones
            </div>
            <div className="text-3xl font-bold text-white">{stats.trucks}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Buscar por ticket, placa o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los tipos</option>
                <option value="CAR">Autos</option>
                <option value="MOTORCYCLE">Motos</option>
                <option value="BICYCLE">Bicicletas</option>
                <option value="TRUCK_BUS">Camión/Bus</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-slate-400 text-sm">
            Mostrando {filteredSessions.length} de {sessions.length} vehículos activos
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400 mt-4">Cargando vehículos activos...</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filteredSessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-600 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-900/50 rounded-lg text-blue-400">
                      {getVehicleIcon(session.vehicle.vehicleType)}
                    </div>
                    <div>
                      <div className="font-mono text-white font-semibold text-lg">
                        {session.vehicle.plate || session.vehicle.bicycleCode || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {getVehicleTypeLabel(session.vehicle.vehicleType)}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-900/50 text-green-400 border border-green-600">
                    Activo
                  </span>
                </div>

                {/* Ticket Number */}
                <div className="mb-3 pb-3 border-b border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Ticket</div>
                  <div className="font-mono text-white font-semibold">
                    #{session.ticketNumber}
                  </div>
                </div>

                {/* Spot */}
                {session.spot && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-white">
                      {session.spot.code}{session.spot.zone ? ` - ${session.spot.zone.name}` : ''}
                    </span>
                  </div>
                )}

                {/* Vehicle Details */}
                {(session.vehicle.brand || session.vehicle.model || session.vehicle.color) && (
                  <div className="mb-3 text-sm space-y-1">
                    {session.vehicle.brand && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Marca:</span>
                        <span className="text-white font-medium">{session.vehicle.brand}</span>
                      </div>
                    )}
                    {session.vehicle.model && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Modelo:</span>
                        <span className="text-white font-medium">{session.vehicle.model}</span>
                      </div>
                    )}
                    {session.vehicle.color && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Color:</span>
                        <span className="text-white font-medium">{session.vehicle.color}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer */}
                {session.vehicle.customer && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-white">{session.vehicle.customer.fullName}</div>
                      <div className="text-xs text-slate-400">{session.vehicle.customer.documentNumber}</div>
                    </div>
                  </div>
                )}

                {/* Time Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Hora de entrada:</span>
                    <span className="text-white">
                      {format(new Date(session.entryAt), 'HH:mm', { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Tiempo transcurrido:</span>
                    <span className="font-semibold flex items-center gap-1 text-blue-400">
                      <Clock className="w-4 h-4" />
                      {formatDuration(Math.floor((new Date().getTime() - new Date(session.entryAt).getTime()) / 60000))}
                    </span>
                  </div>
                </div>

                {/* Live Quote */}
                <div className="mb-4">
                  <LiveQuote sessionId={session.id} autoRefresh={true} />
                </div>

                {/* Actions */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleCheckout(session.id, session.ticketNumber)}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Registrar Salida
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleReprintTicket(session.id, session.ticketNumber)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Reimprimir
                    </button>
                    <button
                      onClick={() => handleCancelSession(session.id, session.ticketNumber)}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSessions.length === 0 && (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {sessions.length === 0 ? 'No hay vehículos activos' : 'No se encontraron vehículos'}
            </h3>
            <p className="text-slate-400">
              {sessions.length === 0
                ? 'Todos los vehículos han salido del parqueadero'
                : 'Intenta con otros filtros de búsqueda'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Checkout */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400">Ticket</p>
                <h3 className="text-lg font-semibold text-white">#{checkoutSession.ticket}</h3>
              </div>
              <button
                className="text-slate-400 hover:text-white"
                onClick={() => setCheckoutModalOpen(false)}
                disabled={checkoutConfirming}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total a cobrar</span>
                <span className="text-xl font-bold text-white">{formatCurrency(checkoutTotal)}</span>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 text-sm">Método de pago</span>
                <div className="grid grid-cols-3 gap-2">
                  {[PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.TRANSFER].map((method) => (
                    <button
                      key={method}
                      onClick={() => {
                        if (method === PaymentMethod.CASH) {
                          setCheckoutMethod(method);
                        } else {
                          setCheckoutError('Tarjeta y transferencia se habilitarán próximamente. Por ahora solo funciona efectivo.');
                        }
                      }}
                      disabled={method !== PaymentMethod.CASH}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        checkoutMethod === method
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : method !== PaymentMethod.CASH
                          ? 'border-slate-700 bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {method === PaymentMethod.CASH && 'Efectivo'}
                      {method === PaymentMethod.CARD && 'Tarjeta (próx.)'}
                      {method === PaymentMethod.TRANSFER && 'Transferencia (próx.)'}
                    </button>
                  ))}
                </div>
              </div>

              {checkoutMethod === PaymentMethod.CASH && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-400" htmlFor="receivedAmount">Monto recibido</label>
                  <input
                    id="receivedAmount"
                    type="number"
                    min={checkoutTotal}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    value={checkoutReceived}
                    onChange={(e) => setCheckoutReceived(e.target.value)}
                  />
                  <div className="text-sm text-slate-400">
                    Cambio: <span className="font-semibold text-white">{formatCurrency(Math.max((parseInt(checkoutReceived || '0', 10) || 0) - (checkoutTotal || 0), 0))}</span>
                  </div>
                </div>
              )}

              {checkoutError && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {checkoutError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 hover:border-slate-500"
                onClick={() => setCheckoutModalOpen(false)}
                disabled={checkoutConfirming}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={confirmCheckout}
                disabled={checkoutConfirming}
              >
                {checkoutConfirming ? 'Procesando...' : 'Registrar Salida'}
              </button>
            </div>

            {checkoutLoading && (
              <p className="mt-3 text-center text-xs text-slate-500">Preparando checkout...</p>
            )}
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {showInvoice && invoiceData && (
        <InvoiceReceipt 
          invoiceData={invoiceData} 
          onClose={() => {
            setShowInvoice(false);
            setInvoiceData(null);
          }} 
        />
      )}

      {/* Reprint Ticket Modal */}
      <ReprintTicketModal
        isOpen={reprintModalOpen}
        ticketNumber={reprintTicketNumber}
        sessionId={reprintSessionId}
        onClose={() => {
          setReprintModalOpen(false);
          loadActiveSessions();
        }}
      />
    </div>
  );
}
