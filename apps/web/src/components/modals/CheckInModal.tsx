'use client';

import React, { useState, useRef, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { X, Search, Car, Bike, Truck, Bus, Plus, MapPin } from 'lucide-react';
import { customerService, IdentifyResponse } from '@/lib/customerService';
import { vehicleService } from '@/lib/vehicleService';
import { sessionService } from '@/lib/sessionService';
import { occupancyService, ParkingSpot } from '@/services/occupancyService';
import { ThermalTicket } from '@/components/ThermalTicket';

interface TicketData {
  ticketNumber: string;
  entryAt: string;
  spot: {
    code: string;
    type: string;
  };
  vehicle: {
    plate?: string;
    bicycleCode?: string;
    vehicleType: string;
    brand?: string;
    model?: string;
    color?: string;
  };
  customer?: {
    fullName: string;
    documentType: string;
    documentNumber: string;
    phone?: string;
    email?: string;
  } | null;
  parkingLot?: {
    name: string;
    address?: string;
  } | null;
}

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parkingLotId: string;
}

type VehicleType = 'CAR' | 'BICYCLE' | 'MOTORCYCLE' | 'TRUCK_BUS';

/**
 * Modal para registrar entrada de vehículos (Check-In)
 */
export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parkingLotId,
}) => {
  const [step, setStep] = useState<'identify' | 'vehicle' | 'confirm' | 'selectSpot'>('identify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Datos de identificación
  const [searchType, setSearchType] = useState<'plate' | 'bikeCode' | 'document'>('plate');
  const [searchValue, setSearchValue] = useState('');
  const [identifyResult, setIdentifyResult] = useState<IdentifyResponse | null>(null);
  const [suggestions, setSuggestions] = useState<IdentifyResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Datos del puesto
  const [availableSpots, setAvailableSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  
  // Datos del ticket
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  
  // Datos del cliente nuevo (movido aquí antes del useEffect)
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Consentimientos
  const [consentWhatsapp, setConsentWhatsapp] = useState(false);
  const [consentEmail, setConsentEmail] = useState(false);
  
    // Debounced autofilter
    const debouncedIdentify = useRef(
      debounce(async (value: string, type: string) => {
        if (!value) {
          setSuggestions(null);
          return;
        }
        try {
          let request: any = {};
          if (type === 'plate') request.vehiclePlate = value;
          if (type === 'bikeCode') request.bicycleCode = value;
          if (type === 'document') {
            request.documentType = documentType;
            request.documentNumber = value;
          }
          const result = await customerService.identify(request);
          if (result.found) {
            setSuggestions(result);
          } else {
            setSuggestions(null);
          }
        } catch {
          setSuggestions(null);
        }
      }, 400)
    ).current;

    useEffect(() => {
      if (searchValue.length > 1) {
        debouncedIdentify(searchValue, searchType);
        setShowSuggestions(true);
      } else {
        setSuggestions(null);
        setShowSuggestions(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchValue, searchType, documentType]);
  
  // Datos del vehículo
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [licensePlate, setLicensePlate] = useState('');
  const [bicycleCode, setBicycleCode] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const vehicleTypes = [
    { type: 'CAR' as VehicleType, label: 'Auto', icon: Car },
    { type: 'BICYCLE' as VehicleType, label: 'Bicicleta', icon: Bike },
    { type: 'MOTORCYCLE' as VehicleType, label: 'Moto', icon: Car },
    { type: 'TRUCK_BUS' as VehicleType, label: 'Camión/Bus', icon: Truck },
  ];

  if (!isOpen) return null;

  // Mover handleSelectVehicle al scope principal
  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = identifyResult?.vehicles?.find(v => v.id === vehicleId);
    if (vehicle) {
      setLicensePlate(vehicle.plate || '');
      setBicycleCode(vehicle.bicycleCode || '');
      setBrand(vehicle.brand || '');
      setModel(vehicle.model || '');
      setColor(vehicle.color || '');
    }
  };

  const handleIdentify = async () => {
    try {
      setLoading(true);
      setError(null);

      const request: any = {};
      if (searchType === 'plate') request.vehiclePlate = searchValue;
      if (searchType === 'bikeCode') request.bicycleCode = searchValue;
      if (searchType === 'document') {
        request.documentType = documentType;
        request.documentNumber = searchValue;
      }

      const result = await customerService.identify(request);
      setIdentifyResult(result);

      if (result.found && result.vehicles && result.vehicles.length > 0) {
        // Vehículo encontrado: pasar al paso de confirmación
        setSelectedVehicleId(result.vehicles[0].id);
        setLicensePlate(result.vehicles[0].plate || '');
        setBicycleCode(result.vehicles[0].bicycleCode || '');
        setBrand(result.vehicles[0].brand || '');
        setModel(result.vehicles[0].model || '');
        setColor(result.vehicles[0].color || '');
        setIsNewCustomer(false);
        setFullName(result.customer?.fullName || '');
        setPhone(result.customer?.phone || '');
        setEmail(result.customer?.email || '');
        // Ir al paso de confirmación en lugar de check-in automático
        setStep('confirm');
      } else if (result.found) {
        // Cliente encontrado pero sin vehículos: mostrar formulario para registrar vehículo
        setIsNewCustomer(false);
        setSelectedVehicleId(null);
        setLicensePlate('');
        setBicycleCode('');
        setBrand('');
        setModel('');
        setColor('');
        setFullName(result.customer?.fullName || '');
        setPhone(result.customer?.phone || '');
        setEmail(result.customer?.email || '');
        setStep('vehicle');
      } else {
        // Cliente no encontrado
        setIsNewCustomer(true);
        setSelectedVehicleId(null);
        setLicensePlate(searchType === 'plate' ? searchValue : '');
        setBicycleCode('');
        setBrand('');
        setModel('');
        setColor('');
        setStep('vehicle');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al identificar');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToSpotSelection = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 [handleProceedToSpotSelection] Iniciando selección de puesto');
      console.log('📋 parkingLotId:', parkingLotId);
      console.log('📋 parkingLotId length:', parkingLotId?.length);
      console.log('📋 vehicleType (estado):', vehicleType);
      console.log('📋 identifyResult:', identifyResult);

      // Validar parkingLotId
      if (!parkingLotId || parkingLotId === 'default-parking-lot-id') {
        setError('No se ha seleccionado un parqueadero válido');
        setLoading(false);
        return;
      }

      // Determinar el tipo de vehículo a usar
      let vType = vehicleType;
      
      // Si hay un vehículo identificado, usar su tipo
      if (identifyResult?.vehicles && identifyResult.vehicles.length > 0) {
        console.log('✅ Vehículos encontrados:', identifyResult.vehicles.length);
        
        if (selectedVehicleId) {
          // Si hay múltiples vehículos y uno está seleccionado
          const selectedVehicle = identifyResult.vehicles.find(v => v.id === selectedVehicleId);
          if (selectedVehicle) {
            vType = selectedVehicle.vehicleType as VehicleType;
            console.log('🎯 Vehículo seleccionado:', selectedVehicle);
          }
        } else {
          // Si solo hay un vehículo, usar el primero
          vType = identifyResult.vehicles[0].vehicleType as VehicleType;
          console.log('🎯 Usando primer vehículo:', identifyResult.vehicles[0]);
        }
      }

      console.log('🚗 Tipo de vehículo determinado:', vType);

      if (!vType) {
        console.error('❌ No se pudo determinar el tipo de vehículo');
        setError('No se pudo determinar el tipo de vehículo');
        setLoading(false);
        return;
      }

      // Cargar puestos disponibles para el tipo de vehículo
      console.log('📡 Llamando a getAvailableSpots con:', { parkingLotId, vType });
      const spots = await occupancyService.getAvailableSpots(parkingLotId, vType);
      console.log('✅ Puestos recibidos:', spots);
      
      if (spots.length === 0) {
        console.warn('⚠️ No hay puestos disponibles');
        setError(`No hay puestos disponibles para vehículos tipo ${vType}`);
        setLoading(false);
        return;
      }

      setAvailableSpots(spots);
      setSelectedSpotId(spots[0].id); // Seleccionar el primero por defecto
      console.log('✅ Transicionando a selectSpot con', spots.length, 'puestos');
      setStep('selectSpot');
    } catch (err: any) {
      console.error('❌ Error en handleProceedToSpotSelection:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Error message:', err.message);
      setError(err.response?.data?.message || err.message || 'Error al cargar puestos disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
        // Validar parkingLotId antes de continuar
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!parkingLotId || parkingLotId === 'default-parking-lot-id' || !uuidRegex.test(parkingLotId)) {
          setError('Debes seleccionar un parqueadero válido antes de registrar la entrada.');
          setLoading(false);
          return;
        }
    try {
      setLoading(true);
      setError(null);

      // Validación de placa y código
      if (vehicleType !== 'BICYCLE' && licensePlate && licensePlate.length > 20) {
        setError('La placa no puede tener más de 20 caracteres');
        setLoading(false);
        return;
      }
      if (vehicleType === 'BICYCLE' && bicycleCode && bicycleCode.length > 50) {
        setError('El código de bicicleta no puede tener más de 50 caracteres');
        setLoading(false);
        return;
      }

      // Normalizar placa y código
      const normalizedPlate = licensePlate ? licensePlate.trim().toUpperCase() : undefined;
      const normalizedBicycleCode = bicycleCode ? bicycleCode.trim().toUpperCase() : undefined;

      let customerId = identifyResult?.customer?.id;
      let vehicleId = selectedVehicleId;

      // Solo crear cliente si es explícitamente nuevo Y no existe customerId
      if (!customerId && isNewCustomer && documentNumber && fullName) {
        const customerData = {
          documentType,
          documentNumber,
          fullName,
          phone,
          email,
        };
        console.log('🆕 Creando nuevo cliente:', customerData);
        try {
          const newCustomer: any = await customerService.create(customerData);
          console.log('✅ Cliente creado:', newCustomer);
          customerId = newCustomer.id;
        } catch (error: any) {
          // Si falla porque ya existe, intentar identificarlo
          if (error.response?.status === 409) {
            console.log('ℹ️ Cliente ya existe, identificando...');
            const existingCustomer = await customerService.identify({ documentType, documentNumber });
            if (existingCustomer.found && existingCustomer.customer) {
              customerId = existingCustomer.customer.id;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      // Solo crear vehículo si no hay vehicleId Y tenemos customerId
      if (!vehicleId && customerId) {
        const vehiclePayload: any = {
          customerId,
          vehicleType,
        };
        
        if (vehicleType === 'BICYCLE') {
          vehiclePayload.bicycleCode = normalizedBicycleCode;
        } else {
          vehiclePayload.plate = normalizedPlate;
        }
        
        if (brand) vehiclePayload.brand = brand;
        if (model) vehiclePayload.model = model;
        if (color) vehiclePayload.color = color;
        
        console.log('🚗 Creando vehículo:', vehiclePayload);
        try {
          const createdVehicle = await vehicleService.create(vehiclePayload);
          console.log('✅ Vehículo creado:', createdVehicle);
          vehicleId = createdVehicle.id;
        } catch (error: any) {
          // Si falla porque ya existe, intentar identificarlo por placa
          if (error.response?.status === 409) {
            console.log('ℹ️ Vehículo ya existe, identificando...');
            const identifyRequest: any = {};
            if (vehicleType === 'BICYCLE') {
              identifyRequest.bicycleCode = normalizedBicycleCode;
            } else {
              identifyRequest.vehiclePlate = normalizedPlate;
            }
            const existingVehicle = await customerService.identify(identifyRequest);
            if (existingVehicle.found && existingVehicle.vehicles && existingVehicle.vehicles.length > 0) {
              vehicleId = existingVehicle.vehicles[0].id;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      // Registrar check-in
      const checkInPayload: any = {
        parkingLotId,
        vehicleType,
        vehiclePlate: vehicleType !== 'BICYCLE' ? normalizedPlate : normalizedBicycleCode || 'BIKE-TEMP',
      };
      
      // Agregar datos del cliente si están disponibles
      if (phone) checkInPayload.phoneNumber = phone;
      if (email) checkInPayload.email = email;
      
      // Agregar consentimientos
      if (consentWhatsapp && phone) {
        checkInPayload.whatsappConsent = true;
      }
      if (consentEmail && email) {
        checkInPayload.emailConsent = true;
      }
      
      // Agregar el puesto seleccionado si está disponible
      if (selectedSpotId) {
        checkInPayload.parkingSpotId = selectedSpotId;
      }
      
      console.log('📤 Enviando check-in:', checkInPayload);
      const response = await sessionService.checkIn(checkInPayload);
      
      console.log('✅ Check-in response:', response);
      console.log('📋 response.ticket:', response?.ticket);
      console.log('📋 ticketData exists?', !!response?.ticket);

      // Si la respuesta incluye datos del ticket, mostrarlos
      if (response && response.ticket) {
        console.log('✅ Mostrando ticket');
        setTicketData(response.ticket);
        setShowTicket(true);
      } else {
        console.log('⚠️ No hay datos de ticket en la respuesta');
        // Si no hay ticket, cerrar directamente
        onSuccess();
        handleClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar entrada');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('identify');
    setSearchValue('');
    setIdentifyResult(null);
    setIsNewCustomer(false);
    setLicensePlate('');
    setBicycleCode('');
    setBrand('');
    setModel('');
    setColor('');
    setDocumentNumber('');
    setFullName('');
    setPhone('');
    setEmail('');
    setConsentWhatsapp(false);
    setConsentEmail(false);
    setError(null);
    setTicketData(null);
    setShowTicket(false);
    setAvailableSpots([]);
    setSelectedSpotId(null);
    onClose();
  };

  const handleTicketClose = () => {
    setShowTicket(false);
    setTicketData(null);
    onSuccess();
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Registrar Entrada</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Identificar */}
          {step === 'identify' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Buscar por:
                </label>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSearchType('plate')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === 'plate'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Placa
                  </button>
                  <button
                    onClick={() => setSearchType('bikeCode')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === 'bikeCode'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Código Bici
                  </button>
                  <button
                    onClick={() => setSearchType('document')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === 'document'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Documento
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                    placeholder={
                      searchType === 'plate'
                        ? 'Ej: ABC123'
                        : searchType === 'bikeCode'
                        ? 'Ej: BIKE001'
                        : 'Número de documento'
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleIdentify()}
                    autoComplete="off"
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {/* Sugerencias en tiempo real */}
                  {showSuggestions && suggestions && (suggestions.vehicles?.length || suggestions.customer) && (
                    <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
                      {suggestions.vehicles && suggestions.vehicles.length > 0 ? (
                        suggestions.vehicles.map((v) => (
                          <div
                            key={v.id}
                            className="px-4 py-2 hover:bg-blue-900 cursor-pointer text-white"
                            onMouseDown={() => {
                              setSearchValue(v.plate || v.bicycleCode || '');
                              setIdentifyResult(suggestions);
                              setShowSuggestions(false);
                              setTimeout(() => handleIdentify(), 100);
                            }}
                          >
                            {v.plate || v.bicycleCode} - {v.vehicleType} {v.brand ? `(${v.brand})` : ''}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-slate-400">Sin vehículos registrados</div>
                      )}
                      {suggestions.customer && (
                        <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-700">
                          Cliente: {suggestions.customer.fullName} ({suggestions.customer.documentNumber})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleIdentify}
                disabled={loading || !searchValue}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Buscando...' : 'Buscar Cliente'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setIsNewCustomer(true);
                    setStep('vehicle');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Cliente nuevo (sin búsqueda)
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Datos del vehículo */}
          {step === 'vehicle' && (
            <div className="space-y-6">
              {identifyResult?.found && (
                <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <p className="text-green-400 font-medium">
                    ✓ Cliente encontrado: {identifyResult.customer?.fullName}
                  </p>
                  {identifyResult.vehicles && identifyResult.vehicles.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Selecciona un vehículo
                      </label>
                      <select
                        value={selectedVehicleId || ''}
                        onChange={e => handleSelectVehicle(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {identifyResult.vehicles.map(vehicle => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate || vehicle.bicycleCode || 'Sin placa/código'} - {vehicle.vehicleType}
                          </option>
                        ))}
                        <option value="">Registrar nuevo vehículo</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {(isNewCustomer || (!selectedVehicleId && identifyResult?.found)) && (
                <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <h3 className="text-white font-semibold">Datos del Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tipo de Documento
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CC">Cédula</option>
                        <option value="CE">Cédula Extranjería</option>
                        <option value="PA">Pasaporte</option>
                        <option value="NIT">NIT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Tipo de Vehículo *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {vehicleTypes.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setVehicleType(type)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        vehicleType === type
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 mx-auto mb-2 ${
                          vehicleType === type ? 'text-blue-400' : 'text-slate-400'
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          vehicleType === type ? 'text-blue-400' : 'text-slate-300'
                        }`}
                      >
                        {label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {vehicleType !== 'BICYCLE' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Placa *
                  </label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="Ej: ABC123"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Código de Bicicleta *
                  </label>
                  <input
                    type="text"
                    value={bicycleCode}
                    onChange={(e) => setBicycleCode(e.target.value.toUpperCase())}
                    placeholder="Ej: BIKE001"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Consentimientos - Mostrar siempre en paso vehicle si es nuevo cliente */}
              {(isNewCustomer || (!selectedVehicleId && identifyResult?.found)) && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <h4 className="text-slate-300 font-medium mb-3">Preferencias de Comunicación</h4>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentWhatsapp}
                        onChange={(e) => setConsentWhatsapp(e.target.checked)}
                        disabled={!phone}
                        className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="text-sm">
                        <p className={phone ? "text-slate-300" : "text-slate-500"}>
                          Acepto recibir notificaciones por WhatsApp
                        </p>
                        <p className="text-slate-500 text-xs">
                          {phone ? "Recibirás alertas cuando tu vehículo deba salir" : "Ingresa un teléfono para habilitar"}
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentEmail}
                        onChange={(e) => setConsentEmail(e.target.checked)}
                        disabled={!email}
                        className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="text-sm">
                        <p className={email ? "text-slate-300" : "text-slate-500"}>
                          Acepto recibir notificaciones por Email
                        </p>
                        <p className="text-slate-500 text-xs">
                          {email ? "Recibirás recordatorios y actualizaciones importantes" : "Ingresa un email para habilitar"}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('identify')}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={
                    loading ||
                    (vehicleType !== 'BICYCLE' && !licensePlate) ||
                    (vehicleType === 'BICYCLE' && !bicycleCode) ||
                    (isNewCustomer && (!documentNumber || !fullName))
                  }
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Procesando...' : 'Registrar Entrada'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmación de check-in para vehículo existente */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                <h3 className="text-green-400 font-medium text-lg mb-4">✓ Vehículo Encontrado</h3>
                <div className="space-y-2 text-slate-300">
                  <p><span className="font-medium">Cliente:</span> {fullName}</p>
                  {licensePlate && <p><span className="font-medium">Placa:</span> {licensePlate}</p>}
                  {bicycleCode && <p><span className="font-medium">Código:</span> {bicycleCode}</p>}
                  {brand && <p><span className="font-medium">Marca:</span> {brand}</p>}
                  {model && <p><span className="font-medium">Modelo:</span> {model}</p>}
                  {color && <p><span className="font-medium">Color:</span> {color}</p>}
                  {phone && <p><span className="font-medium">Teléfono:</span> {phone}</p>}
                  {email && <p><span className="font-medium">Email:</span> {email}</p>}
                </div>
              </div>

              {/* Consentimientos */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <h4 className="text-slate-300 font-medium mb-3">Preferencias de Comunicación</h4>
                <div className="space-y-3">
                  {phone && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentWhatsapp}
                        onChange={(e) => setConsentWhatsapp(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <p className="text-slate-300">Acepto recibir notificaciones por WhatsApp</p>
                        <p className="text-slate-500 text-xs">
                          Recibirás alertas cuando tu vehículo deba salir
                        </p>
                      </div>
                    </label>
                  )}
                  {email && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentEmail}
                        onChange={(e) => setConsentEmail(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <p className="text-slate-300">Acepto recibir notificaciones por Email</p>
                        <p className="text-slate-500 text-xs">
                          Recibirás recordatorios y actualizaciones importantes
                        </p>
                      </div>
                    </label>
                  )}
                  {!phone && !email && (
                    <p className="text-slate-500 text-sm">
                      No hay información de contacto disponible para enviar notificaciones
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('identify')}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProceedToSpotSelection}
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Cargando...' : 'Seleccionar Puesto'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Selección de puesto de estacionamiento */}
          {step === 'selectSpot' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <h3 className="text-blue-400 font-medium text-lg mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Selecciona un Puesto Disponible
                </h3>
                <p className="text-slate-400 text-sm">
                  Puestos disponibles para vehículos tipo {vehicleType === 'CAR' ? 'Auto' : vehicleType === 'MOTORCYCLE' ? 'Moto' : vehicleType === 'BICYCLE' ? 'Bicicleta' : 'Camión/Bus'}
                </p>
              </div>

              {availableSpots.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>No hay puestos disponibles en este momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {availableSpots.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => setSelectedSpotId(spot.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedSpotId === spot.id
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl font-bold mb-1">{spot.code}</div>
                        <div className="text-xs text-slate-500">
                          {spot.spotType === 'CAR' ? 'Auto' : spot.spotType === 'MOTORCYCLE' ? 'Moto' : spot.spotType === 'BICYCLE' ? 'Bici' : 'Camión'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Consentimientos */}
              {(phone || email) && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <h4 className="text-slate-300 font-medium mb-3">Preferencias de Comunicación</h4>
                  <div className="space-y-3">
                    {phone && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentWhatsapp}
                          onChange={(e) => setConsentWhatsapp(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <div className="text-sm">
                          <p className="text-slate-300">Acepto recibir notificaciones por WhatsApp</p>
                          <p className="text-slate-500 text-xs">
                            Recibirás alertas cuando tu vehículo deba salir
                          </p>
                        </div>
                      </label>
                    )}
                    {email && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentEmail}
                          onChange={(e) => setConsentEmail(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <div className="text-sm">
                          <p className="text-slate-300">Acepto recibir notificaciones por Email</p>
                          <p className="text-slate-500 text-xs">
                            Recibirás recordatorios y actualizaciones importantes
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={loading || !selectedSpotId}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Procesando...' : 'Confirmar Puesto y Registrar Entrada'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Ticket Térmico */}
      {showTicket && ticketData && (
        <ThermalTicket ticketData={ticketData} onClose={handleTicketClose} />
      )}
    </div>
  );
};
