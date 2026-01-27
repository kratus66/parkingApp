"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GaugeMeter } from "./gauge-meter"
import { Car, Bike, Truck, Bus } from "lucide-react"

interface VehicleCardProps {
  type: "car" | "bicycle" | "truck" | "bus"
  occupied: number
  capacity: number
  onClick: () => void
}

const vehicleConfig = {
  car: {
    icon: Car,
    label: "Auto",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  bicycle: {
    icon: Bike,
    label: "Bicicleta",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  truck: {
    icon: Truck,
    label: "Camión",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  bus: {
    icon: Bus,
    label: "Bus",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
}

export function VehicleCard({ type, occupied, capacity, onClick }: VehicleCardProps) {
  const config = vehicleConfig[type]
  const Icon = config.icon

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:border-primary/30 relative overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6 flex flex-col items-center gap-4 relative">
        <div className={`p-4 rounded-2xl ${config.bgColor} transition-transform group-hover:scale-110`}>
          <Icon className={`w-12 h-12 ${config.color}`} strokeWidth={1.5} />
        </div>

        <h3 className="text-lg font-semibold">{config.label}</h3>

        <GaugeMeter value={occupied} max={capacity} size="sm" showLabel={false} />

        <p className="text-sm text-muted-foreground">
          Ocupados <span className="font-semibold text-foreground">{occupied}</span> / Capacidad{" "}
          <span className="font-semibold text-foreground">{capacity}</span>
        </p>

        <Button
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
          variant="outline"
        >
          Registrar / Asignar puesto
        </Button>

        <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          Click para registrar
        </span>
      </CardContent>
    </Card>
  )
}
