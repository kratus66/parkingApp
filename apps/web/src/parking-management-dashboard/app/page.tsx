"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopBar } from "@/components/top-bar"
import { GaugeMeter } from "@/components/gauge-meter"
import { VehicleCard } from "@/components/vehicle-card"
import { KPICards } from "@/components/kpi-cards"
import { AlertsPanel } from "@/components/alerts-panel"
import { RegisterVehicleModal } from "@/components/register-vehicle-modal"

// Mock data
const mockData = {
  totalCapacity: 200,
  totalOccupied: 142,
  capacityByType: {
    car: { occupied: 85, capacity: 120 },
    bicycle: { occupied: 12, capacity: 30 },
    truck: { occupied: 28, capacity: 30 },
    bus: { occupied: 17, capacity: 20 },
  },
  dailyRevenue: 2450000,
  todayEntries: 89,
  todayExits: 67,
}

const mockAlerts = [
  { id: 1, type: "critical" as const, message: "Capacidad crítica en Camiones (93%)" },
  { id: 2, type: "warning" as const, message: "Buses casi lleno (85%)" },
  { id: 3, type: "info" as const, message: "Mantenimiento programado zona A - 8:00 PM" },
]

export default function ParkingDashboard() {
  const [isDark, setIsDark] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<"car" | "bicycle" | "truck" | "bus" | null>(null)

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDark(prefersDark)
    if (prefersDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleDark = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const availableSpots = mockData.totalCapacity - mockData.totalOccupied

  return (
    <div className="min-h-screen bg-background">
      <TopBar isDark={isDark} onToggleDark={toggleDark} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards Row */}
        <KPICards
          activeVehicles={mockData.totalOccupied}
          availableSpots={availableSpots}
          dailyRevenue={mockData.dailyRevenue}
          todayEntries={mockData.todayEntries}
          todayExits={mockData.todayExits}
        />

        {/* Main Grid: Gauge + Alerts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Gauge Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Ocupación Total</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-8">
              <GaugeMeter
                value={mockData.totalOccupied}
                max={mockData.totalCapacity}
                size="lg"
                label={`Espacios ocupados: ${mockData.totalOccupied} / Total: ${mockData.totalCapacity}`}
              />
            </CardContent>
          </Card>

          {/* Alerts Panel */}
          <div className="lg:col-span-1">
            <AlertsPanel alerts={mockAlerts} />
          </div>
        </div>

        {/* Vehicle Cards Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Registro de Vehículos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <VehicleCard
              type="car"
              occupied={mockData.capacityByType.car.occupied}
              capacity={mockData.capacityByType.car.capacity}
              onClick={() => setSelectedVehicle("car")}
            />
            <VehicleCard
              type="bicycle"
              occupied={mockData.capacityByType.bicycle.occupied}
              capacity={mockData.capacityByType.bicycle.capacity}
              onClick={() => setSelectedVehicle("bicycle")}
            />
            <VehicleCard
              type="truck"
              occupied={mockData.capacityByType.truck.occupied}
              capacity={mockData.capacityByType.truck.capacity}
              onClick={() => setSelectedVehicle("truck")}
            />
            <VehicleCard
              type="bus"
              occupied={mockData.capacityByType.bus.occupied}
              capacity={mockData.capacityByType.bus.capacity}
              onClick={() => setSelectedVehicle("bus")}
            />
          </div>
        </section>
      </main>

      {/* Registration Modal */}
      {selectedVehicle && (
        <RegisterVehicleModal
          open={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          vehicleType={selectedVehicle}
        />
      )}
    </div>
  )
}
