'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Banknote, Filter, Calendar } from 'lucide-react';
import { paymentsApi } from '@/services/checkout.service';
import { Payment, PaymentStatus } from '@/types/checkout';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter, fromDate, toDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, statsData] = await Promise.all([
        paymentsApi.getPayments({
          status: statusFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
        paymentsApi.getStats({
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
      ]);
      setPayments(paymentsData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error al cargar pagos:', error);
      alert('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.totalAmount, 0);
  };

  const methodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    QR: 'QR',
    OTHER: 'Otro',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Pagos</h1>
          <p className="text-gray-600">Resumen de pagos recibidos</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Recaudado</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${getTotalAmount().toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transacciones</p>
                <p className="text-2xl font-bold text-gray-800">
                  {payments.filter((p) => p.status === PaymentStatus.PAID).length}
                </p>
              </div>
            </div>
          </div>

          {stats.map((stat) => (
            <div key={stat.method} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  {stat.method === 'CASH' ? (
                    <Banknote className="w-6 h-6 text-purple-600" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{methodLabels[stat.method]}</p>
                  <p className="text-xl font-bold text-gray-800">
                    ${stat.total.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-gray-500">{stat.count} transacciones</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value={PaymentStatus.PAID}>Pagado</option>
                <option value={PaymentStatus.VOIDED}>Anulado</option>
                <option value={PaymentStatus.REFUNDED}>Reembolsado</option>
                <option value={PaymentStatus.PARTIAL}>Parcial</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
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
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Métodos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron pagos
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(payment.createdAt).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.customer?.fullName || 'General'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.parkingSession?.vehicle?.licensePlate ||
                          payment.parkingSession?.vehicle?.bikeCode ||
                          'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.items?.map((item) => methodLabels[item.method]).join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        ${payment.totalAmount.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === PaymentStatus.PAID
                              ? 'bg-green-100 text-green-800'
                              : payment.status === PaymentStatus.VOIDED
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {payment.status === PaymentStatus.PAID
                            ? 'Pagado'
                            : payment.status === PaymentStatus.VOIDED
                              ? 'Anulado'
                              : payment.status}
                        </span>
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
