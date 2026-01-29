'use client';

import React, { useState, useEffect } from 'react';
import { zoneService, ParkingZone, CreateZoneDto } from '@/services/zoneService';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function ZonesPage() {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ParkingZone | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const parkingLotId = 'b04f6eec-264b-4143-9b71-814b05d4ffc4';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowedVehicleTypes: [] as string[],
  });

  const vehicleTypes = [
    { value: 'CAR', label: 'Autos' },
    { value: 'MOTORCYCLE', label: 'Motos' },
    { value: 'BICYCLE', label: 'Bicicletas' },
    { value: 'TRUCK_BUS', label: 'Camión/Bus' },
  ];

  const loadZones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await zoneService.list(parkingLotId, 1, 100);
      
      // La respuesta tiene la estructura { data: [...], meta: {...} }
      if (response && response.data && Array.isArray(response.data)) {
        setZones(response.data);
      } else {
        console.warn('Respuesta inesperada del API:', response);
        setZones([]);
      }
    } catch (err: any) {
      console.error('Error loading zones:', err);
      setError(err.response?.data?.message || 'Error al cargar zonas');
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleOpenModal = (zone?: ParkingZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        description: zone.description || '',
        allowedVehicleTypes: zone.allowedVehicleTypes,
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: '',
        description: '',
        allowedVehicleTypes: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingZone(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.allowedVehicleTypes.length === 0) {
      setError('Debe seleccionar al menos un tipo de vehículo');
      return;
    }

    try {
      setLoading(true);
      if (editingZone) {
        await zoneService.update(editingZone.id, formData);
      } else {
        await zoneService.create({
          parkingLotId,
          ...formData,
        });
      }
      await loadZones();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar zona');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta zona?')) return;

    try {
      await zoneService.delete(id);
      await loadZones();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar zona');
    }
  };

  const toggleVehicleType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      allowedVehicleTypes: prev.allowedVehicleTypes.includes(type)
        ? prev.allowedVehicleTypes.filter(t => t !== type)
        : [...prev.allowedVehicleTypes, type]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Zonas</h1>
            <p className="text-slate-400 mt-1">Administra las zonas del parqueadero</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Zona
          </button>
        </div>

        {/* Error */}
        {error && !showModal && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Lista de zonas */}
        {loading ? (
          <div className="text-center text-slate-400 py-12">
            Cargando zonas...
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            No hay zonas configuradas. Crea una nueva zona para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{zone.name}</h3>
                    {zone.description && (
                      <p className="text-slate-400 text-sm mt-1">{zone.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(zone)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm mb-2">Tipos permitidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {zone.allowedVehicleTypes.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded"
                      >
                        {type === 'CAR' ? 'Autos' :
                         type === 'MOTORCYCLE' ? 'Motos' :
                         type === 'BICYCLE' ? 'Bicicletas' :
                         'Camión/Bus'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white">
                  {editingZone ? 'Editar Zona' : 'Nueva Zona'}
                </h2>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">Tipos de Vehículo Permitidos *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {vehicleTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => toggleVehicleType(type.value)}
                        className={`p-3 rounded-lg border transition-colors ${
                          formData.allowedVehicleTypes.includes(type.value)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
