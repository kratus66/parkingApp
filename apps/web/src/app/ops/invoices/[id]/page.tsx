'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Ban, FileText, User, Car, Clock, CreditCard } from 'lucide-react';
import { checkoutApi } from '@/services/checkout.service';
import { CustomerInvoice, InvoiceStatus } from '@/types/checkout';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<CustomerInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const data = await checkoutApi.getInvoice(params.id);
      setInvoice(data);
    } catch (error: any) {
      console.error('Error al cargar factura:', error);
      alert('Error al cargar factura');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const url = checkoutApi.getInvoiceHtmlUrl(params.id);
    window.open(url, '_blank');
  };

  const handleVoid = async () => {
    if (!invoice) return;

    const reason = prompt('Ingrese el motivo de anulación:');
    if (!reason || reason.trim().length === 0) {
      alert('Debe ingresar un motivo');
      return;
    }

    try {
      await checkoutApi.voidInvoice(invoice.id, reason);
      alert('Factura anulada exitosamente');
      loadInvoice();
    } catch (error: any) {
      alert('Error al anular: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-red-600">Factura no encontrada</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const session = invoice.parkingSession;
  const vehicle = session?.vehicle;
  const customer = invoice.customer;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Factura {invoice.invoiceNumber}</h1>
              <p className="text-gray-600">
                {new Date(invoice.issuedAt).toLocaleString('es-CO', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </button>
            {invoice.status === InvoiceStatus.ISSUED && (
              <button
                onClick={handleVoid}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Ban className="w-5 h-5" />
                Anular
              </button>
            )}
          </div>
        </div>

        {/* Estado */}
        {invoice.status === InvoiceStatus.VOIDED && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="font-bold text-red-800">FACTURA ANULADA</p>
            <p className="text-sm text-red-700">Motivo: {invoice.voidReason}</p>
            <p className="text-xs text-red-600 mt-1">
              Anulada por: {invoice.voidedBy?.email || 'N/A'}
            </p>
          </div>
        )}

        {/* Información */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div className="border-b md:border-b-0 md:border-r pb-6 md:pb-0 md:pr-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Cliente</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{customer?.fullName || 'Cliente general'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">{customer?.documentNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{customer?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Vehículo */}
            <div className="md:pl-6">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Vehículo</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="font-medium">{vehicle?.vehicleType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Placa/Código</p>
                  <p className="font-medium">
                    {vehicle?.licensePlate || vehicle?.bikeCode || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ticket</p>
                  <p className="font-medium">{session?.ticketNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tiempos */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Información de Estacionamiento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Entrada</p>
              <p className="font-medium">
                {session?.entryAt
                  ? new Date(session.entryAt).toLocaleString('es-CO')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Salida</p>
              <p className="font-medium">
                {session?.exitAt
                  ? new Date(session.exitAt).toLocaleString('es-CO')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tiempo Total</p>
              <p className="font-medium text-blue-600 text-lg">
                {session?.entryAt && session?.exitAt
                  ? (() => {
                      const totalMinutes = Math.round(
                        (new Date(session.exitAt).getTime() -
                          new Date(session.entryAt).getTime()) /
                          60000,
                      );
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return `${hours}h ${minutes}m`;
                    })()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Detalle de Factura</h2>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">Descripción</th>
                <th className="text-center py-2">Cantidad</th>
                <th className="text-right py-2">Precio Unit.</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3">{item.description}</td>
                  <td className="text-center py-3">{item.quantity}</td>
                  <td className="text-right py-3">
                    ${item.unitPrice.toLocaleString('es-CO')}
                  </td>
                  <td className="text-right py-3 font-semibold">
                    ${item.total.toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">${invoice.subtotal.toLocaleString('es-CO')}</span>
            </div>
            {invoice.discounts > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuentos:</span>
                <span className="font-semibold">
                  - ${invoice.discounts.toLocaleString('es-CO')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>TOTAL:</span>
              <span className="text-green-600">${invoice.total.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
