'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Car, Bike, Truck, Edit, Trash2, AlertTriangle, Save, X } from 'lucide-react';

interface Vehicle {
  id: string;
  customerId: string;
  vehicleType: string;
  plate?: string;
  bicycleCode?: string;
  brand?: string;
  model?: string;
  color?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    documentType: string;
    documentNumber: string;
    phone?: string;
    email?: string;
  };
}

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    color: '',
    notes: '',
  });

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles-v2/${vehicleId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar el vehículo');
      }

      const result = await response.json();
      console.log('Vehicle API Response:', result);
      
      // Manejar respuesta anidada
      const vehicleData = result?.data || result;
      
      setVehicle(vehicleData);
      setFormData({
        brand: vehicleData.brand || '',
        model: vehicleData.model || '',
        color: vehicleData.color || '',
        notes: vehicleData.notes || '',
      });
    } catch (err: any) {
      console.error('Error loading vehicle:', err);
      setError(err.message || 'Error al cargar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!vehicle) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles-v2/${vehicleId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar vehículo');
      }

      await loadVehicle();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar vehículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles-v2/${vehicleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar vehículo');
      }

      router.push('/dashboard/vehicles');
    } catch (err: any) {
      setError(err.message || 'Error al eliminar vehículo');
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'CAR': return <Car className="w-8 h-8" />;
      case 'MOTORCYCLE': return <Bike className="w-8 h-8" />;
      case 'BICYCLE': return <Bike className="w-8 h-8" />;
      case 'TRUCK_BUS': return <Truck className="w-8 h-8" />;
      default: return <Car className="w-8 h-8" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 mt-4">Cargando vehículo...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Vehículo no encontrado</h3>
            <button
              onClick={() => router.push('/dashboard/vehicles')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Volver a vehículos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/vehicles')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a vehículos
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Detalle de Vehículo</h1>
          <p className="text-slate-400">{vehicle.plate || vehicle.bicycleCode}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-900/50 rounded-lg text-blue-400">
                    {getVehicleIcon(vehicle.vehicleType)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {vehicle.plate || vehicle.bicycleCode || 'Sin identificación'}
                    </h2>
                    <p className="text-slate-400">{getVehicleTypeLabel(vehicle.vehicleType)}</p>
                  </div>
                </div>
                {!isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          brand: vehicle.brand || '',
                          model: vehicle.model || '',
                          color: vehicle.color || '',
                          notes: vehicle.notes || '',
                        });
                      }}
                      className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Marca</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Toyota"
                    />
                  ) : (
                    <p className="text-white">{vehicle.brand || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Modelo</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Corolla"
                    />
                  ) : (
                    <p className="text-white">{vehicle.model || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Color</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Rojo"
                    />
                  ) : (
                    <p className="text-white">{vehicle.color || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    vehicle.isActive
                      ? 'bg-green-900/50 text-green-400 border border-green-600'
                      : 'bg-red-900/50 text-red-400 border border-red-600'
                  }`}>
                    {vehicle.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-400 mb-1">Notas</label>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observaciones adicionales..."
                  />
                ) : (
                  <p className="text-white">{vehicle.notes || 'Sin notas'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            {vehicle.customer && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Propietario</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                    <p className="text-white">{vehicle.customer.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Documento</label>
                    <p className="text-white">
                      {vehicle.customer.documentType} {vehicle.customer.documentNumber}
                    </p>
                  </div>
                  {vehicle.customer.phone && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
                      <p className="text-white">{vehicle.customer.phone}</p>
                    </div>
                  )}
                  {vehicle.customer.email && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                      <p className="text-white">{vehicle.customer.email}</p>
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/customers/${vehicle.customer?.id}`)}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Ver perfil completo
                  </button>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Información del Sistema</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Fecha de registro</label>
                  <p className="text-white">
                    {new Date(vehicle.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Última actualización</label>
                  <p className="text-white">
                    {new Date(vehicle.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
