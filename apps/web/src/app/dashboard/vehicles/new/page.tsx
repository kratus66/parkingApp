'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { vehicleService, CreateVehicleDto } from '@/services/vehicleService';
import { customerService, Customer } from '@/services/customerService';

function NewVehicleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');

  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(!!customerId);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateVehicleDto>({
    customerId: customerId || '',
    vehicleType: 'CAR',
    plate: '',
    bicycleCode: '',
    brand: '',
    model: '',
    color: '',
    notes: '',
  });

  useEffect(() => {
    if (customerId) {
      loadCustomer(customerId);
    }
  }, [customerId]);

  const loadCustomer = async (id: string) => {
    try {
      setLoadingCustomer(true);
      const customerData = await customerService.findOne(id);
      setCustomer(customerData);
      setFormData((prev) => ({ ...prev, customerId: id }));
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Error al cargar los datos del cliente');
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data based on vehicle type
      const data: CreateVehicleDto = {
        customerId: formData.customerId,
        vehicleType: formData.vehicleType,
      };

      if (formData.vehicleType === 'BICYCLE') {
        data.bicycleCode = formData.bicycleCode;
        data.plate = undefined;
      } else {
        data.plate = formData.plate;
        data.bicycleCode = undefined;
      }

      if (formData.brand) data.brand = formData.brand;
      if (formData.model) data.model = formData.model;
      if (formData.color) data.color = formData.color;
      if (formData.notes) data.notes = formData.notes;

      await vehicleService.create(data);
      
      // Redirect to customer detail page
      if (customerId) {
        router.push(`/dashboard/customers/${customerId}`);
      } else {
        router.push('/dashboard/customers');
      }
    } catch (err: any) {
      console.error('Error creating vehicle:', err);
      setError(
        err.response?.data?.message ||
          'Error al crear el vehículo. Verifique los datos e intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loadingCustomer) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Nuevo Vehículo</h1>
          <p className="text-gray-400">Registra un nuevo vehículo en el sistema</p>
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Cliente:</p>
            <p className="text-white font-medium">{customer.fullName}</p>
            <p className="text-gray-400 text-sm">
              {customer.documentType} {customer.documentNumber}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-900 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          {/* Customer ID (if not pre-filled) */}
          {!customerId && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID del Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                placeholder="UUID del cliente"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">
                Debe seleccionar el cliente desde la página de clientes
              </p>
            </div>
          )}

          {/* Vehicle Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Vehículo <span className="text-red-500">*</span>
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="CAR">Automóvil</option>
              <option value="MOTORCYCLE">Motocicleta</option>
              <option value="BICYCLE">Bicicleta</option>
              <option value="TRUCK_BUS">Camión/Bus</option>
            </select>
          </div>

          {/* Plate or Bicycle Code */}
          {formData.vehicleType === 'BICYCLE' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de Bicicleta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bicycleCode"
                value={formData.bicycleCode}
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="BICI-001"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Placa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plate"
                value={formData.plate}
                onChange={handleChange}
                required
                maxLength={20}
                placeholder="ABC123"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
          )}

          {/* Brand and Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Marca
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Toyota"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modelo
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Corolla"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Color */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Blanco"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Información adicional del vehículo..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Vehículo'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">
            <span className="text-red-500">*</span> Campos obligatorios
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {formData.vehicleType === 'BICYCLE'
              ? 'Para bicicletas es obligatorio el código, la placa no aplica.'
              : 'Para vehículos motorizados la placa es obligatoria.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    }>
      <NewVehicleForm />
    </Suspense>
  );
}
