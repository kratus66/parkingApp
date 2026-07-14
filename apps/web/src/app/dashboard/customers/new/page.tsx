'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customerService, CreateCustomerDto } from '@/services/customerService';
import { agreementsService, Agreement } from '@/services/agreements.service';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreements, setAgreements] = useState<Agreement[]>([]);

  useEffect(() => {
    agreementsService
      .list({ activeOnly: true })
      .then(setAgreements)
      .catch(() => setAgreements([]));
  }, []);
  const [formData, setFormData] = useState<CreateCustomerDto>({
    documentType: 'CC',
    documentNumber: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Remove empty optional fields
      const data: CreateCustomerDto = {
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        fullName: formData.fullName,
      };

      if (formData.phone) data.phone = formData.phone;
      if (formData.email) data.email = formData.email;
      if (formData.address) data.address = formData.address;
      if (formData.notes) data.notes = formData.notes;
      if (formData.agreementId) data.agreementId = formData.agreementId;

      const customer: any = await customerService.create(data);
      const newId = customer?.data?.id ?? customer?.id;
      router.push(`/dashboard/customers/${newId}`);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(
        err.response?.data?.message ||
          'Error al crear el cliente. Verifique los datos e intente nuevamente.'
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
          <h1 className="text-3xl font-bold text-white mb-2">Nuevo Cliente</h1>
          <p className="text-gray-400">Registra un nuevo cliente en el sistema</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-900 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          {/* Document Type and Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={50}
                placeholder="1234567890"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={255}
              placeholder="Juan Pérez González"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+57 300 1234567"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle 10 # 20-30, Bogotá"
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
              placeholder="Información adicional del cliente..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Convenio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Convenio (descuento aplicado en el checkout)
            </label>
            <select
              name="agreementId"
              value={formData.agreementId || ''}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Sin convenio</option>
              {agreements.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (
                  {a.discountType === 'PERCENT'
                    ? `${a.discountValue}%`
                    : `$${a.discountValue.toLocaleString('es-CO')}`}
                  )
                </option>
              ))}
            </select>
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
              {loading ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm">
            <span className="text-red-500">*</span> Campos obligatorios
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Una vez creado el cliente, podrás agregar sus vehículos y gestionar sus
            consentimientos.
          </p>
        </div>
      </div>
    </div>
  );
}
