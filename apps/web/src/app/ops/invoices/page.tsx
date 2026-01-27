'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  FileText,
  Eye,
  Printer,
  Ban,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { checkoutApi } from '@/services/checkout.service';
import { CustomerInvoice, InvoiceStatus } from '@/types/checkout';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, fromDate, toDate]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await checkoutApi.getInvoices({
        search,
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setInvoices(data);
    } catch (error: any) {
      console.error('Error al cargar facturas:', error);
      alert('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadInvoices();
  };

  const handleViewInvoice = (id: string) => {
    router.push(`/ops/invoices/${id}`);
  };

  const handlePrint = (id: string) => {
    const url = checkoutApi.getInvoiceHtmlUrl(id);
    window.open(url, '_blank');
  };

  const handleVoid = async (invoice: CustomerInvoice) => {
    const reason = prompt('Ingrese el motivo de anulación:');
    if (!reason || reason.trim().length === 0) {
      alert('Debe ingresar un motivo');
      return;
    }

    try {
      await checkoutApi.voidInvoice(invoice.id, reason);
      alert('Factura anulada exitosamente');
      loadInvoices();
    } catch (error: any) {
      alert('Error al anular: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Facturas</h1>
          <p className="text-gray-600">Gestión de facturas de salida</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Número, placa, documento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Buscar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value={InvoiceStatus.ISSUED}>Emitida</option>
                <option value={InvoiceStatus.VOIDED}>Anulada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron facturas
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(invoice.issuedAt).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.customer?.fullName || 'General'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.parkingSession?.vehicle?.licensePlate ||
                          invoice.parkingSession?.vehicle?.bikeCode ||
                          'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        ${invoice.total.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.status === InvoiceStatus.ISSUED ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Emitida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            <XCircle className="w-3 h-3" />
                            Anulada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handlePrint(invoice.id)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Imprimir"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          {invoice.status === InvoiceStatus.ISSUED && (
                            <button
                              onClick={() => handleVoid(invoice)}
                              className="text-red-600 hover:text-red-800"
                              title="Anular"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
