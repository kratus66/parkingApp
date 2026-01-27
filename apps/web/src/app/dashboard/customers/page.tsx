'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  customerService,
  Customer,
  SearchCustomersResponse,
} from '@/services/customerService';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, [page, searchQuery]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.search({
        query: searchQuery || undefined,
        page,
        limit: 10,
      });
      
      console.log('API Response:', response);
      
      // La respuesta viene anidada: { data: { data: [], meta: {} }, meta: {} }
      const actualData = response?.data || response;
      
      if (actualData && typeof actualData === 'object' && 'data' in actualData) {
        const customerData = Array.isArray(actualData.data) ? actualData.data : [];
        setCustomers(customerData);
        setTotalPages(actualData.meta?.totalPages || 1);
        setTotal(actualData.meta?.total || 0);
      } else if (Array.isArray(actualData)) {
        setCustomers(actualData);
        setTotalPages(1);
        setTotal(actualData.length);
      } else {
        console.error('Unexpected response format:', response);
        setCustomers([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on new search
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/customers/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
            <p className="text-gray-400">
              Gestiona los clientes registrados en el sistema
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/customers/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Nuevo Cliente
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, documento, teléfono o email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
          <p className="text-gray-400 text-sm">
            Total de clientes: <span className="text-white font-medium">{total}</span>
          </p>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      Cargando...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {customer.documentType} {customer.documentNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {customer.fullName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {customer.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {customer.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.isActive
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}
                        >
                          {customer.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(customer.id)}
                          className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                Anterior
              </button>
              <span className="text-gray-400 text-sm">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
