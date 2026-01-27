'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Car,
  Clock,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  MoreHorizontal,
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
} from 'lucide-react';
import { checkoutApi } from '@/services/checkout.service';
import { parkingSessionsApi } from '@/services/parking-sessions.service';
import { PaymentMethod, PaymentItem, CheckoutPreview } from '@/types/checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [lostTicket, setLostTicket] = useState(false);
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [currentAmount, setCurrentAmount] = useState('');
  const [currentReference, setCurrentReference] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    try {
      const results = await parkingSessionsApi.getActiveSessions({ search: searchTerm });
      setSessions(results);
      if (results.length === 1) {
        handleSelectSession(results[0]);
      }
    } catch (error: any) {
      alert('Error al buscar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSession = async (session: any) => {
    setSelectedSession(session);
    setSessions([]);
    setSearchTerm('');

    // Automáticamente previsualizar
    try {
      const previewData = await checkoutApi.preview(session.id, lostTicket);
      setPreview(previewData);
    } catch (error: any) {
      alert('Error al calcular: ' + (error.response?.data?.message || error.message));
    }
  };

  const addPaymentItem = () => {
    const amount = parseFloat(currentAmount);
    if (!amount || amount <= 0) {
      alert('Ingrese un monto válido');
      return;
    }

    const item: PaymentItem = {
      method: currentMethod,
      amount: Math.round(amount),
      reference: currentReference || undefined,
      receivedAmount:
        currentMethod === PaymentMethod.CASH && receivedAmount
          ? Math.round(parseFloat(receivedAmount))
          : undefined,
    };

    setPaymentItems([...paymentItems, item]);
    setCurrentAmount('');
    setCurrentReference('');
    setReceivedAmount('');
  };

  const removePaymentItem = (index: number) => {
    setPaymentItems(paymentItems.filter((_, i) => i !== index));
  };

  const getTotalPaid = () => {
    return paymentItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const getChange = () => {
    const cashItems = paymentItems.filter((item) => item.method === PaymentMethod.CASH);
    return cashItems.reduce((sum, item) => {
      const received = item.receivedAmount || 0;
      return sum + (received - item.amount);
    }, 0);
  };

  const handleConfirmCheckout = async () => {
    if (!preview || !selectedSession) return;

    const total = preview.total;
    const paid = getTotalPaid();

    if (paid !== total) {
      alert(`La suma de pagos ($${paid.toLocaleString()}) no coincide con el total ($${total.toLocaleString()})`);
      return;
    }

    if (paymentItems.length === 0) {
      alert('Agregue al menos un método de pago');
      return;
    }

    setProcessing(true);
    try {
      const result = await checkoutApi.confirm(selectedSession.id, paymentItems, lostTicket);
      setInvoiceHtml(result.printableInvoiceHtml);
      setCompleted(true);
      alert('✅ Salida registrada exitosamente');
    } catch (error: any) {
      alert('Error al confirmar: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && invoiceHtml) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleNewCheckout = () => {
    setSelectedSession(null);
    setPreview(null);
    setPaymentItems([]);
    setCompleted(false);
    setInvoiceHtml('');
    setLostTicket(false);
  };

  const paymentMethodIcons: Record<PaymentMethod, any> = {
    [PaymentMethod.CASH]: Banknote,
    [PaymentMethod.CARD]: CreditCard,
    [PaymentMethod.TRANSFER]: DollarSign,
    [PaymentMethod.QR]: Smartphone,
    [PaymentMethod.OTHER]: MoreHorizontal,
  };

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Efectivo',
    [PaymentMethod.CARD]: 'Tarjeta',
    [PaymentMethod.TRANSFER]: 'Transferencia',
    [PaymentMethod.QR]: 'QR',
    [PaymentMethod.OTHER]: 'Otro',
  };

  if (completed && invoiceHtml) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Salida Registrada!</h1>
            <p className="text-gray-600 mb-8">La operación se completó exitosamente.</p>

            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={handlePrintInvoice}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Printer className="w-5 h-5" />
                Imprimir Factura
              </button>
              <button
                onClick={handleNewCheckout}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
                Nueva Salida
              </button>
            </div>

            <div
              className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto"
              dangerouslySetInnerHTML={{ __html: invoiceHtml }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Salida de Vehículos</h1>
          <p className="text-gray-600">Registre la salida y cobro del servicio</p>
        </div>

        {/* Búsqueda */}
        {!selectedSession && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por placa, ticket, documento o código bici..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {sessions.length > 0 && (
              <div className="mt-4 space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {session.vehicle?.licensePlate || session.vehicle?.bikeCode || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">Ticket: {session.ticketNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Entrada: {new Date(session.entryAt).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detalles de sesión y preview */}
        {selectedSession && preview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información de la sesión */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Información de Sesión</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Vehículo</p>
                    <p className="font-semibold">
                      {preview.vehicle?.licensePlate || preview.vehicle?.bikeCode || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Entrada</p>
                    <p className="font-semibold">
                      {new Date(preview.entryAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Salida</p>
                    <p className="font-semibold">
                      {new Date(preview.exitAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Tiempo Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.floor(preview.totalMinutes / 60)}h {preview.totalMinutes % 60}m
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lostTicket}
                      onChange={(e) => setLostTicket(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Ticket perdido (+20% o mín $5,000)</span>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-lg font-semibold text-gray-800">Total a Cobrar</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${preview.total.toLocaleString('es-CO')} COP
                  </p>
                </div>
              </div>
            </div>

            {/* Registro de pagos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Registro de Pago</h2>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={currentMethod}
                    onChange={(e) => setCurrentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(PaymentMethod).map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabels[method]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {currentMethod === PaymentMethod.CASH && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recibido (efectivo)
                    </label>
                    <input
                      type="number"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {currentMethod !== PaymentMethod.CASH && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referencia/Voucher
                    </label>
                    <input
                      type="text"
                      value={currentReference}
                      onChange={(e) => setCurrentReference(e.target.value)}
                      placeholder="Opcional"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <button
                  onClick={addPaymentItem}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Agregar Pago
                </button>
              </div>

              {/* Lista de pagos */}
              <div className="space-y-2 mb-4">
                {paymentItems.map((item, index) => {
                  const Icon = paymentMethodIcons[item.method];
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">{paymentMethodLabels[item.method]}</p>
                          <p className="text-sm text-gray-600">
                            ${item.amount.toLocaleString('es-CO')}
                            {item.receivedAmount &&
                              ` (Recibido: $${item.receivedAmount.toLocaleString('es-CO')})`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removePaymentItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Resumen */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total a cobrar:</span>
                  <span className="font-bold">${preview.total.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total pagado:</span>
                  <span className="font-bold text-blue-600">
                    ${getTotalPaid().toLocaleString('es-CO')}
                  </span>
                </div>
                {getChange() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Cambio:</span>
                    <span className="font-bold">${getChange().toLocaleString('es-CO')}</span>
                  </div>
                )}
                {getTotalPaid() !== preview.total && (
                  <div className="flex justify-between text-red-600">
                    <span>Diferencia:</span>
                    <span className="font-bold">
                      ${Math.abs(getTotalPaid() - preview.total).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirmCheckout}
                disabled={processing || getTotalPaid() !== preview.total}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
              >
                {processing ? 'Procesando...' : 'Confirmar Salida'}
              </button>

              <button
                onClick={handleNewCheckout}
                className="w-full mt-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
