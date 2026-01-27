'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, DollarSign } from 'lucide-react';

interface TariffPlan {
  id: string;
  name: string;
  isActive: boolean;
  timezone: string;
  createdAt: string;
}

interface TariffRule {
  id: string;
  vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'TRUCK_BUS';
  dayType: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
  period: 'DAY' | 'NIGHT';
  startTime: string;
  endTime: string;
  billingUnit: 'MINUTE' | 'BLOCK_15' | 'BLOCK_30' | 'HOUR' | 'DAY';
  unitPrice: number;
  minimumCharge: number;
  dailyMax: number;
  graceMinutes: number;
  rounding: 'CEIL' | 'FLOOR' | 'NEAREST';
  isActive: boolean;
}

interface PricingConfig {
  id: string;
  defaultGraceMinutes: number;
  defaultDailyMax: number;
  lostTicketFee: number;
  enableDynamicPricing: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<TariffPlan[]>([]);
  const [rules, setRules] = useState<TariffRule[]>([]);
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'rules' | 'config'>('plans');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load plans
      const plansRes = await fetch('http://localhost:3002/api/v1/pricing/plans', { headers });
      const plansData = await plansRes.json();
      setPlans(plansData);

      // Load active plan
      const activePlan = plansData.find((p: TariffPlan) => p.isActive);
      if (activePlan) {
        setSelectedPlan(activePlan.id);

        // Load rules for active plan
        const rulesRes = await fetch(
          `http://localhost:3002/api/v1/pricing/rules?tariffPlanId=${activePlan.id}`,
          { headers }
        );
        const rulesData = await rulesRes.json();
        setRules(rulesData);
      }

      // Load config
      const configRes = await fetch('http://localhost:3002/api/v1/pricing/config', { headers });
      const configData = await configRes.json();
      setConfig(configData);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (planId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3002/api/v1/pricing/plans/${planId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (error) {
      console.error('Error activating plan:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const vehicleTypeLabels = {
    BICYCLE: '🚲 Bicicleta',
    MOTORCYCLE: '🏍️ Moto',
    CAR: '🚗 Auto',
    TRUCK_BUS: '🚚 Camión/Bus',
  };

  const dayTypeLabels = {
    WEEKDAY: 'Entre semana',
    WEEKEND: 'Fin de semana',
    HOLIDAY: 'Festivo',
  };

  const periodLabels = {
    DAY: '☀️ Día',
    NIGHT: '🌙 Noche',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Motor de Tarifas</h1>
        <p className="text-gray-600">Gestiona planes, reglas y configuración de precios</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Planes de Tarifas
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reglas de Tarificación
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuración Global
          </button>
        </nav>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Planes de Tarifas</h2>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={20} />
              Nuevo Plan
            </button>
          </div>

          <div className="grid gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-lg border-2 ${
                  plan.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        plan.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-gray-600">
                        Zona horaria: {plan.timezone} | Creado:{' '}
                        {new Date(plan.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!plan.isActive && (
                      <button
                        onClick={() => activatePlan(plan.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <Power size={16} />
                        Activar
                      </button>
                    )}
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Reglas de Tarificación</h2>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={20} />
              Nueva Regla
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo de Día
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Periodo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Horario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Precio/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className={!rule.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vehicleTypeLabels[rule.vehicleType]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dayTypeLabels[rule.dayType]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {periodLabels[rule.period]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {rule.startTime} - {rule.endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(rule.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(rule.minimumCharge)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && config && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Configuración Global</h2>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periodo de Gracia (minutos)
                </label>
                <input
                  type="number"
                  value={config.defaultGraceMinutes}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo Diario
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={config.defaultDailyMax}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarifa Ticket Perdido
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={config.lostTicketFee}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.enableDynamicPricing}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Habilitar Precios Dinámicos
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
