'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { customerService, Customer } from '@/services/customerService';
import { User, Mail, Phone, MapPin, FileText, Car, CheckCircle, XCircle, Edit2, Save, X, Trash2 } from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [consents, setConsents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [customerResponse, vehiclesResponse, consentsResponse] = await Promise.all([
        customerService.findOne(customerId),
        customerService.getVehicles(customerId),
        customerService.getConsents(customerId),
      ]);

      console.log('Customer Response:', customerResponse);
      console.log('Vehicles Response:', vehiclesResponse);
      console.log('Consents Response:', consentsResponse);

      // Manejar respuesta anidada del cliente
      const customerData = customerResponse?.data || customerResponse;
      setCustomer(customerData);
      setFormData(customerData);

      // Manejar respuesta anidada de vehículos
      const vehiclesData = vehiclesResponse?.data || vehiclesResponse;
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

      // Manejar respuesta anidada de consentimientos
      const consentsData = consentsResponse?.data || consentsResponse;
      setConsents(consentsData);
    } catch (error) {
      console.error('Error loading customer data:', error);
      alert('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      };

      await customerService.update(customerId, updateData);
      alert('Cliente actualizado exitosamente');
      setEditMode(false);
      loadCustomerData();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error al actualizar el cliente');
    }
  };

  const handleCancel = () => {
    setFormData(customer);
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Note: implementar endpoint de eliminación en el backend si es necesario
      alert('Función de eliminación pendiente de implementación en el backend');
      // await customerService.delete(customerId);
      // router.push('/dashboard/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error al eliminar el cliente');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg">Cargando...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cliente no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard/customers')}
              className="text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              ← Volver a Clientes
            </button>
            <h1 className="text-3xl font-bold text-foreground">
              {customer.fullName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {customer.documentType} {customer.documentNumber}
            </p>
          </div>
          <div className="flex gap-3">
            {!editMode ? (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos Personales */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Información Personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Tipo de Documento
                  </label>
                  {editMode ? (
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="PASSPORT">Pasaporte</option>
                      <option value="PPT">PPT</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  ) : (
                    <p className="text-foreground">{customer.documentType}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Número de Documento
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  ) : (
                    <p className="text-foreground">{customer.documentNumber}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Nombre Completo
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  ) : (
                    <p className="text-foreground">{customer.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  ) : (
                    <p className="text-foreground">{customer.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  ) : (
                    <p className="text-foreground">{customer.email || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Dirección
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  ) : (
                    <p className="text-foreground">{customer.address || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notas
                  </label>
                  {editMode ? (
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  ) : (
                    <p className="text-foreground">{customer.notes || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Vehículos */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Vehículos Registrados ({vehicles.length})
              </h2>
              {vehicles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay vehículos registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground text-lg">
                            {vehicle.plate || vehicle.bicycleCode || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.vehicleType} - {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Color: {vehicle.color}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            vehicle.isActive
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}
                        >
                          {vehicle.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Estado y Consentimientos */}
          <div className="space-y-6">
            {/* Estado del Cliente */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Estado</h3>
              <div className="flex items-center gap-3">
                {customer.isActive ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-foreground font-medium">Activo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="text-foreground font-medium">Inactivo</span>
                  </>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Creado:</strong>{' '}
                  {new Date(customer.createdAt).toLocaleDateString('es-CO')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Actualizado:</strong>{' '}
                  {new Date(customer.updatedAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>

            {/* Consentimientos */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Consentimientos
              </h3>
              {consents && consents.current ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">WhatsApp</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        consents.current.whatsapp === 'GRANTED'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {consents.current.whatsapp === 'GRANTED' ? 'Concedido' : 'Revocado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        consents.current.email === 'GRANTED'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {consents.current.email === 'GRANTED' ? 'Concedido' : 'Revocado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">SMS</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        consents.current.sms === 'GRANTED'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {consents.current.sms === 'GRANTED' ? 'Concedido' : 'Revocado'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay información de consentimientos
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
